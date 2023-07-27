/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { State } from 'types/redux/state';
import '../../styles/modal.css';
import { MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { addMeter } from '../../actions/meters';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { TrueFalseType } from '../../types/items';
import TimeZoneSelect from '../TimeZoneSelect';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { UnitData } from '../../types/redux/units';
import { unitsCompatibleWithUnit } from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { notifyUser } from '../../utils/input'
import { tooltipBaseStyle } from '../../styles/modalStyle';


// TODO Moved the possible meters/graphic units calculations up to the details component
// This was to prevent the calculations from being done on every load, but now requires them to be passed as props
interface CreateMeterModalComponentProps {
	possibleMeterUnits: Set<UnitData>;
	possibleGraphicUnits: Set<UnitData>;
}

/**
 * Defines the create meter modal form
 * @param props Component props
 * @returns Meter create element
 */
export default function CreateMeterModalComponent(props: CreateMeterModalComponentProps) {

	const dispatch = useDispatch();

	// Admin state so can get the default reading frequency.
	const adminState = useSelector((state: State) => state.admin)

	const defaultValues = {
		id: -99,
		identifier: '',
		name: '',
		area: 0,
		enabled: false,
		displayable: false,
		meterType: '',
		url: '',
		timeZone: '',
		gps: '',
		// Defaults of -999 (not to be confused with -99 which is no unit)
		// Purely for allowing the default select to be "select a ..."
		unitId: -999,
		defaultGraphicUnit: -999,
		note: '',
		cumulative: false,
		cumulativeReset: false,
		cumulativeResetStart: '',
		cumulativeResetEnd: '',
		endOnlyTime: false,
		readingGap: adminState.defaultMeterReadingGap,
		readingVariation: 0,
		readingDuplication: 1,
		timeSort: MeterTimeSortType.increasing,
		reading: 0.0,
		startTimestamp: '',
		endTimestamp: '',
		previousEnd: '',
		areaUnit: AreaUnitType.none,
		readingFrequency: adminState.defaultMeterReadingFrequency,
		minVal: adminState.defaultMeterMinimumValue,
		maxVal: adminState.defaultMeterMaximumValue,
		minDate: adminState.defaultMeterMinimumDate,
		maxDate: adminState.defaultMeterMaximumDate,
		maxError: adminState.defaultMeterMaximumErrors
	}

	const dropdownsStateDefaults = {
		possibleMeterUnits: props.possibleMeterUnits,
		possibleGraphicUnits: props.possibleGraphicUnits,
		compatibleUnits: props.possibleMeterUnits,
		incompatibleUnits: new Set<UnitData>(),
		compatibleGraphicUnits: props.possibleGraphicUnits,
		incompatibleGraphicUnits: new Set<UnitData>()
	}

	/* State */
	// To make this consistent with EditUnitModalComponent, we don't pass show and close via props
	// even this one does have other props.
	// Modal show
	const [showModal, setShowModal] = useState(false);
	const handleShow = () => setShowModal(true);

	// Handlers for each type of input change
	const [state, setState] = useState(defaultValues);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	}

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	}

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: Number(e.target.value) });
	}

	const handleTimeZoneChange = (timeZone: string) => {
		setState({ ...state, ['timeZone']: timeZone });
	}

	// Dropdowns
	const [dropdownsState, setDropdownsState] = useState(dropdownsStateDefaults);

	/* Create Meter Validation:
		Name cannot be blank
		Area must be positive or zero
		If area is nonzero, area unit must be set
		Reading Gap must be greater than zero
		Reading Variation must be greater than zero
		Reading Duplication must be between 1 and 9
		Reading frequency cannot be blank
		Unit and Default Graphic Unit must be set (can be to no unit)
		Meter type must be set
		If displayable is true and unitId is set to -99, warn admin
	*/
	const [validMeter, setValidMeter] = useState(false);
	useEffect(() => {
		setValidMeter(
			state.name !== '' &&
			(state.area === 0 || (state.area > 0 && state.areaUnit !== AreaUnitType.none)) &&
			state.readingGap >= 0 &&
			state.readingVariation >= 0 &&
			(state.readingDuplication >= 1 && state.readingDuplication <= 9) &&
			state.readingFrequency !== '' &&
			state.unitId !== -999 &&
			state.defaultGraphicUnit !== -999 &&
			state.meterType !== ''
		);
	}, [
		state.area,
		state.name,
		state.readingGap,
		state.readingVariation,
		state.readingDuplication,
		state.areaUnit,
		state.readingFrequency,
		state.unitId,
		state.defaultGraphicUnit,
		state.meterType
	]);
	/* End State */

	// Reset the state to default values
	// This would also benefit from a single state changing function for all state
	const resetState = () => {
		setState(defaultValues);
	}

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};

	// Unlike edit, we decided to discard and inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Submit
	const handleSubmit = () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// TODO Maybe should do as a single popup?

		// Set default identifier as name if left blank
		state.identifier = (!state.identifier || state.identifier.length === 0) ? state.name : state.identifier;

		// Check GPS entered.
		// Validate GPS is okay and take from string to GPSPoint to submit.
		const gpsInput = state.gps;
		let gps: GPSPoint | null = null;
		const latitudeIndex = 0;
		const longitudeIndex = 1;
		// If the user input a value then gpsInput should be a string.
		// null came from the DB and it is okay to just leave it - Not a string.
		if (typeof gpsInput === 'string') {
			if (isValidGPSInput(gpsInput)) {
				// Clearly gpsInput is a string but TS complains about the split so cast.
				const gpsValues = (gpsInput as string).split(',').map((value: string) => parseFloat(value));
				// It is valid and needs to be in this format for routing.
				gps = {
					longitude: gpsValues[longitudeIndex],
					latitude: gpsValues[latitudeIndex]
				};
				// gpsInput must be of type string but TS does not think so so cast.
			} else if ((gpsInput as string).length !== 0) {
				// GPS not okay. Only true if some input.
				// TODO isValidGPSInput currently pops up an alert so not doing it here, may change
				// so leaving code commented out.
				// notifyUser(translate('input.gps.range') + state.gps + '.');
				inputOk = false;
			}
		}

		if (inputOk) {
			// The input passed validation.
			// The default value for timeZone is an empty string but that should be null for DB.
			// See below for usage of timeZoneValue.
			const timeZoneValue = (state.timeZone == '' ? null : state.timeZone);
			// GPS may have been updated so create updated state to submit.
			const submitState = { ...state, gps: gps, timeZone: timeZoneValue };
			// Submit new meter if checks where ok.
			dispatch(addMeter(submitState));
			resetState();
		} else {
			// Tell user that not going to update due to input issues.
			notifyUser(translate('meter.input.error'));
		}
	};

	// Update compatible units and graphic units set.
	// This works the same as Edit with a single useEffect. See Edit for an explanation but note
	// those issues were never seen with create.
	useEffect(() => {
		// Graphic units compatible with currently selected unit
		const compatibleGraphicUnits = new Set<UnitData>();
		// Graphic units incompatible with currently selected unit
		const incompatibleGraphicUnits = new Set<UnitData>();
		// If a unit has been selected that is not 'no unit'
		if (state.unitId != -999 && state.unitId != -99) {
			// Find all units compatible with the selected unit
			const unitsCompatibleWithSelectedUnit = unitsCompatibleWithUnit(state.unitId);
			dropdownsState.possibleGraphicUnits.forEach(unit => {
				// If current graphic unit exists in the set of compatible graphic units OR if the current graphic unit is 'no unit'
				if (unitsCompatibleWithSelectedUnit.has(unit.id) || unit.id == -99) {
					compatibleGraphicUnits.add(unit);
				}
				else {
					incompatibleGraphicUnits.add(unit);
				}
			});
		}
		// No unit is selected
		else {
			// OED does not allow a default graphic unit if there is no unit so it must be -99.
			// We don't reset if it is currently -999 since want user to select something.
			state.defaultGraphicUnit = state.defaultGraphicUnit === -999 ? -999 : -99;
			dropdownsState.possibleGraphicUnits.forEach(unit => {
				// Only -99 is allowed.
				if (unit.id == -99) {
					compatibleGraphicUnits.add(unit);
				}
				else {
					incompatibleGraphicUnits.add(unit);
				}
			});
		}

		// Units compatible with currently selected graphic unit
		let compatibleUnits = new Set<UnitData>();
		// Units incompatible with currently selected graphic unit
		const incompatibleUnits = new Set<UnitData>();
		// If a default graphic unit has been selected that is not 'no unit'
		if (state.defaultGraphicUnit != -999 && state.defaultGraphicUnit != -99) {
			// Find all units compatible with the selected graphic unit
			dropdownsState.possibleMeterUnits.forEach(unit => {
				// Graphic units compatible with the current meter unit
				const compatibleGraphicUnitsForUnit = unitsCompatibleWithUnit(unit.id);
				// If the currently selected default graphic unit exists in the set of graphic units compatible with the current meter unit
				// Also add the 'no unit' unit
				if (compatibleGraphicUnitsForUnit.has(state.defaultGraphicUnit) || unit.id == -99) {
					// add the current meter unit to the list of compatible units
					compatibleUnits.add(unit);
				}
				else {
					// add the current meter unit to the list of incompatible units
					incompatibleUnits.add(unit);
				}
			});
		}
		// No default graphic unit is selected
		else {
			// All units are compatible
			compatibleUnits = new Set(dropdownsState.possibleMeterUnits);
		}
		setDropdownsState({
			...dropdownsState,
			// The new set helps avoid repaints.
			compatibleGraphicUnits: new Set(compatibleGraphicUnits),
			incompatibleGraphicUnits: new Set(incompatibleGraphicUnits),
			compatibleUnits: new Set(compatibleUnits),
			incompatibleUnits: new Set(incompatibleUnits)
		});
		// If either unit or the status of pik changes then this needs to be done.
		// pik is needed since the compatible units is not correct until pik is available.
	}, [state.unitId, state.defaultGraphicUnit, ConversionArray.pikAvailable()]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		// Only an admin can create a meter.
		tooltipCreateMeterView: 'help.admin.metercreate'
	};

	// This is a bit of a hack. The defaultValues set the time zone to the empty string.
	// This makes the type a string and no easy way was found to allow null too.
	// The DB stores null for no choice and TimeZoneSelect expects null for no choice.
	// To get around this, a new variable is used for the menu options so it can have
	// both values where the empty string is converted to null.
	const timeZoneValue: string | null = (state.timeZone === '' ? null : state.timeZone);

	return (
		<>
			{/* Show modal button */}
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage id="meter.create" />
			</Button>
			<Modal isOpen={showModal} toggle={handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="meter.create" />
					<TooltipHelpContainer page='meters-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='meters-create' helpTextId={tooltipStyle.tooltipCreateMeterView} />
					</div>
				</ModalHeader>
				{/* when any of the Meter values are changed call one of the functions. */}
				<ModalBody><Container>
					<Row xs='1' lg='2'>
						{/* Identifier input */}
						<Col><FormGroup>
							<Label for='identifier'>{translate('meter.identifier')}</Label>
							<Input
								id='identifier'
								name='identifier'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={state.identifier} />
						</FormGroup></Col>
						{/* Name input */}
						<Col><FormGroup>
							<Label for='name'>{translate('meter.name')}</Label>
							<Input
								id='name'
								name='name'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								required value={state.name}
								invalid={state.name === ''} />
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* meter unit input */}
						<Col><FormGroup>
							<Label for='unitId'> {translate('meter.unitName')}</Label>
							<Input
								id='unitId'
								name='unitId'
								type='select'
								value={state.unitId}
								onChange={e => handleNumberChange(e)}
								invalid={state.unitId === -999}>
								{<option
									value={-999}
									key={-999}
									hidden={state.unitId !== -999}
									disabled>
									{translate('select.unit')}
								</option>}
								{Array.from(dropdownsState.compatibleUnits).map(unit => {
									return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
								})}
								{Array.from(dropdownsState.incompatibleUnits).map(unit => {
									return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
								})}
							</Input>
							<FormFeedback><FormattedMessage id="error.required" /></FormFeedback>
						</FormGroup></Col>
						{/* default graphic unit input */}
						<Col><FormGroup>
							<Label for='defaultGraphicUnit'>{translate('meter.defaultGraphicUnit')}</Label>
							<Input
								id='defaultGraphicUnit'
								name='defaultGraphicUnit'
								type='select'
								value={state.defaultGraphicUnit}
								onChange={e => handleNumberChange(e)}
								invalid={state.defaultGraphicUnit === -999}>
								{<option
									value={-999}
									key={-999}
									hidden={state.defaultGraphicUnit !== -999}
									disabled>
									{translate('select.unit')}
								</option>}
								{Array.from(dropdownsState.compatibleGraphicUnits).map(unit => {
									return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
								})}
								{Array.from(dropdownsState.incompatibleGraphicUnits).map(unit => {
									return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
								})}
							</Input>
							<FormFeedback><FormattedMessage id="error.required" /></FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Enabled input */}
						<Col><FormGroup>
							<Label for='enabled'>{translate('meter.enabled')}</Label>
							<Input
								id='enabled'
								name='enabled'
								type='select'
								value={state.enabled.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* Displayable input */}
						<Col><FormGroup>
							<Label for='displayable'>{translate('meter.displayable')}</Label>
							<Input
								id='displayable'
								name='displayable'
								type='select'
								value={state.displayable.toString()}
								onChange={e => handleBooleanChange(e)}
								invalid={state.displayable && state.unitId === -99}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
							<FormFeedback>
								<FormattedMessage id="error.displayable" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Meter type input */}
						<Col><FormGroup>
							<Label for='meterType'>{translate('meter.type')}</Label>
							<Input
								id='meterType'
								name='meterType'
								type='select'
								value={state.meterType}
								onChange={e => handleStringChange(e)}
								invalid={state.meterType === ''}>
								{/* The default value is a blank string so then tell user to select one. */}
								{<option
									value={''}
									key={''}
									hidden={state.meterType !== ''}
									disabled>
									{translate('select.meter.type')}
								</option>}
								{/* The dB expects lowercase. */}
								{Object.keys(MeterType).map(key => {
									return (<option value={key.toLowerCase()} key={key.toLowerCase()}>{`${key}`}</option>)
								})}
							</Input>
							<FormFeedback><FormattedMessage id="error.required" /></FormFeedback>
						</FormGroup></Col>
						{/* Meter reading frequency */}
						<Col><FormGroup>
							<Label for='readingFrequency'>{translate('meter.readingFrequency')}</Label>
							<Input
								id='readingFrequency'
								name='readingFrequency'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={state.readingFrequency}
								invalid={state.readingFrequency === ''}/>
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* URL input */}
						<Col><FormGroup>
							<Label for='url'>{translate('meter.url')}</Label>
							<Input
								id='url'
								name='url'
								type='text'
								autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={state.url} />
						</FormGroup></Col>
						{/* GPS input */}
						<Col><FormGroup>
							<Label for='gps'>{translate('meter.gps')}</Label>
							<Input
								id='gps'
								name='gps'
								type='text'
								onChange={e => handleStringChange(e)}
								value={state.gps} />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Area input */}
						<Col><FormGroup>
							<Label for='area'>{translate('meter.area')}</Label>
							<Input
								id='area'
								name='area'
								type='number'
								min='0'
								defaultValue={state.area}
								onChange={e => handleNumberChange(e)}
								invalid={state.area < 0} />
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
						{/* meter area unit input */}
						<Col><FormGroup>
							<Label for='areaUnit'>{translate('meter.area.unit')}</Label>
							<Input
								id='areaUnit'
								name='areaUnit'
								type='select'
								value={state.areaUnit}
								onChange={e => handleStringChange(e)}
								invalid={state.area > 0 && state.areaUnit === AreaUnitType.none}>
								{Object.keys(AreaUnitType).map(key => {
									return (<option value={key} key={key}>{translate(`AreaUnitType.${key}`)}</option>)
								})}
							</Input>
							<FormFeedback>
								<FormattedMessage id="area.but.no.unit" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					{/* note input */}
					<FormGroup>
						<Label for='note'>{translate('meter.note')}</Label>
						<Input
							id='note'
							name='note'
							type='textarea'
							onChange={e => handleStringChange(e)}
							value={state.note}
							placeholder='Note' />
					</FormGroup>
					<Row xs='1' lg='2'>
						{/* cumulative input */}
						<Col><FormGroup>
							<Label for='cumulative'>{translate('meter.cumulative')}</Label>
							<Input
								id='cumulative'
								name='cumulative'
								type='select'
								value={state.cumulative.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup>
						{/* cumulativeReset input */}
						<FormGroup>
							<Label for='cumulativeReset'>{translate('meter.cumulativeReset')}</Label>
							<Input
								id='cumulativeReset'
								name='cumulativeReset'
								type='select'
								value={state.cumulativeReset.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* cumulativeResetStart input */}
						<Col><FormGroup>
							<Label for='cumulativeResetStart'>{translate('meter.cumulativeResetStart')}</Label>
							<Input
								id='cumulativeResetStart'
								name='cumulativeResetStart'
								type='text'
								autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={state.cumulativeResetStart}
								placeholder='HH:MM:SS' />
						</FormGroup>
						{/* cumulativeResetEnd input */}
						<FormGroup>
							<Label for='cumulativeResetEnd'>{translate('meter.cumulativeResetEnd')}</Label>
							<Input
								id='cumulativeResetEnd'
								name='cumulativeResetEnd'
								type='text'
								autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={state.cumulativeResetEnd}
								placeholder='HH:MM:SS' />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* endOnlyTime input */}
						<Col><FormGroup>
							<Label for='endOnlyTime'>{translate('meter.endOnlyTime')}</Label>
							<Input
								id='endOnlyTime'
								name='endOnlyTime'
								type='select'
								value={state.endOnlyTime.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* readingGap input */}
						<Col><FormGroup>
							<Label for='readingGap'>{translate('meter.readingGap')}</Label>
							<Input
								id='readingGap'
								name='readingGap'
								type='number'
								onChange={e => handleNumberChange(e)}
								min='0'
								defaultValue={state.readingGap}
								invalid={state?.readingGap < 0}/>
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* readingVariation input */}
						<Col><FormGroup>
							<Label for='readingVariation'>{translate('meter.readingVariation')}</Label>
							<Input
								id='readingVariation'
								name='readingVariation'
								type='number'
								onChange={e => handleNumberChange(e)}
								min='0'
								defaultValue={state.readingVariation}
								invalid={state?.readingVariation < 0} />
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
						{/* readingDuplication input */}
						<Col><FormGroup>
							<Label for='readingDuplication'>{translate('meter.readingDuplication')}</Label>
							<Input
								id='readingDuplication'
								name='readingDuplication'
								type='number'
								onChange={e => handleNumberChange(e)}
								step='1'
								min='1'
								max='9'
								defaultValue={state.readingDuplication}
								invalid={state?.readingDuplication < 1 || state?.readingDuplication > 9}/>
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: '1', max: '9'}}  />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* timeSort input */}
						<Col><FormGroup>
							<Label for='timeSort'>{translate('meter.timeSort')}</Label>
							<Input
								id='timeSort'
								name='timeSort'
								type='select'
								value={state.timeSort}
								onChange={e => handleStringChange(e)}>
								{Object.keys(MeterTimeSortType).map(key => {
									// This is a bit of a hack but it should work fine. The TypeSortTypes and MeterTimeSortType should be in sync.
									// The translation is on the former so we use that enum name there but loop on the other to get the value desired.
									return (<option value={key} key={key}>{translate(`TimeSortTypes.${key}`)}</option>)
								})}
							</Input>
						</FormGroup>
						{/* Timezone input */}
						<FormGroup>
							<Label>{translate('meter.time.zone')}</Label>
							<TimeZoneSelect current={timeZoneValue} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
						</FormGroup>
						{/* reading input */}
						<FormGroup>
							<Label for='reading'>{translate('meter.reading')}</Label>
							<Input
								id='reading'
								name='reading'
								type='number'
								onChange={e => handleNumberChange(e)}
								defaultValue={state.reading} />
						</FormGroup></Col>
						{/* startTimestamp input */}
						<Col><FormGroup>
							<Label for='startTimestamp'>{translate('meter.startTimeStamp')}</Label>
							<Input
								id='startTimestamp'
								name='startTimestamp'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={state.startTimestamp} />
						</FormGroup>
						{/* endTimestamp input */}
						<FormGroup>
							<Label for='endTimestamp'>{translate('meter.endTimeStamp')}</Label>
							<Input
								id='endTimestamp'
								name='endTimestamp'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={state.endTimestamp} />
						</FormGroup>
						{/* previousEnd input */}
						<FormGroup>
							<Label for='previousEnd'>{translate('meter.previousEnd')}</Label>
							<Input
								id='previousEnd'
								name='previousEnd'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={state.previousEnd} />
						</FormGroup>
						{/* minVal input */}
						<FormGroup>
							<Label for='minVal'>{translate('meter.minVal')}</Label>
							<Input
								id='minVal'
								name='minVal'
								type='number'
								onChange={e => handleNumberChange(e)}
								min="0"
								defaultValue={state.minVal}
								value={state.minVal} />
						</FormGroup>
						{/* maxVal input */}
						<FormGroup>
						<Label for='minVal'>{translate('meter.maxVal')}</Label>
							<Input
								id='maxVal'
								name='maxVal'
								type='number'
								onChange={e => handleNumberChange(e)}
								min="0"
								defaultValue={state.maxVal}
								value={state.maxVal} />
						</FormGroup>
						{/* minDate input */}
						<FormGroup>
						<Label for='minVal'>{translate('meter.minDate')}</Label>
							<Input
								id='minDate'
								name='minDate'
								type='text'
								onChange={e => handleStringChange(e)}
								min="0"
								defaultValue={state.minDate}
								value={state.minDate} />
						</FormGroup>
						{/* maxDate input */}
						<FormGroup>
						<Label for='minVal'>{translate('meter.maxDate')}</Label>
							<Input
								id='maxDate'
								name='maxDate'
								type='text'
								onChange={e => handleStringChange(e)}
								min="0"
								defaultValue={state.maxDate}
								value={state.maxDate} />
						</FormGroup>
						{/* maxError input */}
						<FormGroup>
						<Label for='minVal'>{translate('meter.maxError')}</Label>
							<Input
								id='maxError'
								name='maxError'
								type='number'
								onChange={e => handleNumberChange(e)}
								min="0"
								defaultValue={state.maxError}
								value={state.maxError} />
						</FormGroup></Col>
					</Row>
				</Container></ModalBody>
				<ModalFooter>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} disabled={!validMeter}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

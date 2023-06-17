/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { State } from 'types/redux/state';
import '../../styles/modal.css';
import { MeterData, MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { submitEditedMeter } from '../../actions/meters';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { TrueFalseType } from '../../types/items';
import TimeZoneSelect from '../TimeZoneSelect';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { UnitData } from '../../types/redux/units';
import { unitsCompatibleWithUnit } from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { notifyUser, getGPSString, nullToEmptyString, noUnitTranslated } from '../../utils/input';
import { tableStyle, tooltipBaseStyle } from '../../styles/modalStyle';

interface EditMeterModalComponentProps {
	show: boolean;
	meter: MeterData;
	possibleMeterUnits: Set<UnitData>;
	possibleGraphicUnits: Set<UnitData>;
	// passed in to handle closing the modal
	handleClose: () => void;
}

export default function EditMeterModalComponent(props: EditMeterModalComponentProps) {
	const dispatch = useDispatch();

	// The current meter's state of meter being edited. It should always be valid.
	const meterState = useSelector((state: State) => state.meters.byMeterID[props.meter.id]);

	// Set existing meter values
	const values = {
		id: props.meter.id,
		name: props.meter.name,
		url: props.meter.url,
		enabled: props.meter.enabled,
		displayable: props.meter.displayable,
		meterType: props.meter.meterType,
		timeZone: props.meter.timeZone,
		gps: props.meter.gps,
		identifier: props.meter.identifier,
		note: props.meter.note,
		area: props.meter.area,
		cumulative: props.meter.cumulative,
		cumulativeReset: props.meter.cumulativeReset,
		cumulativeResetStart: props.meter.cumulativeResetStart,
		cumulativeResetEnd: props.meter.cumulativeResetEnd,
		readingGap: props.meter.readingGap,
		readingVariation: props.meter.readingVariation,
		readingDuplication: props.meter.readingDuplication,
		timeSort: props.meter.timeSort,
		endOnlyTime: props.meter.endOnlyTime,
		reading: props.meter.reading,
		startTimestamp: props.meter.startTimestamp,
		endTimestamp: props.meter.endTimestamp,
		previousEnd: props.meter.previousEnd,
		unitId: props.meter.unitId,
		defaultGraphicUnit: props.meter.defaultGraphicUnit,
		areaUnit: props.meter.areaUnit,
		readingFrequency: props.meter.readingFrequency
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
	// Handlers for each type of input change
	const [state, setState] = useState(values);

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

	/* Edit Meter Validation:
		Name cannot be blank
		Area must be positive or zero
		If area is nonzero, area unit must be set
		Reading Gap must be greater than zero
		Reading Variation must be greater than zero
		Reading Duplication must be between 1 and 9
		Reading frequency cannot be blank
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
			state.readingFrequency !== ''
		);
	}, [state.area, state.name, state.readingGap, state.readingVariation, state.readingDuplication, state.areaUnit, state.readingFrequency]);
	/* End State */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateMeterModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit meters will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setState(values);
	}

	const handleClose = () => {
		props.handleClose();
		resetState();
	}

	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input but this would not detect if edited but no change made.
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Check for changes by comparing state to props
		const meterHasChanges =
			(
				props.meter.identifier != state.identifier ||
				props.meter.name != state.name ||
				props.meter.area != state.area ||
				props.meter.enabled != state.enabled ||
				props.meter.displayable != state.displayable ||
				props.meter.meterType != state.meterType ||
				props.meter.url != state.url ||
				props.meter.timeZone != state.timeZone ||
				props.meter.gps != state.gps ||
				props.meter.unitId != state.unitId ||
				props.meter.defaultGraphicUnit != state.defaultGraphicUnit ||
				props.meter.note != state.note ||
				props.meter.cumulative != state.cumulative ||
				props.meter.cumulativeReset != state.cumulativeReset ||
				props.meter.cumulativeResetStart != state.cumulativeResetStart ||
				props.meter.cumulativeResetEnd != state.cumulativeResetEnd ||
				props.meter.endOnlyTime != state.endOnlyTime ||
				props.meter.reading != state.reading ||
				props.meter.readingGap != state.readingGap ||
				props.meter.readingVariation != state.readingVariation ||
				props.meter.readingDuplication != state.readingDuplication ||
				props.meter.timeSort != state.timeSort ||
				props.meter.startTimestamp != state.startTimestamp ||
				props.meter.endTimestamp != state.endTimestamp ||
				props.meter.previousEnd != state.previousEnd ||
				props.meter.areaUnit != state.areaUnit ||
				props.meter.readingFrequency != state.readingFrequency
			);

		// Only validate and store if any changes.
		if (meterHasChanges) {
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
					// GPS not okay.
					// TODO isValidGPSInput currently tops up an alert so not doing it here, may change
					// so leaving code commented out.
					// notifyUser(translate('input.gps.range') + state.gps + '.');
					inputOk = false;
				}
			}

			if (inputOk) {
				// The input passed validation.
				// GPS may have been updated so create updated state to submit.
				const submitState = { ...state, gps: gps };
				// Submit new meter if checks where ok.
				dispatch(submitEditedMeter(submitState));
				dispatch(removeUnsavedChanges());
			} else {
				// Tell user that not going to update due to input issues.
				notifyUser(translate('meter.input.error'));
			}
		}
	};

	// TODO This useEffect can probably be extracted into a single function in the future, as create meter also uses them.
	// Note there are now differences, e.g., -999 check.

	// Update compatible units and graphic units set.
	// Note an earlier version had two useEffect calls: one for each menu. This lead to an issue because it did separate
	// setState calls that were asynchronous. As a result, the second one could use state state when doing ...dropdownsState
	// and lose the first changes. Fusing them fixes this.
	useEffect(() => {
		// Graphic units compatible with currently selected unit
		const compatibleGraphicUnits = new Set<UnitData>();
		// Graphic units incompatible with currently selected unit
		const incompatibleGraphicUnits = new Set<UnitData>();
		// If unit is not 'no unit'
		if (state.unitId != -99) {
			// Find all units compatible with the selected unit
			const unitsCompatibleWithSelectedUnit = unitsCompatibleWithUnit(state.unitId);
			dropdownsState.possibleGraphicUnits.forEach(unit => {
				// If current graphic unit exists in the set of compatible graphic units OR if the current graphic unit is 'no unit'
				if (unitsCompatibleWithSelectedUnit.has(unit.id) || unit.id === -99) {
					compatibleGraphicUnits.add(unit);
				} else {
					incompatibleGraphicUnits.add(unit);
				}
			});
		} else {
			// No unit is selected
			// OED does not allow a default graphic unit if there is no unit so it must be -99.
			state.defaultGraphicUnit = -99;
			dropdownsState.possibleGraphicUnits.forEach(unit => {
				// Only -99 is allowed.
				if (unit.id === -99) {
					compatibleGraphicUnits.add(unit);
				} else {
					incompatibleGraphicUnits.add(unit);
				}
			});
		}

		// Units compatible with currently selected graphic unit
		let compatibleUnits = new Set<UnitData>();
		// Units incompatible with currently selected graphic unit
		const incompatibleUnits = new Set<UnitData>();
		// If a default graphic unit is not 'no unit'
		if (state.defaultGraphicUnit !== -99) {
			// Find all units compatible with the selected graphic unit
			dropdownsState.possibleMeterUnits.forEach(unit => {
				// Graphic units compatible with the current meter unit
				const compatibleGraphicUnits = unitsCompatibleWithUnit(unit.id);
				// If the currently selected default graphic unit exists in the set of graphic units compatible with the current meter unit
				// Also add the 'no unit' unit
				if (compatibleGraphicUnits.has(state.defaultGraphicUnit) || unit.id === -99) {
					// add the current meter unit to the list of compatible units
					compatibleUnits.add(unit.id === -99 ? noUnitTranslated() : unit);
				} else {
					// add the current meter unit to the list of incompatible units
					incompatibleUnits.add(unit);
				}
			});
		} else {
			// No default graphic unit is selected
			// All units are compatible
			compatibleUnits = new Set(dropdownsState.possibleMeterUnits);
		}
		// Update the state
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

	// If you edit and return to this page then want to see the DB result formatted for users
	// for the readingFrequency. Since the update on save is to the global state, need to
	// change the state used for display here. Note if you change readingFrequency but it
	// is only a change in format and not value then this will not update because Redux is
	// smart and sees they are the same. This is not really an issue to worry about but
	// noted for others.
	useEffect(() => {
		setState({
			...state,
			readingFrequency: meterState.readingFrequency
		})
	}, [meterState.readingFrequency]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		// Only and admin can edit a meter.
		tooltipEditMeterView: 'help.admin.meteredit'
	};

	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose}>
				<ModalHeader>
					<FormattedMessage id="edit.meter" />
					<TooltipHelpContainer page='meters-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='meters-edit' helpTextId={tooltipStyle.tooltipEditMeterView} />
					</div>
				</ModalHeader>
				{/* when any of the Meter values are changed call one of the functions. */}
				<ModalBody style={tableStyle}>
					{/* Identifier input */}
					<FormGroup>
						<Label for='identifier'>{translate('meter.identifier')}</Label>
						<Input
							id='identifier'
							name="identifier"
							type='text'
							autoComplete='on'
							onChange={e => handleStringChange(e)}
							value={state.identifier} />
					</FormGroup>
					{/* Name input */}
					<FormGroup>
						<Label for='name'>{translate('meter.name')}</Label>
						<Input
							id='name'
							name='name'
							type='text'
							autoComplete='on'
							onChange={e => handleStringChange(e)}
							value={state.name}
							invalid={state.name === ''} />
						<FormFeedback>
							<FormattedMessage id="error.required" />
						</FormFeedback>
					</FormGroup>
					{/* meter unit input */}
					<FormGroup>
						<Label for='unitId'>{translate('meter.unitName')}</Label>
						<Input
							id='unitId'
							name="unitId"
							type='select'
							value={state.unitId}
							onChange={e => handleNumberChange(e)}>
							{Array.from(dropdownsState.compatibleUnits).map(unit => {
								return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
							})}
							{Array.from(dropdownsState.incompatibleUnits).map(unit => {
								return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
							})}
						</Input>
					</FormGroup>
					{/* default graphic unit input */}
					<FormGroup>
						<Label for='defaultGraphicUnit'>{translate('meter.defaultGraphicUnit')}</Label>
						<Input
							id='defaultGraphicUnit'
							name='defaultGraphicUnit'
							type='select'
							value={state.defaultGraphicUnit}
							onChange={e => handleNumberChange(e)}>
							{Array.from(dropdownsState.compatibleGraphicUnits).map(unit => {
								return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
							})}
							{Array.from(dropdownsState.incompatibleGraphicUnits).map(unit => {
								return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
							})}
						</Input>
					</FormGroup>
					{/* Enabled input */}
					<FormGroup>
						<Label for='enabled'>{translate('meter.enabled')}</Label>
						<Input
							id='enabled'
							name='enabled'
							type='select'
							// There is a subtle difference from create. In crete the state is set to
							// the default values so always is there. In edit, it comes via props so
							// it may not be set before the meter state is fetched. This probably only
							// happens when your reload one of these pages but to avoid issues it uses
							// the ? to avoid access. This only applies to items where you dereference
							// the state value such as .toString() here.
							value={state.enabled?.toString()}
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
							})}
						</Input>
					</FormGroup>
					{/* Displayable input */}
					<FormGroup>
						<Label for='displayable'>{translate('meter.displayable')}</Label>
						<Input
							id='displayable'
							name='displayable'
							type='select'
							value={state.displayable?.toString()}
							onChange={e => handleBooleanChange(e)}
							invalid={state.displayable && state.unitId === -99}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
							})}
						</Input>
						<FormFeedback>
							<FormattedMessage id="error.displayable" />
						</FormFeedback>
					</FormGroup>
					{/* Meter type input */}
					<FormGroup>
						<Label for='meterType'>{translate('meter.type')}</Label>
						<Input
							id='meterType'
							name='meterType'
							type='select'
							value={state.meterType}
							onChange={e => handleStringChange(e)}>
							{/* The dB expects lowercase. */}
							{Object.keys(MeterType).map(key => {
								return (<option value={key.toLowerCase()} key={key.toLowerCase()}>{`${key}`}</option>)
							})}
						</Input>
					</FormGroup>
					{/* Meter reading frequency */}
					<FormGroup>
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
					</FormGroup>
					{/* URL input */}
					<FormGroup>
						<Label for='url'>{translate('meter.url')}</Label>
						<Input
							id='url'
							name='url'
							type='text'
							autoComplete='off'
							onChange={e => handleStringChange(e)}
							value={nullToEmptyString(state.url)} />
					</FormGroup>
					{/* Area input */}
					<FormGroup>
						<Label for='area'>{translate('meter.area')}</Label>
						<Input
							id='area'
							name="area"
							type="number"
							min="0"
							defaultValue={state.area}
							onChange={e => handleNumberChange(e)}
							invalid={state.area < 0} />
						<FormFeedback>
							<FormattedMessage id="error.negative" />
						</FormFeedback>
					</FormGroup>
					{/* meter area unit input */}
					<FormGroup>
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
					</FormGroup>
					{/* GPS input */}
					<FormGroup>
						<Label for='gps'>{translate('meter.gps')}</Label>
						<Input
							id='gps'
							name='gps'
							type='text'
							autoComplete='on'
							onChange={e => handleStringChange(e)}
							value={getGPSString(state.gps)} />
					</FormGroup>
					{/* note input */}
					<FormGroup>
						<Label for='note'>{translate('meter.note')}</Label>
						<Input
							id='note'
							name='note'
							type='textarea'
							onChange={e => handleStringChange(e)}
							value={nullToEmptyString(state.note)}
							placeholder='Note' />
					</FormGroup>
					{/* cumulative input */}
					<FormGroup>
						<Label for='cumulative'>{translate('meter.cumulative')}</Label>
						<Input
							id='cumulative'
							name='cumulative'
							type='select'
							value={state.cumulative?.toString()}
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
							value={state.cumulativeReset?.toString()}
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
							})}
						</Input>
					</FormGroup>
					{/* cumulativeResetStart input */}
					<FormGroup>
						<Label for='cumulativeResetStart'>{translate('meter.cumulativeResetStart')}</Label>
						<Input
							id='cumulativeResetStart'
							name='cumulativeResetStart'
							type='text'
							autoComplete='off'
							onChange={e => handleStringChange(e)}
							value={state.cumulativeResetStart}
							placeholder="HH:MM:SS" />
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
							value={state?.cumulativeResetEnd}
							placeholder="HH:MM:SS" />
					</FormGroup>
					{/* endOnlyTime input */}
					<FormGroup>
						<Label for='endOnlyTime'>{translate('meter.endOnlyTime')}</Label>
						<Input
							id='endOnlyTime'
							name='endOnlyTime'
							type='select'
							value={state.endOnlyTime?.toString()}
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
							})}
						</Input>
					</FormGroup>
					{/* readingGap input */}
					<FormGroup>
						<Label for='readingGap'>{translate('meter.readingGap')}</Label>
						<Input
							id='readingGap'
							name='readingGap'
							type='number'
							onChange={e => handleNumberChange(e)}
							min="0"
							defaultValue={state?.readingGap}
							invalid={state?.readingGap < 0}/>
						<FormFeedback>
							<FormattedMessage id="error.negative" />
						</FormFeedback>
					</FormGroup>
					{/* readingVariation input */}
					<FormGroup>
						<Label for='readingVariation'>{translate('meter.readingVariation')}</Label>
						<Input
							id='readingVariation'
							name="readingVariation"
							type="number"
							onChange={e => handleNumberChange(e)}
							min="0"
							defaultValue={state?.readingVariation}
							invalid={state?.readingVariation < 0} />
						<FormFeedback>
							<FormattedMessage id="error.negative" />
						</FormFeedback>
					</FormGroup>
					{/* readingDuplication input */}
					<FormGroup>
						<Label for='readingDuplication'>{translate('meter.readingDuplication')}</Label>
						<Input
							id='readingDuplication'
							name="readingDuplication"
							type="number"
							onChange={e => handleNumberChange(e)}
							step="1"
							min="1"
							max="9"
							defaultValue={state?.readingDuplication}
							invalid={state?.readingDuplication < 1 || state?.readingDuplication > 9}/>
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: '1', max: '9'}}  />
						</FormFeedback>
					</FormGroup>
					{/* timeSort input */}
					<FormGroup>
						<Label for='timeSort'>{translate('meter.timeSort')}</Label>
						<Input
							id='timeSort'
							name='timeSort'
							type='select'
							value={state?.timeSort}
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
						<TimeZoneSelect current={state.timeZone} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
					</FormGroup>
					{/* reading input */}
					<FormGroup>
						<Label for='reading'>{translate('meter.reading')}</Label>
						<Input
							id='reading'
							name="reading"
							type="number"
							onChange={e => handleNumberChange(e)}
							defaultValue={state?.reading} />
					</FormGroup>
					{/* startTimestamp input */}
					<FormGroup>
						<Label for='startTimestamp'>{translate('meter.startTimeStamp')}</Label>
						<Input
							id='startTimestamp'
							name='startTimestamp'
							type='text'
							autoComplete='on'
							onChange={e => handleStringChange(e)}
							placeholder="YYYY-MM-DD HH:MM:SS"
							value={state?.startTimestamp} />
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
							placeholder="YYYY-MM-DD HH:MM:SS"
							value={state?.endTimestamp} />
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
							placeholder="YYYY-MM-DD HH:MM:SS"
							value={state?.previousEnd} />
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					{/* Hides the modal */}
					<Button onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSaveChanges} disabled={!validMeter}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

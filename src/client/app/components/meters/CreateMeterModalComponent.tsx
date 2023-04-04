/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from 'reactstrap';
import { State } from 'types/redux/state';
import { addMeter } from '../../actions/meters';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import '../../styles/modal.css';
import { ConversionArray } from '../../types/conversionArray';
import { TrueFalseType } from '../../types/items';
import { MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { UnitData } from '../../types/redux/units';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { unitsCompatibleWithUnit } from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { notifyUser } from '../../utils/input'

// TODO Moved the possible meters/graphic units calculations up to the details component
// This was to prevent the calculations from being done on every load, but now requires them to be passed as props
interface CreateMeterModalComponentProps {
	possibleMeterUnits: Set<UnitData>;
	possibleGraphicUnits: Set<UnitData>;
}

export default function CreateMeterModalComponent(props: CreateMeterModalComponentProps) {

	const dispatch = useDispatch();

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

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
		readingGap: 0,
		readingVariation: 0,
		readingDuplication: 1,
		timeSort: MeterTimeSortType.increasing,
		reading: 0.0,
		startTimestamp: '',
		endTimestamp: '',
		previousEnd: '',
		areaUnit: AreaUnitType.none
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

		// Check area is positive.
		if (state.area < 0) {
			notifyUser(translate('area.invalid') + state.area + '.');
			inputOk = false;
		// If the meter has an assigned area, it must have a unit
		} else if (state.area > 0 && state.areaUnit == AreaUnitType.none) {
			notifyUser(translate('area.but.no.unit'));
			inputOk = false;
		}

		// Check reading duplication is between 1 and 9.
		if (state.readingDuplication < 1 || state.readingDuplication > 9) {
			notifyUser(translate('duplication.invalid') + state.readingDuplication + '.');
			inputOk = false;
		}

		// A meter unit must be selected.
		if (state.unitId === -999) {
			notifyUser(translate('meter.unit.invalid'));
			inputOk = false;
		}

		// A meter default graphic unit must be selected.
		if (state.defaultGraphicUnit === -999) {
			notifyUser(translate('meter.graphic.invalid'));
			inputOk = false;
		}

		// A meter area unit must be selected if meter has area
		if (state.area !== 0 && state.areaUnit === AreaUnitType.none) {
			notifyUser(translate('meter.unit.invalid'));
			inputOk = false;
		}

		// A meter type must be selected.
		if (state.meterType === '') {
			notifyUser(translate('meter.type.invalid'));
			inputOk = false;
		}

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
		display: 'inline-block',
		fontSize: '60%',
		// Only an admin can create a meter.
		tooltipCreateMeterView: 'help.admin.metercreate'
	};

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}

	const tableStyle: React.CSSProperties = {
		width: '100%'
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
			<Button variant="Secondary" onClick={handleShow}>
				<FormattedMessage id="meter.create" />
			</Button>

			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="meter.create" />
						<TooltipHelpContainer page='meters-create' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='meters-create' helpTextId={tooltipStyle.tooltipCreateMeterView} />
						</div>
					</Modal.Title>
				</Modal.Header>
				{/* when any of the Meter values are changed call one of the functions. */}
				{loggedInAsAdmin && // only render when logged in as Admin
					<Modal.Body className="show-grid">
						<div id="container">
							<div id="modalChild">
								{/* Modal content */}
								<div className="container-fluid">
									<div style={tableStyle}>
										{/* Identifier input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.identifier" /></label><br />
											<Input
												name="identifier"
												type="text"
												onChange={e => handleStringChange(e)}
												value={state.identifier} />
										</div>
										{/* Name input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.name" /></label><br />
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												required value={state.name} />
										</div>
										{/* meter unit input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.unitName" /></label><br />
											<Input
												name="unitId"
												type='select'
												value={state.unitId}
												onChange={e => handleNumberChange(e)}>
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
										</div>
										{/* default graphic unit input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.defaultGraphicUnit" /></label><br />
											<Input
												name='defaultGraphicUnit'
												type='select'
												value={state.defaultGraphicUnit}
												onChange={e => handleNumberChange(e)}>
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
										</div>
										{/* Enabled input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.enabled" /></label><br />
											<Input
												name='enabled'
												type='select'
												value={state.enabled.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Displayable input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.displayable" /></label><br />
											<Input
												name='displayable'
												type='select'
												value={state.displayable.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Meter type input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.type" /></label><br />
											<Input
												name='meterType'
												type='select'
												value={state.meterType}
												onChange={e => handleStringChange(e)}>
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
										</div>
										{/* URL input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.url" /></label><br />
											<Input
												name='url'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.url} />
										</div>
										{/* Area input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.area" /></label><br />
											<Input
												name="area"
												type="number"
												step="0.01"
												min="0"
												value={state.area}
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* meter area unit input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="units.area" /></label><br />
											<Input
												name='areaUnit'
												type='select'
												value={state.areaUnit}
												onChange={e => handleStringChange(e)}>
												{Object.keys(AreaUnitType).map(key => {
													return (<option value={key} key={key}>{translate(`AreaUnitType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* GPS input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.gps" /></label><br />
											<Input
												name='gps'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.gps} />
										</div>
										{/* note input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.note" /></label><br />
											<Input
												name='note'
												type='textarea'
												onChange={e => handleStringChange(e)}
												value={state.note}
												placeholder='Note' />
										</div>
										{/* cumulative input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulative" /></label><br />
											<Input
												name='cumulative'
												type='select'
												value={state.cumulative.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* cumulativeReset input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeReset" /></label><br />
											<Input
												name='cumulativeReset'
												type='select'
												value={state.cumulativeReset.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* cumulativeResetStart input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetStart" /></label><br />
											<Input
												name='cumulativeResetStart'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.cumulativeResetStart}
												placeholder="HH:MM:SS" />
										</div>
										{/* cumulativeResetEnd input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetEnd" /></label><br />
											<Input
												name='cumulativeResetEnd'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.cumulativeResetEnd}
												placeholder="HH:MM:SS" />
										</div>
										{/* endOnlyTime input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endOnlyTime" /></label><br />
											<Input
												name='endOnlyTime'
												type='select'
												value={state.endOnlyTime.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* readingGap input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingGap" /></label><br />
											<Input
												name='readingGap'
												type='number'
												onChange={e => handleNumberChange(e)}
												step="0.01"
												min="0"
												value={state.readingGap} />
										</div>
										{/* readingVariation input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingVariation" /></label><br />
											<Input
												name="readingVariation"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="0.01"
												min="0"
												value={state.readingVariation} />
										</div>
										{/* readingDuplication input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingDuplication" /></label><br />
											<Input
												name="readingDuplication"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="1"
												min="1"
												max="9"
												value={state.readingDuplication} />
										</div>
										{/* timeSort input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.timeSort" /></label><br />
											<Input
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
										</div>
										{/* Timezone input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.time.zone" /></label><br />
											<TimeZoneSelect current={timeZoneValue} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
										</div>
										{/* reading input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.reading" /></label><br />
											<Input
												name="reading"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="0.01"
												value={state.reading} />
										</div>
										{/* startTimestamp input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.startTimeStamp" /></label><br />
											<Input
												name='startTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												value={state.startTimestamp} />
										</div>
										{/* endTimestamp input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endTimeStamp" /></label><br />
											<Input
												name='endTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												value={state.endTimestamp} />
										</div>
										{/* endTimestamp input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.previousEnd" /></label><br />
											<Input
												name='previousEnd'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												value={state.previousEnd} />
										</div>
									</div>
								</div>
							</div>
						</div>
					</Modal.Body>}
				<Modal.Footer>
					{/* Hides the modal */}
					<Button variant="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button variant="primary" onClick={handleSubmit} disabled={!state.name}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

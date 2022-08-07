/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { MeterData, MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import { useDispatch, useSelector } from 'react-redux';
import { submitEditedMeter } from '../../actions/meters';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { useState, useEffect } from 'react';
import '../../styles/Modal.unit.css';
import { TrueFalseType } from '../../types/items';
import TimeZoneSelect from '../TimeZoneSelect';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { State } from 'types/redux/state';
import { UnitData } from '../../types/redux/units';
import { unitsCompatibleWithUnit } from '../../utils/determineCompatibleUnits';

// Notifies user of msg.
// TODO isValidGPSInput uses alert so continue that. Maybe all should be changed but this impacts other parts of the code.
// Note this causes the modal to close but the state is not reset.
// Use a function so can easily change how it works.
function notifyUser(msg: string) {
	window.alert(msg);
}

// get string value from GPSPoint or null.
function getGPSString(gps: GPSPoint | null) {
	if (gps === null) {
		//  if gps is null return empty string value
		return '';
	}
	else if (typeof gps === 'object') {
		// if gps is an object parse GPSPoint and return string value
		const json = JSON.stringify({ gps });
		const obj = JSON.parse(json);
		return `${obj.gps.latitude}, ${obj.gps.longitude}`;
	}
	else {
		// Assume it is a string that was input.
		return gps
	}
}

// Checks if the input is null and returns empty string if that is the case. Otherwise return input.
// This is needed because React does not want values to be of type null for display and null is the
// state for some of the meter values. This only should change what is displayed and not the state or props.
function nullToEmptyString(item: any) {
	if (item === null) {
		return '';
	} else {
		return item;
	}
}

interface EditMeterModalComponentProps {
	show: boolean;
	meter: MeterData;
	possibleMeterUnits: Set<UnitData>;
	possibleGraphicUnits: Set<UnitData>;
	// passed in to handle closing the modal
	handleClose: () => void;
}

// Updated to hooks
export default function EditMeterModalComponent(props: EditMeterModalComponentProps) {
	const dispatch = useDispatch();

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// Set existing meter values
	const values = {
		id: props.meter.id,
		identifier: props.meter.identifier,
		name: props.meter.name,
		area: props.meter.area,
		enabled: props.meter.enabled,
		displayable: props.meter.displayable,
		meterType: props.meter.meterType,
		url: props.meter.url,
		timeZone: props.meter.timeZone,
		gps: props.meter.gps,
		unitId: props.meter.unitId,
		defaultGraphicUnit: props.meter.defaultGraphicUnit,
		note: props.meter.note,
		cumulative: props.meter.cumulative,
		cumulativeReset: props.meter.cumulativeReset,
		cumulativeResetStart: props.meter.cumulativeResetStart,
		cumulativeResetEnd: props.meter.cumulativeResetEnd,
		endOnlyTime: props.meter.endOnlyTime,
		reading: props.meter.reading,
		readingGap: props.meter.readingGap,
		readingVariation: props.meter.readingVariation,
		readingDuplication: props.meter.readingDuplication,
		timeSort: props.meter.timeSort,
		startTimestamp: props.meter.startTimestamp,
		endTimestamp: props.meter.endTimestamp
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

	// Track if it is the first load so that we can properly calculate the valid dropdowns for units
	const [isFirstLoad, setIsFirstLoad] = useState(true);

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
	// Side note, we could probably just set a boolean when any input i
	const handleSaveChanges = () => {

		// TODO why is this different than create in how handles GPS issue and also not checking others. Comment out for now.
		// if (isValidGPSInput(`${state.gps.latitude}, ${state.gps.longitude}`)) {
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		let submitState;
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
				props.meter.endTimestamp != state.endTimestamp
			);

		// Only validate and store if any changes.
		if (meterHasChanges) {
			// Check area is positive.
			// TODO For now allow zero so works with default value and DB. We should probably
			// make this better default than 0 (DB set to not null now).
			// if (state.area <= 0) {
			if (state.area < 0) {
				notifyUser(translate('area.invalid') + state.area + '.');
				inputOk = false;
			}

			// Check reading duplication is between 1 and 9.
			if (state.readingDuplication < 1 || state.readingDuplication > 9) {
				notifyUser(translate('duplication.invalid') + state.area + '.');
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
					const array = (gpsInput as string).split(',').map((value: string) => parseFloat(value));
					// It is valid and needs to be in this format for routing.
					gps = {
						longitude: array[longitudeIndex],
						latitude: array[latitudeIndex]
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
				// The input passed validation but only store if there are changes.
				// GPS was updated so create updated state to submit.
				// TODO need to type submitState?
				submitState = { ...state, gps: gps };
				// Submit new meter if checks where ok.
				dispatch(submitEditedMeter(submitState));

				if (state.identifier === '') {
					state.identifier = state.name;
				}
				dispatch(removeUnsavedChanges());
			} else {
				// Tell user that not going to update due to input issues.
				notifyUser(translate('meter.input.error'));
			}
		}
	};
	//These two below useEffects can probably be extracted into a single function in the future, as create meter also uses them


	// TODO DANGER WILL ROBINSON
	// This function does not work on the first render and I cannot figure out why
	// The function properly gets a list of incompatible graphic units but the state will not take them
	// The useEffect below it works fine and is written the same way
	// I am leaving it for now because it properly works after changing the unit select and changing it back
	// and it is better to work on the first render for one dropdown and all subsequent renders for both dropdowns
	// than to allow any units for both dropdowns always.
	// Perhaps someone can fix this in the future.

	// Update compatible graphic units set when unitId changes
	useEffect(() => {
		console.log(dropdownsStateDefaults == dropdownsState);
		// Graphic units compatible with currently selected unit
		let compatibleGraphicUnits = new Set<UnitData>();
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
			// All default graphic units are compatible
			compatibleGraphicUnits = new Set(dropdownsState.possibleGraphicUnits);
		}
		// Update the state
		setDropdownsState({
			...dropdownsState,
			compatibleGraphicUnits: new Set(compatibleGraphicUnits),
			incompatibleGraphicUnits: new Set(incompatibleGraphicUnits)});
		console.log('second check:', dropdownsStateDefaults == dropdownsState);
	}, [state.unitId]);

	// Update compatible units set when defaultGraphicUnitId changes
	useEffect(() => {
		// Units compatible with currently selected graphic unit
		let compatibleUnits = new Set<UnitData>();
		// Units incompatible with currently selected graphic unit
		const incompatibleUnits = new Set<UnitData>();
		// If a default graphic unit has been selected that is not 'no unit'
		if (state.defaultGraphicUnit != -999 && state.defaultGraphicUnit != -99) {
			// Find all units compatible with the selected graphic unit
			dropdownsState.possibleMeterUnits.forEach(unit => {
				// Graphic units compatible with the current meter unit
				const compatibleGraphicUnits = unitsCompatibleWithUnit(unit.id);
				// If the currently selected default graphic unit exists in the set of graphic units compatible with the current meter unit
				// Also add the 'no unit' unit
				if (compatibleGraphicUnits.has(state.defaultGraphicUnit) || unit.id == -99) {
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
		// Update the state
		setDropdownsState({
			...dropdownsState,
			compatibleUnits: new Set(compatibleUnits),
			incompatibleUnits: new Set(incompatibleUnits)});
	}, [state.defaultGraphicUnit]);


	// A bit of a hacky fix to guarantee the two useEffect functions below run on the first load
	useEffect(() => {
		if (isFirstLoad) {
			const unitIdCopy = state.unitId;
			const defaultGraphicUnitCopy = state.defaultGraphicUnit;
			setState({...state, unitId: unitIdCopy, defaultGraphicUnit: defaultGraphicUnitCopy});
			setIsFirstLoad(false);
		}
	});

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '60%',
		// Only and admin can edit a meter.
		tooltipEditMeterView: 'help.admin.meteredit'
	};

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}

	const tableStyle: React.CSSProperties = {
		width: '100%'
	};
	return (
		<>

			<Modal show={props.show} onHide={props.handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="edit.meter" />
						<TooltipHelpContainer page='meters' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='meters' helpTextId={tooltipStyle.tooltipEditMeterView} />
						</div>
					</Modal.Title>
				</Modal.Header>
				{/* when any of the meter are changed call one of the functions. */}
				{loggedInAsAdmin && // only render when logged in as Admin
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div style={tableStyle}>
									{/* Identifier input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="meter.identifier" /></label><br />
										<Input
											name="identifier"
											type="text"
											onChange={e => handleStringChange(e)}
											value={state.identifier} />
										<div />
										{/* Name input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.name" /></label><br />
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												required value={state.name} />
										</div>
										{/* UnitId input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.unitName" /></label><br />
											<Input
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
										</div>
										{/* default graphic unit input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.defaultGraphicUnit" /></label><br />
											<Input
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
										</div>
										{/* Enabled input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.enabled" /></label><br />
											<Input
												name='enabled'
												type='select'
												value={state.enabled?.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Displayable input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.displayable" /></label><br />
											<Input
												name='displayable'
												type='select'
												value={state.displayable?.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Meter type input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.type" /></label><br />
											<Input
												name='meterType'
												type='select'
												value={state.meterType}
												onChange={e => handleStringChange(e)}>
												{/* TODO Want to not do a specific selection but request user to do one but this causes an error. Also want it required.
													 Possible way is how done in src/client/app/components/TimeZoneSelect.tsx. */}
												{/* Want to do also for unit id and default graphic unit */}
												{/* <option disabled selected value> -- select an option -- </option> */}
													// The dB expects lowercase.
												{Object.keys(MeterType).map(key => {
													return (<option value={key.toLowerCase()} key={key.toLowerCase()}>{`${key}`}</option>)
												})}
											</Input>
										</div>
										{/* URL input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.url" /></label><br />
											<Input
												name='url'
												type='text'
												onChange={e => handleStringChange(e)}
												// value={state.url} />
												value={nullToEmptyString(state.url)} />
										</div>
										{/* Area input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.area" /></label><br />
											<Input
												name="area"
												type="number"
												step="0.01"
												min="0"
												// value={state.area}
												value={nullToEmptyString(state.area)}
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* GPS input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.gps" /></label><br />
											<Input
												name='gps'
												type='text'
												onChange={e => handleStringChange(e)}
												value={getGPSString(state.gps)} />
										</div>
										{/* note input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.note" /></label><br />
											<Input
												name='note'
												type='textarea'
												onChange={e => handleStringChange(e)}
												value={nullToEmptyString(state.note)}
												placeholder='Note' />
										</div>
										{/* cumulative input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulative" /></label><br />
											<Input
												name='cumulative'
												type='select'
												value={state.cumulative?.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* cumulativeReset input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeReset" /></label><br />
											<Input
												name='cumulativeReset'
												type='select'
												value={state.cumulativeReset?.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* cumulativeResetStart input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetStart" /></label><br />
											<Input
												name='cumulativeResetStart'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.cumulativeResetStart}
												placeholder="HH:MM:SS" />
										</div>
										{/* cumulativeResetEnd input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetEnd" /></label><br />
											<Input
												name='cumulativeResetEnd'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state?.cumulativeResetEnd}
												placeholder="HH:MM:SS" />
										</div>
										{/* endOnlyTime input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endOnlyTime" /></label><br />
											<Input
												name='endOnlyTime'
												type='select'
												value={state.endOnlyTime?.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* readingGap input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingGap" /></label><br />
											<Input
												name='readingGap'
												type='number'
												onChange={e => handleNumberChange(e)}
												step="0.01"
												min="0"
												value={state?.readingGap} />
										</div>
										{/* readingVariation input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingVariation" /></label><br />
											<Input
												name="readingVariation"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="0.01"
												min="0"
												value={state?.readingVariation} />
										</div>
										{/* readingDuplication input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingDuplication" /></label><br />
											<Input
												name="readingDuplication"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="1"
												min="1"
												max="9"
												value={state?.readingDuplication} />
										</div>
										{/* timeSort input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.timeSort" /></label><br />
											<Input
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
										</div>
										{/* Timezone input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.time.zone" /></label><br />
											{/* TODO This is not correctly choosing the default not timezone choice */}
											<TimeZoneSelect current={state.timeZone} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
										</div>
										{/* reading input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.reading" /></label><br />
											<Input
												name="reading"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="0.01"
												value={state?.reading} />
										</div>
										{/* startTimestamp input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.startTimeStamp" /></label><br />
											<Input
												name='startTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												value={state?.startTimestamp} />
										</div>
										{/* endTimestamp input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endTimeStamp" /></label><br />
											<Input
												name='endTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												value={state?.endTimestamp} />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Modal.Body> }
				<Modal.Footer>
					{/* Hides the modal */}
					<Button variant="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button variant="primary" onClick={handleSaveChanges} disabled={!state.name}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

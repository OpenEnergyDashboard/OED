/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
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
import { isRoleAdmin } from '../../utils/hasPermissions';
import { UnitData } from '../../types/redux/units';
import { unitsCompatibleWithUnit } from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { notifyUser, getGPSString, nullToEmptyString, noUnitTranslated } from '../../utils/input';
import { formInputStyle, tableStyle, requiredStyle, tooltipBaseStyle } from '../../styles/modalStyle';


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

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

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
		areaUnit: props.meter.areaUnit
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
				props.meter.areaUnit != state.areaUnit
			);

		// Only validate and store if any changes.
		if (meterHasChanges) {

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

			// Check reading gap is at least zero.
			if (state.readingGap < 0) {
				notifyUser(translate('reading.gap.invalid') + state.readingGap + '.');
				inputOk = false;
			}

			// Check reading variation is at least zero.
			if (state.readingVariation < 0) {
				notifyUser(translate('reading.variation.invalid') + state.readingVariation + '.');
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
			state.defaultGraphicUnit = -99;
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
		// If a default graphic unit is not 'no unit'
		if (state.defaultGraphicUnit != -99) {
			// Find all units compatible with the selected graphic unit
			dropdownsState.possibleMeterUnits.forEach(unit => {
				// Graphic units compatible with the current meter unit
				const compatibleGraphicUnits = unitsCompatibleWithUnit(unit.id);
				// If the currently selected default graphic unit exists in the set of graphic units compatible with the current meter unit
				// Also add the 'no unit' unit
				if (compatibleGraphicUnits.has(state.defaultGraphicUnit) || unit.id == -99) {
					// add the current meter unit to the list of compatible units
					compatibleUnits.add(noUnitTranslated());
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
		// Only and admin can edit a meter.
		tooltipEditMeterView: 'help.admin.meteredit'
	};

	return (
		<>
			<Modal show={props.show} onHide={props.handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="edit.meter" />
						<TooltipHelpContainer page='meters-edit' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='meters-edit' helpTextId={tooltipStyle.tooltipEditMeterView} />
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
										{/* Identifier input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.identifier" /></label>
											<Input
												name="identifier"
												type="text"
												onChange={e => handleStringChange(e)}
												value={state.identifier} />
										</div>
										{/* Name input */}
										<div style={formInputStyle}>
											<label>{translate('meter.name')} <label style={requiredStyle}>*</label></label>
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												required value={state.name} />
										</div>
										{/* meter unit input */}
										<div style={formInputStyle}>
											<label> {translate('meter.unitName')} <label style={requiredStyle}>*</label></label>
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
											<label>{translate('meter.defaultGraphicUnit')} <label style={requiredStyle}>*</label></label>
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
										{/* Enabled input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.enabled" /></label>
											<Input
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
										</div>
										{/* Displayable input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.displayable" /></label>
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
										{/* Meter type input */}
										<div style={formInputStyle}>
											<label>{translate('meter.type')} <label style={requiredStyle}>*</label></label>
											<Input
												name='meterType'
												type='select'
												value={state.meterType}
												onChange={e => handleStringChange(e)}>
												{/* The dB expects lowercase. */}
												{Object.keys(MeterType).map(key => {
													return (<option value={key.toLowerCase()} key={key.toLowerCase()}>{`${key}`}</option>)
												})}
											</Input>
										</div>
										{/* URL input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.url" /></label>
											<Input
												name='url'
												type='text'
												onChange={e => handleStringChange(e)}
												value={nullToEmptyString(state.url)} />
										</div>
										{/* Area input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.area" /></label>
											<Input
												name="area"
												type="number"
												min="0"
												defaultValue={state.area}
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
											<label><FormattedMessage id="meter.gps" /></label>
											<Input
												name='gps'
												type='text'
												onChange={e => handleStringChange(e)}
												value={getGPSString(state.gps)} />
										</div>
										{/* note input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.note" /></label>
											<Input
												name='note'
												type='textarea'
												onChange={e => handleStringChange(e)}
												value={nullToEmptyString(state.note)}
												placeholder='Note' />
										</div>
										{/* cumulative input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulative" /></label>
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
										{/* cumulativeReset input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeReset" /></label>
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
										{/* cumulativeResetStart input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetStart" /></label>
											<Input
												name='cumulativeResetStart'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.cumulativeResetStart}
												placeholder="HH:MM:SS" />
										</div>
										{/* cumulativeResetEnd input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetEnd" /></label>
											<Input
												name='cumulativeResetEnd'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state?.cumulativeResetEnd}
												placeholder="HH:MM:SS" />
										</div>
										{/* endOnlyTime input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endOnlyTime" /></label>
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
										{/* readingGap input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingGap" /></label>
											<Input
												name='readingGap'
												type='number'
												onChange={e => handleNumberChange(e)}
												min="0"
												value={state?.readingGap} />
										</div>
										{/* readingVariation input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingVariation" /></label>
											<Input
												name="readingVariation"
												type="number"
												onChange={e => handleNumberChange(e)}
												min="0"
												defaultValue={state?.readingVariation} />
										</div>
										{/* readingDuplication input */}
										<div style={formInputStyle}>
											<label>{translate('meter.readingDuplication')} <label style={requiredStyle}>*</label></label>
											<Input
												name="readingDuplication"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="1"
												min="1"
												max="9"
												defaultValue={state?.readingDuplication} />
										</div>
										{/* timeSort input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.timeSort" /></label>
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
										{/* Timezone input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.time.zone" /></label>
											<TimeZoneSelect current={state.timeZone} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
										</div>
										{/* reading input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.reading" /></label>
											<Input
												name="reading"
												type="number"
												onChange={e => handleNumberChange(e)}
												defaultValue={state?.reading} />
										</div>
										{/* startTimestamp input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.startTimeStamp" /></label>
											<Input
												name='startTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												value={state?.startTimestamp} />
										</div>
										{/* endTimestamp input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endTimeStamp" /></label>
											<Input
												name='endTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												value={state?.endTimestamp} />
										</div>
										{/* previousEnd input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.previousEnd" /></label>
											<Input
												name='previousEnd'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												value={state?.previousEnd} />
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
					<Button variant="primary" onClick={handleSaveChanges} disabled={!state.name}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

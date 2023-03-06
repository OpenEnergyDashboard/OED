/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
// Realize that * is already imported from react
import { useState, useEffect } from 'react';
import MultiSelectComponent from '../MultiSelectComponent';
import { SelectOption } from '../../types/items';
import { useDispatch, useSelector } from 'react-redux';
import { State } from 'types/redux/state';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import ListDisplayComponent from '../ListDisplayComponent';
import '../../styles/modal.css';
import '../../styles/card-page.css';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import { submitGroupEdits } from '../../actions/groups';
import { TrueFalseType } from '../../types/items';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { UnitData } from '../../types/redux/units';
import { unitsCompatibleWithMeters, getMeterMenuOptionsForGroup } from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { notifyUser, getGPSString, nullToEmptyString, updateDeepMetersOnMeter } from '../../utils/input';
import { GroupEditData } from 'types/redux/groups';

interface EditGroupModalComponentProps {
	show: boolean;
	groupId: number;
	possibleGraphicUnits: Set<UnitData>;
	// passed in to handle closing the modal
	handleClose: () => void;
}

export default function EditGroupModalComponent(props: EditGroupModalComponentProps) {
	const dispatch = useDispatch();

	// Meter state
	const metersState = useSelector((state: State) => state.meters.byMeterID);
	// unit state
	const unitState = useSelector((state: State) => state.units.units);
	// Group state
	const groupsState = useSelector((state: State) => state.groups.byGroupID);
	// The current groups state. It should always be valid.
	const originalGroupState = groupsState[props.groupId];
	// Sort child meters by id because need that every time the user makes a meter selection
	originalGroupState.childMeters.sort();

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// The chosen meters are initially the meter children of this group.
	// If an admin then will display as a selectable meter list and if
	// other user than it is a list of the meter identifiers.
	let selectedMeters: SelectOption[] = []
	const listedMeters: string[] = [], listedDeepMeters: string[] = [];
	if (loggedInAsAdmin) {
		// In format for the display component.
		const selectedMetersUnsorted: SelectOption[] = [];
		Object.values(originalGroupState.childMeters).forEach(meter => {
			selectedMetersUnsorted.push({
				value: meter,
				label: metersState[meter].identifier,
				isDisabled: false
			} as SelectOption
			);
		});
		// Want chosen in sorted order. Note any changes by user can unsort them.
		selectedMeters = _.sortBy(selectedMetersUnsorted, item => item.label.toLowerCase(), 'asc');
	} else {
		// What to display if not an admin.
		// These do the immediate child meters.
		let hasHidden = false;
		Object.values(originalGroupState.childMeters).forEach(meter => {
			const meterIdentifier = metersState[meter].identifier;
			// The identifier is null if the meter is not visible to this user so not hidden meters.
			if (meterIdentifier === null) {
				hasHidden = true;
			} else {
				listedMeters.push(meterIdentifier);
			}
		});
		// Sort for display. Before were sorted by id so not okay here.
		listedMeters.sort();
		if (hasHidden) {
			// There are hidden meters so note at bottom of list.
			listedMeters.push('At least one meter is not visible to you');
		}
		// These do the deep child meters.
		hasHidden = false;
		Object.values(originalGroupState.deepMeters).forEach(meter => {
			const meterIdentifier = metersState[meter].identifier;
			// The identifier is null if the meter is not visible to this user so not hidden meters.
			if (meterIdentifier === null) {
				hasHidden = true;
			} else {
				listedDeepMeters.push(meterIdentifier);
			}
		});
		// Sort for display.
		listedDeepMeters.sort();
		if (hasHidden) {
			// There are hidden meters so note at bottom of list.
			listedDeepMeters.push('At least one meter is not visible to you');
		}
	}

	// Set existing group values
	const values: GroupEditData = {
		id: originalGroupState.id,
		name: originalGroupState.name,
		childMeters: originalGroupState.childMeters,
		childGroups: originalGroupState.childGroups,
		deepMeters: originalGroupState.deepMeters,
		gps: originalGroupState.gps,
		displayable: originalGroupState.displayable,
		note: originalGroupState.note,
		area: originalGroupState.area,
		defaultGraphicUnit: originalGroupState.defaultGraphicUnit
	}

	// The information on the children of this group
	const groupChildrenDefaults = {
		// The meter selections in format for selection dropdown.
		meterSelectOptions: [] as SelectOption[],
		// Meters that have been selected for this group. Not used if non-admin.
		meterSelectedSelectOptions: loggedInAsAdmin ? selectedMeters : [] as SelectOption[],
		// The names of all direct meter children that are visible to this user.
		childGroupsName: [] as string[],
		// The original number of direct group children
		childGroupsTrueSize: 0,
		// The identifiers of all meter children (deep meters) that are visible to this user.
		deepMetersIdentifier: [] as string[],
		// The original number of direct meter children
		deepMetersTrueSize: 0
	}

	const dropdownsStateDefaults = {
		possibleGraphicUnits: props.possibleGraphicUnits,
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

	const [groupChildrenState, setGroupChildrenState] = useState(groupChildrenDefaults)

	// Dropdowns
	const [dropdownsState, setDropdownsState] = useState(dropdownsStateDefaults);
	/* End State */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateGroupModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit groups will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setState(values);
		setGroupChildrenState(groupChildrenDefaults);
		setDropdownsState(dropdownsStateDefaults);
	}

	const handleClose = () => {
		props.handleClose();
		if (loggedInAsAdmin) {
			// State cannot change if you are not an admin.
			resetState();
		}
	}

	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Check for changes by comparing state to props
		const childMeterChanges = !metersSame(originalGroupState.childMeters, groupChildrenState.meterSelectedSelectOptions);
		const groupHasChanges =
			(
				originalGroupState.name != state.name ||
				originalGroupState.displayable != state.displayable ||
				originalGroupState.gps != state.gps ||
				originalGroupState.note != state.note ||
				originalGroupState.area != state.area ||
				originalGroupState.defaultGraphicUnit != state.defaultGraphicUnit ||
				childMeterChanges
			);
		// Only validate and store if any changes.
		if (groupHasChanges) {
			//Check if area is positive
			// TODO For now allow zero so works with default value and DB. We should probably
			// make this better default than 0 (DB set to not null now).
			if (state.area < 0) {
				notifyUser(translate('area.invalid') + state.area + '.');
				inputOk = false;
			}

			//Check GPS
			const gpsInput = state.gps;
			let gps: GPSPoint | null = null;
			const latitudeIndex = 0;
			const longitudeIndex = 1;
			//if the user input a value then gpsInput should be a string
			// null came from DB and it is okay to just leave it - Not a String.
			if (typeof gpsInput === 'string') {
				if (isValidGPSInput(gpsInput)) {
					//Clearly gpsInput is a string but TS complains about the split so cast.
					const gpsValues = (gpsInput as string).split(',').map((value: string) => parseFloat(value));
					//It is valid and needs to be in this format for routing
					gps = {
						longitude: gpsValues[longitudeIndex],
						latitude: gpsValues[latitudeIndex]
					};
				} else if ((gpsInput as string).length !== 0) {
					// GPS not okay.
					// TODO isValidGPSInput currently tops up an alert so not doing it here, may change
					// so leaving code commented out.
					// notifyUser(translate('input.gps.range') + state.gps + '.');
					notifyUser(translate('input.gps.range') + state.gps + '.');
					inputOk = false;
				}
			}

			if (inputOk) {
				// The input passed validation.
				// GPS may have been updated so create updated state to submit.
				let submitState = { ...state, gps: gps };
				// deepMeters is part of the group state but it is not sent on edit so remove.
				delete submitState.deepMeters;
				let childMeters: number[] = [];
				if (childMeterChanges) {
					// Send child meters to update but need to create array of the ids.
					childMeters = groupChildrenState.meterSelectedSelectOptions.map(meter => { return meter.value; });
					submitState = { ...submitState, childMeters: childMeters }
				}
				dispatch(submitGroupEdits(submitState));
				dispatch(removeUnsavedChanges());
			} else {
				notifyUser(translate('group.input.error'));
			}
		}
	};

	// Determine child meters/groups.
	useEffect(() => {
		if (loggedInAsAdmin) {
			// Get meters that okay for this group in a format the component can display.
			// Must pass the current state info since can be changed while editing.
			const possibleMeters = getMeterMenuOptionsForGroup(state.id, state.defaultGraphicUnit, state.deepMeters);

			// Information to display the direct children groups.
			// Holds the names of all direct group children of this group when visible to this user.
			const childGroupsName: string[] = [];
			let trueGroupSize = 0;
			// Make sure state exists as the dispatch above may not be done.
			if (state.childGroups) {
				state.childGroups.forEach((groupID: number) => {
					// Make sure group state exists. Also, the name is missing if not visible (non-admin).
					if (groupsState[groupID] !== undefined && groupsState[groupID].name !== null) {
						childGroupsName.push(groupsState[groupID].name.trim());
					}
				});
				childGroupsName.sort();
				// Record the total number so later can compare the number in array to see if any missing.
				trueGroupSize = state.childGroups.length;
			}

			// Information to display all (deep) children meters.
			// Holds the names of all (deep) meter children of this group when visible to this user.
			const identifierDeepMeters: string[] = [];
			let trueDeepMeterSize = 0;
			// Because deepMeters is optional in state, TS is worried it may not exist. It should always be set
			// at this point but if stops the error.
			if (state.deepMeters) {
				state.deepMeters.forEach((meterID: number) => {
					// Make sure meter state exists. Also, the identifier is missing if not visible (non-admin).
					if (metersState[meterID] !== undefined && metersState[meterID].identifier !== null) {
						identifierDeepMeters.push(metersState[meterID].identifier.trim());
					}
				});
				identifierDeepMeters.sort();
				// Record the total number so later can compare the number in array to see if any missing.
				trueDeepMeterSize = state.deepMeters.length;
			}
			// Update the state
			setGroupChildrenState({
				...groupChildrenState,
				childGroupsName: childGroupsName,
				childGroupsTrueSize: trueGroupSize,
				deepMetersIdentifier: identifierDeepMeters,
				deepMetersTrueSize: trueDeepMeterSize,
				meterSelectOptions: possibleMeters
			});
		}
	}, [metersState, state.childMeters, state.childGroups, state.deepMeters]);

	// Update compatible units and graphic units set.
	useEffect(() => {
		if (loggedInAsAdmin) {
			// Graphic units compatible with currently selected meters/groups.
			const compatibleGraphicUnits = new Set<UnitData>();
			// Graphic units incompatible with currently selected meters/groups.
			const incompatibleGraphicUnits = new Set<UnitData>();
			// First must get a set from the array of deep meter numbers which is all meters currently in this group.
			const deepMetersSet = new Set(state.deepMeters);
			// Get the units that are compatible with this set of meters.
			// TODO This does not allow no unit which we currently planned to allow for groups. Need to decide what to do in this case.
			const allowedDefaultGraphicUnit = unitsCompatibleWithMeters(deepMetersSet);
			dropdownsState.possibleGraphicUnits.forEach(unit => {
				// If current graphic unit exists in the set of allowed graphic units
				if (allowedDefaultGraphicUnit.has(unit.id)) {
					compatibleGraphicUnits.add(unit);
				}
				else {
					incompatibleGraphicUnits.add(unit);
				}
			});
			// Update the state
			setDropdownsState({
				...dropdownsState,
				// The new set helps avoid repaints.
				compatibleGraphicUnits: compatibleGraphicUnits,
				incompatibleGraphicUnits: incompatibleGraphicUnits
			});
		}
		// If any of these change then it needs to be updated.
		// pik is needed since the compatible units is not correct until pik is available.
	}, [ConversionArray.pikAvailable(), state.deepMeters]);
	// }
	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '60%',
		// Switch help depending if admin or not.
		tooltipEditGroupView: loggedInAsAdmin ? 'help.admin.groupedit' : 'help.groups.groupdetails'
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
					<Modal.Title> <FormattedMessage id={loggedInAsAdmin ? 'edit.group' : 'group.details'} />
						<TooltipHelpContainer page='groups' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='groups' helpTextId={tooltipStyle.tooltipEditGroupView} />
						</div>
					</Modal.Title>
				</Modal.Header>
				{/* when any of the group are changed call one of the functions (if admin). */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div style={tableStyle}>
									{/* Name where input if admin or shown if now */}
									{loggedInAsAdmin ?
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.name" /></label><br />
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.name} />
										</div>
										:
										<div className="item-container">
											<b><FormattedMessage id="group.name" /></b> {state.name}
										</div>
									}
									{/* default graphic unit input */}
									{loggedInAsAdmin ?
										< div style={formInputStyle}>
											<label><FormattedMessage id="group.defaultGraphicUnit" /></label><br />
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
										:
										<div className="item-container">
											{/* Use meter translation id string since same one wanted. */}
											{/* This is the default graphic unit associated with the group or no unit if none. */}
											<b><FormattedMessage id="meter.defaultGraphicUnit" /></b>
											{/* Not exactly sure why but must force a starting space after the label */}
											{state.defaultGraphicUnit === -99 ? ' no unit' : ' ' + unitState[state.defaultGraphicUnit].identifier}
										</div>
									}
									{/* Displayable input */}
									{loggedInAsAdmin && // only render when logged in as Admin
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.displayable" /></label><br />
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
									}
									{/* Area input */}
									{loggedInAsAdmin && // only render when logged in as Admin
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.area" /></label><br />
											<Input
												name="area"
												type="number"
												step="0.01"
												min="0"
												value={nullToEmptyString(state.area)}
												onChange={e => handleNumberChange(e)} />
										</div>
									}
									{/* GPS input */}
									{loggedInAsAdmin && // only render when logged in as Admin
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.gps" /></label><br />
											<Input
												name='gps'
												type='text'
												onChange={e => handleStringChange(e)}
												value={getGPSString(state.gps)} />
										</div>
									}
									{/* Note input */}
									{loggedInAsAdmin && // only render when logged in as Admin
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.note" /></label><br />
											<Input
												name='note'
												type='textarea'
												onChange={e => handleStringChange(e)}
												value={nullToEmptyString(state.note)} />
										</div>
									}
									{/* The child meters in this group */}
									{loggedInAsAdmin ?
										<div style={formInputStyle}>
											<b><FormattedMessage id='child.meters' /></b>:
											<MultiSelectComponent
												options={groupChildrenState.meterSelectOptions}
												selectedOptions={groupChildrenState.meterSelectedSelectOptions}
												placeholder={translate('select.meters')}
												onValuesChange={(newSelectedMeterOptions: SelectOption[]) => {
													// The meters changed so update the current list of deep meters
													const newDeepMeters = updateDeepMetersOnMeter(state.deepMeters, groupChildrenState.meterSelectedSelectOptions, newSelectedMeterOptions);
													// Update the deep meter state based on the changes
													setState({ ...state, deepMeters: newDeepMeters });
													// Set the selected meters in state to the ones chosen.
													setGroupChildrenState({
														...groupChildrenState,
														meterSelectedSelectOptions: newSelectedMeterOptions
													});
												}}
											/>
										</div>
										:
										<div>
											<b><FormattedMessage id='child.meters' /></b>:
											<ListDisplayComponent trueSize={listedMeters.length} items={listedMeters} />
										</div>
									}
									{/* The child groups in this group */}
									<div>
										<b><FormattedMessage id='child.groups' /></b>:
										<ListDisplayComponent trueSize={groupChildrenState.childGroupsTrueSize} items={groupChildrenState.childGroupsName} />
									</div>
									{/* All (deep) meters in this group */}
									{loggedInAsAdmin ?
										<div>
											<b><FormattedMessage id='group.all.meters' /></b>:
											<ListDisplayComponent trueSize={groupChildrenState.deepMetersTrueSize} items={groupChildrenState.deepMetersIdentifier} />
										</div>
										:
										<div>
											<b><FormattedMessage id='group.all.meters' /></b>:
											<ListDisplayComponent trueSize={listedDeepMeters.length} items={listedDeepMeters} />
										</div>
									}
								</div>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					{/* Discard & save buttons if admin and close button if not. */}
					{loggedInAsAdmin ?
						// Hides the modal
						<div>
							<Button variant="secondary" onClick={handleClose}>
								<FormattedMessage id="discard.changes" />
							</Button>
							{/* On click calls the function handleSaveChanges in this component */}
							<Button variant="primary" onClick={handleSaveChanges} disabled={!state.name}>
								<FormattedMessage id="save.all" />
							</Button>
						</div>
						:
						<Button onClick={handleClose}>
							<FormattedMessage id="close" />
						</Button>
					}
				</Modal.Footer>
			</Modal >
		</>
	);
}

/**
 * Returns false if the two arrays have different meter ids and true otherwise. Assumes elements unique.
 * SelectOption has meter id in value.
 * @param {number[]} originalMeters[] first array of meter ids
 * @param {SelectOption[]} selectedMeters[] second array of selection options
 * @returns false if two arrays differ, otherwise true
 */
function metersSame(originalMeters: number[], selectedMeters: SelectOption[]) {
	if (originalMeters.length == selectedMeters.length) {
		// Sort since user selections can be in any order.
		const sortedTwo = _.sortBy(selectedMeters, item => item.value, 'asc');
		// Compare id of meters in each array by each element until find difference or all the same.
		return originalMeters.every((element, index) => {
			return element === sortedTwo[index].value;
		});
	} else {
		// The lengths differ so cannot be the same since each element is unique.
		return false;
	}
}

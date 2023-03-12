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
import { deleteGroup, submitGroupEdits } from '../../actions/groups';
import { TrueFalseType } from '../../types/items';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { UnitData } from '../../types/redux/units';
import {
	unitsCompatibleWithMeters, getMeterMenuOptionsForGroup, getGroupMenuOptionsForGroup, metersInChangedGroup
} from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { notifyUser, getGPSString, nullToEmptyString, noUnitTranslated } from '../../utils/input';
import { GroupEditData } from 'types/redux/groups';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent'

interface EditGroupModalComponentProps {
	show: boolean;
	groupId: number;
	possibleGraphicUnits: Set<UnitData>;
	// passed in to handle opening the modal
	handleShow: () => void;
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

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// The chosen meters are initially the meter children of this group.
	// If an admin then will display as a selectable meter list and if
	// other user than it is a list of the meter identifiers.
	// Groups are done similarly.
	// For admins
	let selectedMeters: SelectOption[] = [], selectedGroups: SelectOption[] = [];
	// For non-admins.
	const listedMeters: string[] = [], listedGroups: string[] = [], listedDeepMeters: string[] = [];
	if (loggedInAsAdmin) {
		// In format for the display component for meters.
		const selectedMetersUnsorted: SelectOption[] = [];
		Object.values(originalGroupState.childMeters).forEach(meter => {
			selectedMetersUnsorted.push({
				value: meter,
				label: metersState[meter].identifier
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order. Note any changes by user can unsort them.
		selectedMeters = _.sortBy(selectedMetersUnsorted, item => item.label.toLowerCase(), 'asc');
		// Similar but for groups.
		const selectedGroupsUnsorted: SelectOption[] = [];
		Object.values(originalGroupState.childGroups).forEach(group => {
			selectedGroupsUnsorted.push({
				value: group,
				label: groupsState[group].name
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order. Note any changes by user can unsort them.
		selectedGroups = _.sortBy(selectedGroupsUnsorted, item => item.label.toLowerCase(), 'asc');
	} else {
		// What to display if not an admin. Also do deep meters since they never change.
		// The logic has overlaps to admin but separated since different enough.
		// These do the immediate child meters.
		// Tells if any meter is not visible to user.
		let hasHidden = false;
		Object.values(originalGroupState.childMeters).forEach(meter => {
			const meterIdentifier = metersState[meter].identifier;
			// The identifier is null if the meter is not visible to this user. If hidden then do
			// not list and otherwise label.
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
			listedMeters.push(translate('meter.hidden'));
		}
		// Similar but for the groups.
		hasHidden = false;
		Object.values(originalGroupState.childGroups).forEach(group => {
			// The name is null if the group is not visible to this user.
			// TODO The following line should work but does not (it does for meters).
			// The Redux state has the name of hidden groups but it should not. A quick
			// attempt to fix did not work as login/out did not clear as expected when
			// control what is returned. This needs to be addressed.
			// if (groupName !== null) {
			// For now, check if the group is displayable.
			if (groupsState[group].displayable) {
				listedGroups.push(groupsState[group].name);
			} else {
				hasHidden = true;
			}
		});
		// Sort for display. Before were sorted by id so not okay here.
		listedGroups.sort();
		if (hasHidden) {
			// There are hidden groups so note at bottom of list.
			listedGroups.push(translate('group.hidden'));
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

	// Set existing group values for the state.
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

	// The information on the children of this group for state. Except for selected, the
	// values are set by the useEffect functions.
	const groupChildrenDefaults = {
		// The meter selections in format for selection dropdown.
		meterSelectOptions: [] as SelectOption[],
		// Meters that have been selected for this group. Not used if non-admin.
		meterSelectedSelectOptions: loggedInAsAdmin ? selectedMeters : [] as SelectOption[],
		// The group selections in format for selection dropdown.
		groupSelectOptions: [] as SelectOption[],
		// Groups that have been selected for this group. Not used if non-admin.
		groupSelectedSelectOptions: loggedInAsAdmin ? selectedGroups : [] as SelectOption[],
		// The identifiers of all meter children (deep meters) that are visible to this user.
		deepMetersIdentifier: [] as string[]
	}

	const graphicUnitsStateDefaults = {
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
	const [graphicUnitsState, setGraphicUnitsState] = useState(graphicUnitsStateDefaults);
	/* End State */

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('group.delete.group') + ' \"' + originalGroupState.name + '\"?';
	const deleteConfirmText = translate('group.delete.group');
	const deleteRejectText = translate('cancel');
	// The first two handle functions below are required because only one Modal can be open at a time (properly)
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShow();
	}
	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	}
	const handleDeleteGroup = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);
		// Delete the group using the state object where only really need id.
		dispatch(deleteGroup(state as GroupEditData));
	}
	/* End Confirm Delete Modal */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateGroupModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit groups will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setState(values);
		setGroupChildrenState(groupChildrenDefaults);
		setGraphicUnitsState(graphicUnitsStateDefaults);
	}

	const handleShow = () => {
		props.handleShow();
	}

	// Note this differs from the props.handleClose(). This is only called when the user
	// clicks to discard or close the modal.
	const handleClose = () => {
		props.handleClose();
		if (loggedInAsAdmin) {
			// State cannot change if you are not an admin.
			resetState();
		}
	}

	// Save changes
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Check for changes by comparing state to props
		// Check children separately since lists.
		const childMeterChanges = !listsSame(originalGroupState.childMeters, groupChildrenState.meterSelectedSelectOptions);
		const childGroupChanges = !listsSame(originalGroupState.childGroups, groupChildrenState.groupSelectedSelectOptions);
		const groupHasChanges =
			(
				originalGroupState.name != state.name ||
				originalGroupState.displayable != state.displayable ||
				originalGroupState.gps != state.gps ||
				originalGroupState.note != state.note ||
				originalGroupState.area != state.area ||
				originalGroupState.defaultGraphicUnit != state.defaultGraphicUnit ||
				childMeterChanges ||
				childGroupChanges
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

			//Check GPS is okay.
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
					// TODO isValidGPSInput currently pops up an alert so not doing it here, may change
					// so leaving code commented out.
					// notifyUser(translate('input.gps.range') + state.gps + '.');
					inputOk = false;
				}
			}

			// Do not allow groups without any child meters and groups. From a practical standpoint, this
			// means there are no deep children.
			if (state.deepMeters?.length === 0) {
				notifyUser(translate('group.children.error'));
				inputOk = false;
			}

			if (inputOk) {
				// The input passed validation.
				// GPS may have been updated so create updated state to submit.
				const submitState = { ...state, gps: gps };
				dispatch(submitGroupEdits(submitState));
				dispatch(removeUnsavedChanges());
			} else {
				notifyUser(translate('group.input.error'));
			}
		}
	};

	// Determine child meters/groups and deep meters.
	useEffect(() => {
		// Can only vary if admin and only used then.
		if (loggedInAsAdmin) {
			// Get meters that okay for this group in a format the component can display.
			const possibleMeters = getMeterMenuOptionsForGroup(state.defaultGraphicUnit, state.deepMeters);
			// Get groups okay for this group. Similar to meters.
			const possibleGroups = getGroupMenuOptionsForGroup(state.id, state.defaultGraphicUnit, state.deepMeters);

			// Information to display all (deep) children meters.
			// Holds the names of all (deep) meter children of this group when visible to this user.
			const identifierDeepMeters: string[] = [];
			// Because deepMeters is optional in state, TS is worried it may not exist. It should always be set
			// at this point but if stops the error.
			state.deepMeters?.forEach((meterID: number) => {
				// Make sure meter state exists. Also, the identifier is missing if not visible (non-admin).
				if (metersState[meterID] !== undefined && metersState[meterID].identifier !== null) {
					identifierDeepMeters.push(metersState[meterID].identifier.trim());
				}
			});
			// We want to display in alphabetical order.
			identifierDeepMeters.sort();
			// Update the state
			setGroupChildrenState({
				...groupChildrenState,
				deepMetersIdentifier: identifierDeepMeters,
				meterSelectOptions: possibleMeters,
				groupSelectOptions: possibleGroups
			});
		}
	}, [metersState, state.defaultGraphicUnit, state.deepMeters, state.childGroups, state.childMeters]);

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
			const allowedDefaultGraphicUnit = unitsCompatibleWithMeters(deepMetersSet);
			// No unit allowed so modify allowed ones. Should not be there but will be fine if is.
			allowedDefaultGraphicUnit.add(-99);
			graphicUnitsState.possibleGraphicUnits.forEach(unit => {
				// If current graphic unit exists in the set of allowed graphic units then compatible and not otherwise.
				if (allowedDefaultGraphicUnit.has(unit.id)) {
					compatibleGraphicUnits.add(unit);
				}
				else {
					incompatibleGraphicUnits.add(unit);
				}
			});
			// Update the state
			setGraphicUnitsState({
				...graphicUnitsState,
				compatibleGraphicUnits: compatibleGraphicUnits,
				incompatibleGraphicUnits: incompatibleGraphicUnits
			});
		}
		// If any of these change then it needs to be updated.
		// pik is needed since the compatible units is not correct until pik is available.
	}, [ConversionArray.pikAvailable(), state.deepMeters]);

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
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteGroup}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<Modal show={props.show} onHide={props.handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id={loggedInAsAdmin ? 'edit.group' : 'group.details'} />
						<TooltipHelpContainer page='groups-edit' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='groups-edit' helpTextId={tooltipStyle.tooltipEditGroupView} />
						</div>
					</Modal.Title>
				</Modal.Header>
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
									{/* default graphic unit input or display */}
									{loggedInAsAdmin ?
										< div style={formInputStyle}>
											<label><FormattedMessage id="group.defaultGraphicUnit" /></label><br />
											<Input
												name='defaultGraphicUnit'
												type='select'
												value={state.defaultGraphicUnit}
												onChange={e => handleNumberChange(e)}>
												{Array.from(graphicUnitsState.compatibleGraphicUnits).map(unit => {
													return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
												})}
												{Array.from(graphicUnitsState.incompatibleGraphicUnits).map(unit => {
													return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
												})}
											</Input>
										</div>
										:
										<div className="item-container">
											{/* Use meter translation id string since same one wanted. */}
											{/* This is the default graphic unit associated with the group or no unit if none. */}
											<b><FormattedMessage id='meter.defaultGraphicUnit' /></b>
											{/* Not exactly sure why but must force a starting space after the label */}
											{state.defaultGraphicUnit === -99 ? ' ' + noUnitTranslated().identifier : ' ' + unitState[state.defaultGraphicUnit].identifier}
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
													// Get the currently included/selected meters as an array of the ids.
													const updatedChildMeters = newSelectedMeterOptions.map(meter => { return meter.value; });
													const newDeepMeters = metersInChangedGroup({ ...state, childMeters: updatedChildMeters });
													// // Update the deep meter and child meter state based on the changes.
													// Note could update child meters above to avoid updating state value for metersInChangedGroup but want
													// to avoid too many state updates.
													setState({ ...state, deepMeters: newDeepMeters, childMeters: updatedChildMeters });
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
											<ListDisplayComponent items={listedMeters} />
										</div>
									}
									{/* The child groups in this group */}
									{loggedInAsAdmin ?
										<div style={formInputStyle}>
											<b><FormattedMessage id='child.groups' /></b>:
											<MultiSelectComponent
												options={groupChildrenState.groupSelectOptions}
												selectedOptions={groupChildrenState.groupSelectedSelectOptions}
												placeholder={translate('select.groups')}
												onValuesChange={(newSelectedGroupOptions: SelectOption[]) => {
													// The groups changed so update the current list of deep meters
													// Get the currently included/selected meters as an array of the ids.
													const updatedChildGroups = newSelectedGroupOptions.map(group => { return group.value; });
													const newDeepMeters = metersInChangedGroup({ ...state, childGroups: updatedChildGroups });
													// Update the deep meter and child group state based on the changes.
													// Note could update child groups above to avoid updating state value for metersInChangedGroup but want
													// to avoid too many state updates.
													setState({ ...state, deepMeters: newDeepMeters, childGroups: updatedChildGroups });
													// // Set the selected groups in state to the ones chosen.
													setGroupChildrenState({
														...groupChildrenState,
														groupSelectedSelectOptions: newSelectedGroupOptions
													});
												}}
											/>
										</div>
										:
										<div>
											<b><FormattedMessage id='child.groups' /></b>:
											<ListDisplayComponent items={listedGroups} />
										</div>
									}
									{/* All (deep) meters in this group */}
									<div>
										<b><FormattedMessage id='group.all.meters' /></b>:
										<ListDisplayComponent items={loggedInAsAdmin ? groupChildrenState.deepMetersIdentifier : listedDeepMeters} />
									</div>
								</div>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					{/* Discard & save buttons if admin and close button if not. */}
					{loggedInAsAdmin ?
						<div>
							{/* TODO this should warn admin if group in another group */}
							<Button variant="danger" onClick={handleDeleteConfirmationModalOpen}>
								<FormattedMessage id="group.delete.group" />
							</Button>
							{/* Hides the modal */}
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
 * Returns false if the two arrays have different ids and true otherwise. Assumes elements unique.
 * SelectOption has id in value.
 * @param {number[]} original[] first array of ids
 * @param {SelectOption[]} selected[] second array of selection options
 * @returns false if two arrays differ, otherwise true
 */
function listsSame(original: number[], selected: SelectOption[]) {
	if (original.length == selected.length) {
		// Sort each list so comparison is easier.
		// Sorting the array of numbers in place is fine as the order should not matter.
		original.sort();
		const sortedTwo = _.sortBy(selected, item => item.value, 'asc');
		// Compare id in each array by each element until find difference or all the same.
		return original.every((element, index) => {
			return element === sortedTwo[index].value;
		});
	} else {
		// The lengths differ so cannot be the same since each element is unique.
		return false;
	}
}

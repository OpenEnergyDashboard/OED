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
import { deleteGroup, submitGroupEdits } from '../../actions/groups';
import { TrueFalseType } from '../../types/items';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { UnitData } from '../../types/redux/units';
import {
	unitsCompatibleWithMeters, getMeterMenuOptionsForGroup, getGroupMenuOptionsForGroup, metersInChangedGroup,
	getCompatibilityChangeCase, GroupCase
} from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { notifyUser, getGPSString, nullToEmptyString, noUnitTranslated } from '../../utils/input';
import { GroupDefinition } from 'types/redux/groups';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent'
import { DataType } from '../../types/Datasources';
import { groupsApi } from '../../utils/api';

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
	// Group state used on other pages
	const globalGroupsState = useSelector((state: State) => state.groups.byGroupID);
	// Make a local copy of the group data so we can update during the edit process.
	// When the group is saved the values will be synced again with the global state.
	// This needs to be a deep clone so the changes are only local.
	const [editGroupsState, setEditGroupsState] = useState(_.cloneDeep(globalGroupsState));
	// The current groups state of group being edited of the local copy. It should always be valid.
	const groupState = editGroupsState[props.groupId];

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// The information on the children of this group for state. Except for selected, the
	// values are set by the useEffect functions.
	const groupChildrenDefaults = {
		// The meter selections in format for selection dropdown.
		meterSelectOptions: [] as SelectOption[],
		// The group selections in format for selection dropdown.
		groupSelectOptions: [] as SelectOption[],
	}

	const graphicUnitsStateDefaults = {
		possibleGraphicUnits: props.possibleGraphicUnits,
		compatibleGraphicUnits: props.possibleGraphicUnits,
		incompatibleGraphicUnits: new Set<UnitData>()
	}

	/* State */
	// Handlers for each type of input change

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditGroupsState({
			...editGroupsState,
			[props.groupId]: {
				// There is state that is in each group that is not part of the edit information state.
				...editGroupsState[props.groupId],
				[e.target.name]: e.target.value
			}
		})
	}

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditGroupsState({
			...editGroupsState,
			[props.groupId]: {
				// There is state that is in each group that is not part of the edit information state.
				...editGroupsState[props.groupId],
				[e.target.name]: JSON.parse(e.target.value)
			}
		})
	}

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditGroupsState({
			...editGroupsState,
			[props.groupId]: {
				// There is state that is in each group that is not part of the edit information state.
				...editGroupsState[props.groupId],
				[e.target.name]: Number(e.target.value)
			}
		})
	}

	// Dropdowns
	const [groupChildrenState, setGroupChildrenState] = useState(groupChildrenDefaults)
	const [graphicUnitsState, setGraphicUnitsState] = useState(graphicUnitsStateDefaults);
	/* End State */

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('group.delete.group') + ' "' + groupState.name + '"?';
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
		dispatch(deleteGroup(groupState));
	}
	/* End Confirm Delete Modal */

	// Reset the state to default values.
	// To be used for the discard changes button
	// Different use case from CreateGroupModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit groups will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		// Set back to the global group values for this group. As before, need a deep copy.
		setEditGroupsState(_.cloneDeep(globalGroupsState));
		// Set back to the default values for the menus.
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

		// Check for changes by comparing the original, global state to edited state.
		// This is the unedited state of the group being edited to compare to for changes.
		const originalGroupState = globalGroupsState[props.groupId];
		// Check children separately since lists.
		const childMeterChanges = _.isEqual(originalGroupState.childMeters, groupState.childMeters);
		const childGroupChanges = _.isEqual(originalGroupState.childGroups, groupState.childGroups);
		const groupHasChanges =
			(
				originalGroupState.name != groupState.name ||
				originalGroupState.displayable != groupState.displayable ||
				originalGroupState.gps != groupState.gps ||
				originalGroupState.note != groupState.note ||
				originalGroupState.area != groupState.area ||
				originalGroupState.defaultGraphicUnit != groupState.defaultGraphicUnit ||
				childMeterChanges ||
				childGroupChanges
			);
		// Only validate and store if any changes.
		if (groupHasChanges) {
			//Check if area is positive
			if (groupState.area < 0) {
				notifyUser(translate('area.invalid') + groupState.area + '.');
				inputOk = false;
			}

			//Check GPS is okay.
			const gpsInput = groupState.gps;
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
					// notifyUser(translate('input.gps.range') + groupState.gps + '.');
					inputOk = false;
				}
			}

			// Do not allow groups without any child meters and groups. From a practical standpoint, this
			// means there are no deep children.
			if (groupState.deepMeters.length === 0) {
				notifyUser(translate('group.children.error'));
				inputOk = false;
			}

			if (inputOk) {
				// The input passed validation so okay to save.

				// A change in this group may have changed other group's default graphic unit. Thus, create a list of
				// all groups needing to be saved starting with the group being edited.
				const groupChanged = [props.groupId];
				Object.values(editGroupsState).forEach(group => {
					if (group.defaultGraphicUnit !== globalGroupsState[group.id].defaultGraphicUnit) {
						groupChanged.push(group.id);
					}
				});

				// For all changed groups
				let i = 1;
				groupChanged.forEach(groupId => {
					const thisGroupState = editGroupsState[groupId];
					// There are extra properties in the state so only include the desired ones for edit submit.
					// GPS is one above since may differ from the state.
					const submitState = {
						id: thisGroupState.id, name: thisGroupState.name, childMeters: thisGroupState.childMeters, childGroups: thisGroupState.childGroups,
						gps: gps, displayable: thisGroupState.displayable, note: thisGroupState.note, area: thisGroupState.area, defaultGraphicUnit: thisGroupState.defaultGraphicUnit
					}
					// This saves group to the DB and then refreshes the window if the last group being updated.
					dispatch(submitGroupEdits(submitState, i === groupChanged.length ? true : false));
					i++;
				});
				// The next line is unneeded since do refresh.
				// dispatch(removeUnsavedChanges());
			} else {
				// TODO We probably should reset the state since it failed - other pages similar.
				notifyUser(translate('group.input.error'));
			}
		}
	};

	// Determine allowed child meters/groups .
	useEffect(() => {
		// Can only vary if admin and only used then.
		if (loggedInAsAdmin) {
			// Get meters that okay for this group in a format the component can display.
			const possibleMeters = getMeterMenuOptionsForGroup(groupState.defaultGraphicUnit, groupState.deepMeters);
			// Get groups okay for this group. Similar to meters.
			const possibleGroups = getGroupMenuOptionsForGroup(groupState.id, groupState.defaultGraphicUnit, groupState.deepMeters);
			// Update the state
			setGroupChildrenState({
				...groupChildrenState,
				meterSelectOptions: possibleMeters,
				groupSelectOptions: possibleGroups,
			});
		}
	}, [metersState, editGroupsState, groupState.defaultGraphicUnit, groupState.deepMeters, groupState.childGroups, groupState.childMeters]);

	// Update default graphic units set.
	useEffect(() => {
		// Only shown to an admin.
		if (loggedInAsAdmin) {
			// Graphic units compatible with currently selected meters/groups.
			const compatibleGraphicUnits = new Set<UnitData>();
			// Graphic units incompatible with currently selected meters/groups.
			const incompatibleGraphicUnits = new Set<UnitData>();
			// First must get a set from the array of deep meter numbers which is all meters currently in this group.
			const deepMetersSet = new Set(groupState.deepMeters);
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
		// Another card can update a group that changes the values. Only certain changes matter
		// but for now just do for all.
	}, [ConversionArray.pikAvailable(), groupState.deepMeters, editGroupsState]);

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
												value={groupState.name} />
										</div>
										:
										<div className="item-container">
											<b><FormattedMessage id="group.name" /></b> {groupState.name}
										</div>
									}
									{/* default graphic unit input or display */}
									{loggedInAsAdmin ?
										< div style={formInputStyle}>
											<label><FormattedMessage id="group.defaultGraphicUnit" /></label><br />
											<Input
												name='defaultGraphicUnit'
												type='select'
												value={groupState.defaultGraphicUnit}
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
											{groupState.defaultGraphicUnit === -99 ? ' ' + noUnitTranslated().identifier : ' ' + unitState[groupState.defaultGraphicUnit].identifier}
										</div>
									}
									{/* Displayable input */}
									{loggedInAsAdmin && // only render when logged in as Admin
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.displayable" /></label><br />
											<Input
												name='displayable'
												type='select'
												value={groupState.displayable.toString()}
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
												value={nullToEmptyString(groupState.area)}
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
												value={getGPSString(groupState.gps)} />
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
												value={nullToEmptyString(groupState.note)} />
										</div>
									}
									{/* The child meters in this group */}
									{loggedInAsAdmin ?
										<div style={formInputStyle}>
											<b><FormattedMessage id='child.meters' /></b>:
											<MultiSelectComponent
												options={groupChildrenState.meterSelectOptions}
												selectedOptions={metersToSelectOptions()}
												placeholder={translate('select.meters')}
												onValuesChange={async (newSelectedMeterOptions: SelectOption[]) => {
													// The meters changed so verify update is okay and deal with appropriately.
													// The length of of selected meters should only vary by 1 since each change is handled separately.
													// Compare the new length to the original length that is the same as
													// the number of child meters of group being edited.
													if (newSelectedMeterOptions.length === groupState.childMeters.length + 1) {
														// A meter was selected so it is considered for adding.
														// The newly selected item is always the last one.
														// Now attempt to add the child to see if okay.
														const childAdded = await assignChildToGroup(newSelectedMeterOptions[newSelectedMeterOptions.length - 1].value, DataType.Meter);
														if (!childAdded) {
															// The new child meter was rejected so remove it. It is the last one.
															newSelectedMeterOptions.pop();
														}
													} else {
														// TODO
														// Could have removed any item so figure out which one it is.
														// const removedMeter = _.difference(groupChildrenState.meterSelectedSelectOptions, newSelectedMeterOptions);
														// console.log('removing # ', removedMeter.length, ' with first child: ', removedMeter[0].label);
													}
												}}
											/>
										</div>
										:
										<div>
											<b><FormattedMessage id='child.meters' /></b>:
											<ListDisplayComponent items={metersToList()} />
										</div>
									}
									{/* The child groups in this group */}
									{loggedInAsAdmin ?
										<div style={formInputStyle}>
											<b><FormattedMessage id='child.groups' /></b>:
											<MultiSelectComponent
												options={groupChildrenState.groupSelectOptions}
												selectedOptions={groupsToSelectOptions()}
												placeholder={translate('select.groups')}
												onValuesChange={(newSelectedGroupOptions: SelectOption[]) => {
													// The groups changed so update the current list of deep meters
													// Get the currently included/selected meters as an array of the ids.
													const updatedChildGroups = newSelectedGroupOptions.map(group => { return group.value; });
													const newDeepMeters = metersInChangedGroup({ ...groupState, childGroups: updatedChildGroups });
													// Update the deep meter and child group state based on the changes.
													// Note could update child groups above to avoid updating state value for metersInChangedGroup but want
													// to avoid too many state updates.
													setEditGroupsState({
														...editGroupsState,
														[props.groupId]: {
															// There is state that is in each group that is not part of the edit information state.
															...editGroupsState[props.groupId],
															deepMeters: newDeepMeters,
															childGroups: updatedChildGroups
														}
													});
												}}
											/>
										</div>
										:
										<div>
											<b><FormattedMessage id='child.groups' /></b>:
											<ListDisplayComponent items={groupsToList()} />
										</div>
									}
									{/* All (deep) meters in this group */}
									<div>
										<b><FormattedMessage id='group.all.meters' /></b>:
										<ListDisplayComponent items={deepMetersToList()} />
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
							<Button variant="primary" onClick={handleSaveChanges} disabled={!groupState.name}>
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

	// The following functions are nested so can easily get and set the state that is local to the outer function.

	/**
	 * Validates and warns user when adding a child group/meter to a specific group.
	 * If the check pass, update the edited group and related groups.
	 * @param childId The group/meter's id to add to the parent group.
	 * @param childType Can be group or meter.
	 * @return true if the child was assigned and false otherwise
	 */
	async function assignChildToGroup(childId: number, childType: DataType): Promise<boolean> {
		// Create a deep copy of the edit state before adding the child. We only need some of the state but this is easier.
		// This copy is directly changed without using the Redux hooks since it is not used by React.
		// This means that changes to the group do not happen unless the change is accepted and this copy is
		// put back into the edit state.
		const tempGroupsState = _.cloneDeep(editGroupsState);

		// Add the child to the group being edited.
		if (childType === DataType.Meter) {
			// This assume there are no duplicates which is not allowed by menus
			// TODO Seems could just push since copy.
			// const newChildMeters = tempGroupsState[props.groupId].childMeters.concat(childId);
			// tempGroupsState[props.groupId].childMeters = newChildMeters;
			tempGroupsState[props.groupId].childMeters.push(childId);
		} else {
			// TODO once meters works edit this similarly but must check for a circular group
			groupState.childGroups.push(childId);
			// Uses set here so the deep meters are not duplicated.
			// const deepMeters = new Set(group.deepMeters.concat(state.groups.byGroupID[childId].deepMeters));
			const deepMeters = new Set(groupState.deepMeters.concat(editGroupsState[childId].deepMeters));
			groupState.deepMeters = Array.from(deepMeters);
		}

		// The deep meters of any group can change for any group containing the group that just had a meter/group added.
		// Since groups can be indirectly included in another group it is hard to know which ones where impacted so
		// just redo them all for now. Also do this group since it likely changed.
		Object.values(tempGroupsState).forEach(group => {
			tempGroupsState[group.id].deepMeters = calculateMetersInGroup(group.id, tempGroupsState);;
		})

		// Get all parent groups of this group.
		// TODO resolve to use groupState.id or props.groupId
		const parentGroupIDs = await groupsApi.getParentIDs(groupState.id);
		const shouldUpdate = await validateGroupPostAddChild(groupState.id, parentGroupIDs, tempGroupsState);
		// If the admin wants to apply changes.
		if (shouldUpdate) {
			// Update the group. Now, the changes actually happen.
			// Done by setting the edit state to the temp state so does not impact other groups
			// and what is seen until the admin saves.
			// TODO Could limit to only ones changed but just do since local state and easy.
			setEditGroupsState(tempGroupsState);
			return true;
		} else {
			// Not updating so throw away the temp store.
			// The menu needs to be updated to remove this selection so return false.
			return false;
		}
	}

	/**
	 * Determines if the change in compatible units of one group are okay with another group.
	 * Warns admin of changes and returns true if the changes should happen.
	 * @param gid The group that has a change in compatible units.
	 * @param parentGroupIds The parent groups' ids of that group.
	 * @param groupsState The local group state to use.
	 */
	async function validateGroupPostAddChild(gid: number, parentGroupIds: number[], groupsState: any): Promise<boolean> {
		// This will hold the overall message for the admin alert.
		let msg = '';
		// Tells if the change should be cancelled.
		let cancel = false;
		// We check the group being edited and all parent groups for changes in default graphic unit.
		for (const groupId of [...parentGroupIds, gid]) {
			// Use the edit group since want the current values for deepMeters for comparison.
			const parentGroup = editGroupsState[groupId];
			// Get parent's compatible units
			const parentCompatibleUnits = unitsCompatibleWithMeters(new Set(parentGroup.deepMeters));
			// Get compatibility change case when add this group to its parent.
			const compatibilityChangeCase = getCompatibilityChangeCase(parentCompatibleUnits, gid, DataType.Group, parentGroup.defaultGraphicUnit, groupsState[groupId].deepMeters);
			switch (compatibilityChangeCase) {
				case GroupCase.NoCompatibleUnits:
					// The group has no compatible units so cannot do this.
					msg += `${translate('group')} "${parentGroup.name}" ${translate('group.edit.nocompatible')}\n`;
					cancel = true;
					break;

				case GroupCase.LostDefaultGraphicUnit:
					// The group has fewer compatible units and one of the lost ones is the default graphic unit.
					msg += `${translate('group')} "${parentGroup.name}" ${translate('group.edit.nounit')}\n`;
					groupsState[groupId].defaultGraphicUnit = -99;
					break;

				case GroupCase.LostCompatibleUnits:
					// The group has fewer compatible units but the default graphic unit is still allowed.
					msg += `${translate('group')} "${parentGroup.name}" ${translate('group.edit.changed')}\n`;
					break;

				// Case NoChange requires no message.
			}
		}
		if (msg !== '') {
			// There is a message to display to the user.
			if (cancel) {
				// If cancel is true, doesn't allow the admin to apply changes.
				msg += `\n${translate('group.edit.cancelled')}`;
				window.alert(msg);
			} else {
				// If msg is not empty, warns the admin and asks if they want to apply changes.
				msg += `\n${translate('group.edit.verify')}`;
				cancel = !window.confirm(msg);
			}
		}
		return !cancel;
	}

	/**
	 * Converts the child meters of this group to options for menu sorted by identifier
	 * @returns sorted SelectOption for child meters of group editing.
	 */
	function metersToSelectOptions() {
		// In format for the display component for menu.
		const selectedMetersUnsorted: SelectOption[] = [];
		groupState.childMeters.forEach(groupId => {
			selectedMetersUnsorted.push({
				value: groupId,
				label: metersState[groupId].identifier
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order. Note any changes by user can unsort them.
		return _.sortBy(selectedMetersUnsorted, item => item.label.toLowerCase(), 'asc');
	}

	/**
	 * Converts the child groups of this group to options for menu sorted by name
	 * @returns sorted SelectOption for child groups of group editing.
	 */
	function groupsToSelectOptions() {
		// In format for the display component for menu.
		const selectedGroupsUnsorted: SelectOption[] = [];
		groupState.childGroups.forEach(groupId => {
			selectedGroupsUnsorted.push({
				value: groupId,
				label: editGroupsState[groupId].name
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order. Note any changes by user can unsort them.
		return _.sortBy(selectedGroupsUnsorted, item => item.label.toLowerCase(), 'asc');
	}

	/**
	 * Converts the child meters of this group to list options sorted by name.
	 * This is needed for non-admins. Hidden items are not shown but noted in list.
	 * @returns names of all child meters in sorted order.
	 */
	function metersToList() {
		// Hold the list for display.
		const listedMeters: string[] = [];
		// Tells if any meter is not visible to user.
		let hasHidden = false;
		groupState.childMeters.forEach(meterId => {
			const meterIdentifier = metersState[meterId].identifier;
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
		return listedMeters;
	}

	/**
	 * Converts the child meters of this group to list options sorted by name.
	 * This is needed for non-admins. Hidden items are not shown but noted in list.
	 * @returns names of all child meters in sorted order.
	 */
	function groupsToList() {
		const listedGroups: string[] = [];
		let hasHidden = false;
		groupState.childGroups.forEach(groupId => {
				// The name is null if the group is not visible to this user.
			// TODO The following line should work but does not (it does for meters).
			// The Redux state has the name of hidden groups but it should not. A quick
			// attempt to fix did not work as login/out did not clear as expected when
			// control what is returned. This needs to be addressed.
			// if (groupName !== null) {
			// For now, check if the group is displayable.
			if (editGroupsState[groupId].displayable) {
				listedGroups.push(editGroupsState[groupId].name);
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
		return listedGroups;
	}


	/**
	 * Converts the deep meters of this group to list options sorted by identifier.
	 * This is needed for non-admins. Hidden items are not shown but noted in list.
	 * @returns names of all child meters in sorted order.
	 */
	function deepMetersToList() {
		// Unlike child meter/group, these are lists for all users.
		const listedDeepMeters: string[] = [];
		let hasHidden = false;
		groupState.deepMeters.forEach((meterId) => {
			const meterIdentifier = metersState[meterId].identifier;
			if (meterIdentifier === null) {
				// The identifier is null if the meter is not visible to this user.
				hasHidden = true;
			} else {
				// If not null then either non-admin can see or you are an admin.
				listedDeepMeters.push(meterIdentifier);
			}
		});
		// Sort for display.
		listedDeepMeters.sort();
		if (hasHidden) {
			// There are hidden meters so note at bottom of list.
			// This should never happen to an admin.
			listedDeepMeters.push('At least one meter is not visible to you');
		}
		return listedDeepMeters;
	}
}

/**
 * Returns the set of meters's ids associated with the groupId. Does full calculation where
 * only uses the direct meter and group children. It uses a store passed to it so it can
 * be changed without changing the Redux group store. Thus, it directly and recursively gets
 * the deep meters of a group.
 *
 * @param {number} groupId The groupId.
 * @param {GroupDefinition[]} groupState The group state to use in the calculation.
 * @returns {number[]} Array of deep children ids of this group.
 */
function calculateMetersInGroup(groupId: number, groupState: any): number[] {
	// Use a set to avoid duplicates. 
	const groupToCheck = groupState[groupId] as GroupDefinition;
	// The deep meters are the direct child meters of this group plus the direct child meters
	// of all included meters, recursively. Since groups are acyclic, this must terminate.
	// This should reproduce some DB functionality but using local state.
	const deepMeters = new Set(groupToCheck.childMeters);
	groupToCheck.childGroups.forEach(group => {
		// Get the deep meters of this group.
		const meters = calculateMetersInGroup(group, groupState);
		// Add to set of deep meters for the group checking.
		meters.forEach(meter => { deepMeters.add(meter); })
	});
	// Create an array of the deep meters of this group and return it.
	return Array.from(deepMeters);
}

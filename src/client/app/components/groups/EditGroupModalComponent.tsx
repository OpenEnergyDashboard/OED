/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { cloneDeep, isEqual, difference, filter } from 'lodash';
import * as React from 'react';
import { selectSelectedLanguage } from '../../redux/slices/appStateSlice';
// Realize that * is already imported from react
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button, Col, Container, FormFeedback, FormGroup, Input, InputGroup,
	Label, Modal, ModalBody, ModalFooter, ModalHeader, Row
} from 'reactstrap';
import { groupsApi, selectGroupDataById } from '../../redux/api/groupsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectPossibleGraphicUnits } from '../../redux/selectors/adminSelectors';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import { store } from '../../store';
import '../../styles/card-page.css';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { DataType } from '../../types/Datasources';
import { SelectOption, TrueFalseType } from '../../types/items';
import { GroupData } from '../../types/redux/groups';
import { UnitData } from '../../types/redux/units';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import {
	GroupCase,
	getCompatibilityChangeCase,
	getGroupMenuOptionsForGroup,
	getMeterMenuOptionsForGroup,
	unitsCompatibleWithMeters
} from '../../utils/determineCompatibleUnits';
import { AreaUnitType, getAreaUnitConversion } from '../../utils/getAreaUnitConversion';
import { getGPSString, nullToEmptyString } from '../../utils/input';
import { showErrorNotification } from '../../utils/notifications';
import { useTranslate } from '../../redux/componentHooks';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import ListDisplayComponent from '../ListDisplayComponent';
import MultiSelectComponent from '../MultiSelectComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

interface EditGroupModalComponentProps {
	show: boolean;
	groupId: number;
	// passed in to handle opening the modal
	handleShow: () => void;
	// passed in to handle closing the modal
	handleClose: () => void;
}

/**
 * Defines the edit group modal form
 * @param props state variables needed to define the component
 * @returns Group edit element
 */
export default function EditGroupModalComponent(props: EditGroupModalComponentProps) {
	const locale = useAppSelector(selectSelectedLanguage);
	const translate = useTranslate();
	const [submitGroupEdits] = groupsApi.useEditGroupMutation();
	const [deleteGroup] = groupsApi.useDeleteGroupMutation();
	// Meter state
	const meterDataById = useAppSelector(selectMeterDataById);
	const groupDataById = useAppSelector(selectGroupDataById);
	// Group state used on other pages
	// Make a local copy of the group data so we can update during the edit process.
	// When the group is saved the values will be synced again with the global state.
	// This needs to be a deep clone so the changes are only local.
	const [editGroupsState, setEditGroupsState] = useState(cloneDeep(groupDataById));
	const possibleGraphicUnits = useAppSelector(selectPossibleGraphicUnits);

	// Update group state in case changed from create/edit
	useEffect(() => {
		setEditGroupsState(cloneDeep(groupDataById));
	}, [groupDataById]);

	// The current groups state of group being edited of the local copy. It should always be valid.
	const groupState = editGroupsState[props.groupId];

	// Check for admin status
	const loggedInAsAdmin = useAppSelector(selectIsAdmin);

	// The information on the allowed children of this group that can be selected in the menus.
	const groupChildrenDefaults = {
		// The meter selections in format for selection dropdown.
		meterSelectOptions: [] as SelectOption[],
		// The group selections in format for selection dropdown.
		groupSelectOptions: [] as SelectOption[]
	};

	// Information on the default graphic unit values.
	const graphicUnitsStateDefaults = {
		possibleGraphicUnits: possibleGraphicUnits,
		compatibleGraphicUnits: possibleGraphicUnits,
		incompatibleGraphicUnits: new Set<UnitData>()
	};

	/* State */
	// Handlers for each type of input change where update the local edit state.

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditGroupsState({
			...editGroupsState,
			[groupState.id]: {
				...editGroupsState[groupState.id],
				[e.target.name]: e.target.value
			}
		});
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditGroupsState({
			...editGroupsState,
			[groupState.id]: {
				...editGroupsState[groupState.id],
				[e.target.name]: JSON.parse(e.target.value)
			}
		});
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditGroupsState({
			...editGroupsState,
			[groupState.id]: {
				...editGroupsState[groupState.id],
				[e.target.name]: Number(e.target.value)
			}
		});
	};

	// Dropdowns state
	const [groupChildrenState, setGroupChildrenState] = useState(groupChildrenDefaults);
	const [graphicUnitsState, setGraphicUnitsState] = useState(graphicUnitsStateDefaults);

	/* Edit Group Validation:
		Name cannot be blank
		Area must be positive or zero
		If area is nonzero, area unit must be set
		Group must have at least one child (i.e has deep child meters)
	*/
	const [validGroup, setValidGroup] = useState(false);
	useEffect(() => {
		setValidGroup(
			groupState.name !== '' &&
			(groupState.area === 0 || (groupState.area > 0 && groupState.areaUnit !== AreaUnitType.none)) &&
			(groupState.deepMeters.length > 0)
		);
	}, [groupState.area, groupState.areaUnit, groupState.name, groupState.deepMeters]);
	/* End State */

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('group.delete.group') + ' "' + groupState.name + '"?';
	const deleteConfirmText = translate('group.delete.group');
	const deleteRejectText = translate('cancel');
	// The first two handle functions below are required because only one Modal can be open at a time.
	// The messages for delete are a modal so a separate one. Note other user messages are window popups.
	// TODO We should probably go all to modal or popups for messages.
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShow();
	};
	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};
	const handleDeleteGroup = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);
		// Delete the group using the state object where only really need id.
		deleteGroup(groupState.id);
	};
	/* End Confirm Delete Modal */

	// Sums the area of the group's deep meters. It will tell the admin if any meters are omitted from the calculation,
	// or if any other errors are encountered.
	const handleAutoCalculateArea = () => {
		if (groupState.deepMeters.length > 0) {
			if (groupState.areaUnit != AreaUnitType.none) {
				let areaSum = 0;
				let notifyMsg = '';
				groupState.deepMeters.forEach(meterID => {
					const meter = meterDataById[meterID];
					if (meter.area > 0) {
						if (meter.areaUnit != AreaUnitType.none) {
							areaSum += meter.area * getAreaUnitConversion(meter.areaUnit, groupState.areaUnit);
						} else {
							// This shouldn't happen because of the other checks in place when editing/creating a meter.
							// However, there could still be edge cases (i.e meters from before area units were added) that could violate this.
							notifyMsg += '\n"' + meter.identifier + '"' + translate('group.area.calculate.error.unit');
						}
					} else {
						notifyMsg += '\n"' + meter.identifier + '"' + translate('group.area.calculate.error.zero');
					}
				});
				let msg = translate('group.area.calculate.header') + areaSum + ' ' + translate(`AreaUnitType.${groupState.areaUnit}`);
				if (notifyMsg != '') {
					msg += '\n' + translate('group.area.calculate.error.header') + notifyMsg;
				}
				if (window.confirm(msg)) {
					setEditGroupsState({
						...editGroupsState,
						[groupState.id]: {
							...editGroupsState[groupState.id],
							// the + here converts back into a number. this method also removes trailing zeroes.
							['area']: +areaSum.toPrecision(6)
						}
					});
				}
			} else {
				showErrorNotification(translate('group.area.calculate.error.group.unit'));
			}
		} else {
			showErrorNotification(translate('group.area.calculate.error.no.meters'));
		}
	};

	// Reset the state to default values.
	// To be used for the discard changes button
	// Different use case from CreateGroupModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit groups will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		// Set back to the global group values for this group. As before, need a deep copy.
		setEditGroupsState(cloneDeep(groupDataById));
		// Set back to the default values for the menus.
		setGroupChildrenState(groupChildrenDefaults);
		setGraphicUnitsState(graphicUnitsStateDefaults);
	};

	// Should show the modal for editing.
	const handleShow = () => {
		props.handleShow();
	};

	// Note this differs from the props.handleClose(). This is only called when the user
	// clicks to discard or close the modal.
	const handleClose = () => {
		props.handleClose();
		if (loggedInAsAdmin) {
			// State cannot change if you are not an admin.
			resetState();
		}
	};

	// Save changes - done when admin clicks the save button.
	const handleSubmit = () => {
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Check for changes by comparing the original, global state to edited state.
		// This is the unedited state of the group being edited to compare to for changes.
		const originalGroupState = groupDataById[groupState.id];
		// Check children separately since lists.
		const childMeterChanges = !isEqual(originalGroupState.childMeters, groupState.childMeters);
		const childGroupChanges = !isEqual(originalGroupState.childGroups, groupState.childGroups);
		const groupHasChanges =
			(
				originalGroupState.name != groupState.name ||
				originalGroupState.displayable != groupState.displayable ||
				originalGroupState.gps != groupState.gps ||
				originalGroupState.note != groupState.note ||
				originalGroupState.area != groupState.area ||
				originalGroupState.defaultGraphicUnit != groupState.defaultGraphicUnit ||
				childMeterChanges ||
				childGroupChanges ||
				originalGroupState.areaUnit != groupState.areaUnit
			);
		// Only validate and store if any changes.
		if (groupHasChanges) {
			//Check GPS is okay.
			const gpsInput = groupState.gps;
			let gps: GPSPoint | null = null;
			const latitudeIndex = 0;
			const longitudeIndex = 1;
			// If the user input a value then gpsInput should be a string
			// null came from DB and it is okay to just leave it - Not a String.
			if (typeof gpsInput === 'string') {
				if (isValidGPSInput(gpsInput)) {
					// Clearly gpsInput is a string but TS complains about the split so cast.
					const gpsValues = (gpsInput as string).split(',').map((value: string) => parseFloat(value));
					// It is valid and needs to be in this format for routing
					gps = {
						longitude: gpsValues[longitudeIndex],
						latitude: gpsValues[latitudeIndex]
					};
				} else if ((gpsInput as string).length !== 0) {
					// GPS not okay and there since non-zero length value.
					// TODO isValidGPSInput currently pops up an alert so not doing it here, may change
					// so leaving code commented out.
					// showErrorNotification(translate('input.gps.range') + groupState.gps + '.');
					inputOk = false;
				}
			}

			if (inputOk) {
				// The input passed validation so okay to save.

				// A change in this group may have changed other group's default graphic unit. Thus, create a list of
				// all groups needing to be saved. The change would have already
				// been made in the edit state.
				const groupsChanged: number[] = [];
				Object.values(editGroupsState).forEach(group => {
					if (group.defaultGraphicUnit !== groupDataById[group.id].defaultGraphicUnit) {
						groupsChanged.push(group.id);
					}
				});
				// Make sure the group being edited is on the list.
				if (!groupsChanged.includes(groupState.id)) {
					// Add the edited one to the list.
					groupsChanged.push(groupState.id);
				}

				// For all changed groups, save the new group to the DB.
				groupsChanged.forEach(groupId => {
					const thisGroupState = editGroupsState[groupId];
					// There are extra properties in the state so only include the desired ones for edit submit.
					// GPS is one above since may differ from the state.
					const submitState = {
						id: thisGroupState.id, name: thisGroupState.name, childMeters: thisGroupState.childMeters,
						childGroups: thisGroupState.childGroups, gps: gps, displayable: thisGroupState.displayable,
						note: thisGroupState.note, area: thisGroupState.area, defaultGraphicUnit: thisGroupState.defaultGraphicUnit, areaUnit: thisGroupState.areaUnit
					};
					// This saves group to the DB and then refreshes the window if the last group being updated and
					// changes were made to the children. This avoid a reload on name change, etc.
					submitGroupEdits(submitState);
				});
			} else {
				showErrorNotification(translate('group.input.error'));
			}
		}
	};

	// Determine allowed child meters/groups .
	useEffect(() => {
		// Can only vary if admin and only used then.
		if (loggedInAsAdmin) {
			// Get meters that okay for this group in a format the component can display.
			const possibleMeters = getMeterMenuOptionsForGroup(groupState.defaultGraphicUnit, groupState.deepMeters, locale);
			// Get groups okay for this group. Similar to meters.
			const possibleGroups = getGroupMenuOptionsForGroup(groupState.id, groupState.defaultGraphicUnit, groupState.deepMeters, locale);
			// Update the state
			setGroupChildrenState(groupChildrenState => ({
				...groupChildrenState,
				meterSelectOptions: possibleMeters,
				groupSelectOptions: possibleGroups
			}));
		}
		// metersState normally does not change but can so include.
		// globalGroupsState can change if another group is created/edited and this can change ones displayed in menus.
	}, [groupState.deepMeters, groupState.defaultGraphicUnit, groupState.id, loggedInAsAdmin]);

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
			// No unit allowed so modify allowed ones. Should not be there but will be fine if is since set.
			allowedDefaultGraphicUnit.add(-99);
			graphicUnitsState.possibleGraphicUnits.forEach(unit => {
				// If current graphic unit exists in the set of allowed graphic units then compatible and not otherwise.
				if (allowedDefaultGraphicUnit.has(unit.id)) {
					compatibleGraphicUnits.add(unit);
				} else {
					incompatibleGraphicUnits.add(unit);
				}
			});
			// Update the state
			setGraphicUnitsState(graphicUnitsState => ({
				...graphicUnitsState,
				compatibleGraphicUnits: compatibleGraphicUnits,
				incompatibleGraphicUnits: incompatibleGraphicUnits
			}));
		}
		// If any of these change then it needs to be updated.
		// metersState normally does not change but can so include.
		// If another group that is included in this group is changed then it must be redone
		// but we currently do a refresh so it is covered. It should still be okay if
		// the deep meters of this group are properly updated.
	}, [graphicUnitsState.possibleGraphicUnits, groupState.deepMeters, loggedInAsAdmin]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		// Switch help depending if admin or not.
		tooltipEditGroupView: loggedInAsAdmin ? 'help.admin.groupedit' : 'help.groups.groupdetails'
	};

	return (
		<>
			{/* This is for the modal for delete. */}
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteGroup}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<Modal isOpen={props.show} toggle={props.handleClose} size={loggedInAsAdmin ? 'lg' : 'md'}>
				{/* In a number of the items that follow, what is shown varies on whether you are an admin. */}
				<ModalHeader>
					<FormattedMessage id={loggedInAsAdmin ? 'edit.group' : 'group.details'} />
					<TooltipHelpComponent page='groups-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='groups-edit' helpTextId={tooltipStyle.tooltipEditGroupView} />
					</div>
				</ModalHeader>
				<ModalBody><Container>
					{loggedInAsAdmin ?
						<Row xs='1' lg='2'>
							{/* Name input for admin*/}
							<Col><FormGroup>
								<Label for='name'>{translate('name')}</Label>
								<Input
									id='name'
									name='name'
									type='text'
									autoComplete='on'
									onChange={e => handleStringChange(e)}
									required value={groupState.name}
									invalid={groupState.name === ''} />
								<FormFeedback>
									<FormattedMessage id="error.required" />
								</FormFeedback>
							</FormGroup></Col>
							{/* default graphic unit input for admin */}
							<Col><FormGroup>
								<Label for='defaultGraphicUnit'>{translate('defaultGraphicUnit')}</Label>
								<Input
									id='defaultGraphicUnit'
									name='defaultGraphicUnit'
									type='select'
									value={groupState.defaultGraphicUnit}
									onChange={e => handleNumberChange(e)}>
									{/* First list the selectable ones and then the rest as disabled. */}
									{Array.from(graphicUnitsState.compatibleGraphicUnits).map(unit => {
										return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>);
									})}
									{Array.from(graphicUnitsState.incompatibleGraphicUnits).map(unit => {
										return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>);
									})}
								</Input>
							</FormGroup></Col>
						</Row>
						: <>
							{/* Name display for non-admin */}
							<FormGroup>
								<Label for='name'>{translate('name')}</Label>
								<Input
									id='name'
									name='name'
									type='text'
									autoComplete='on'
									value={groupState.name}
									disabled />
							</FormGroup>
							{/* default graphic unit display for non-admin */}
							<FormGroup>
								<Label for='defaultGraphicUnit'>{translate('defaultGraphicUnit')}</Label>
								{/* TODO: This component still displays a dropdown arrow, even though a user cannot use the dropdown */}
								<Input
									id='defaultGraphicUnit'
									name='defaultGraphicUnit'
									type='select'
									value={groupState.defaultGraphicUnit}
									disabled>
									{Array.from(graphicUnitsState.compatibleGraphicUnits).map(unit => {
										return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>);
									})}
								</Input>
							</FormGroup>
						</>}
					{loggedInAsAdmin && <>
						<Row xs='1' lg='2'>
							<Col>
								{/* Displayable input, only for admin. */}
								<FormGroup>
									<Label for='displayable'>{translate('displayable')}</Label>
									<Input
										id='displayable'
										name='displayable'
										type='select'
										value={groupState.displayable.toString()}
										onChange={e => handleBooleanChange(e)}>
										{Object.keys(TrueFalseType).map(key => {
											return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
										})}
									</Input>
								</FormGroup>
							</Col>
							<Col>
								{/* GPS input, only for admin. */}
								<FormGroup>
									<Label for='gps'>{translate('gps')}</Label>
									<Input
										id='gps'
										name='gps'
										type='text'
										autoComplete='on'
										onChange={e => handleStringChange(e)}
										value={getGPSString(groupState.gps)} />
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								{/* Area input, only for admin. */}
								<FormGroup>
									<Label for='area'>{translate('area')}</Label>
									<InputGroup>
										<Input
											id='area'
											name='area'
											type='number'
											min='0'
											// cannot use defaultValue because it won't update when area is auto calculated
											// this makes the validation redundant but still a good idea
											value={groupState.area}
											onChange={e => handleNumberChange(e)}
											invalid={groupState.area < 0} />
										{/* Calculate sum of meter areas */}
										<Button color='secondary' onClick={handleAutoCalculateArea}>
											<FormattedMessage id="area.calculate.auto" />
										</Button>
										<TooltipMarkerComponent page='groups-edit' helpTextId='help.groups.area.calculate' />
										<FormFeedback>
											<FormattedMessage id="error.negative" />
										</FormFeedback>
									</InputGroup>
								</FormGroup>
							</Col>
							<Col>
								{/* meter area unit input */}
								<FormGroup>
									<Label for='areaUnit'>{translate('area.unit')}</Label>
									<Input
										id='areaUnit'
										name='areaUnit'
										type='select'
										value={groupState.areaUnit}
										onChange={e => handleStringChange(e)}
										invalid={groupState.area > 0 && groupState.areaUnit === AreaUnitType.none}>
										{Object.keys(AreaUnitType).map(key => {
											return (<option value={key} key={key}>{translate(`AreaUnitType.${key}`)}</option>);
										})}
									</Input>
									<FormFeedback>
										<FormattedMessage id="area.but.no.unit" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						{/* Note input, only for admin. */}
						<FormGroup>
							<Label for='note'>{translate('note')} </Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={nullToEmptyString(groupState.note)} />
						</FormGroup>
					</>}
					{/* The child meters in this group */}
					{loggedInAsAdmin ?
						<FormGroup>
							<FormattedMessage id='child.meters' />:
							<MultiSelectComponent
								options={groupChildrenState.meterSelectOptions}
								selectedOptions={metersToSelectOptions()}
								placeholder={translate('select.meters')}
								onValuesChange={async (newSelectedMeterOptions: SelectOption[]) => {
									// The meters changed so verify update is okay and deal with appropriately.
									// The length of selected meters should only vary by 1 since each change is handled separately.
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
										// Could have removed any item so figure out which one it is. Need to convert options to ids.
										const removedMeter = difference(groupState.childMeters, newSelectedMeterOptions.map(item => { return item.value; }));
										// There should only be one removed item.
										const removedMeterId = removedMeter[0];
										const childRemoved = removeChildFromGroup(removedMeterId, DataType.Meter);
										if (!childRemoved) {
											// The new child meter removal was rejected so put it back. Should only be one item so no need to sort.
											newSelectedMeterOptions.push({
												value: removedMeterId,
												label: meterDataById[removedMeterId].identifier
												// isDisabled not needed since only used for selected and not display.
											} as SelectOption
											);
										}
									}
								}}
							/>
						</FormGroup>
						:
						<FormGroup>
							<FormattedMessage id='child.meters' />:
							<ListDisplayComponent items={metersToList()} />
						</FormGroup>
					}
					{/* The child groups in this group */}
					{loggedInAsAdmin ?
						<FormGroup>
							<FormattedMessage id='child.groups' />:
							<MultiSelectComponent
								options={groupChildrenState.groupSelectOptions}
								selectedOptions={groupsToSelectOptions()}
								placeholder={translate('select.groups')}
								onValuesChange={async (newSelectedGroupOptions: SelectOption[]) => {
									// The groups changed so verify update is okay and deal with appropriately.
									// The length of of selected groups should only vary by 1 since each change is handled separately.
									// Compare the new length to the original length that is the same as
									// the number of child groups of group being edited.
									if (newSelectedGroupOptions.length === groupState.childGroups.length + 1) {
										// A group was selected so it is considered for adding.
										// The newly selected item is always the last one.
										// Now attempt to add the child to see if okay.
										const childAdded = await assignChildToGroup(newSelectedGroupOptions[newSelectedGroupOptions.length - 1].value, DataType.Group);
										if (!childAdded) {
											// The new child meter was rejected so remove it. It is the last one.
											newSelectedGroupOptions.pop();
										}
									} else {
										// Could have removed any item so figure out which one it is. Need to convert options to ids.
										const removedGroup = difference(groupState.childGroups, newSelectedGroupOptions.map(item => { return item.value; }));
										// There should only be one removed item.
										const removedGroupId = removedGroup[0];
										const childRemoved = removeChildFromGroup(removedGroupId, DataType.Group);
										if (!childRemoved) {
											// The new child group removal was rejected so put it back. Should only be one item so no need to sort.
											newSelectedGroupOptions.push({
												value: removedGroupId,
												// The name should not have changed since cannot be group editing but use the edit state to be consistent.
												label: editGroupsState[removedGroupId].name
												// isDisabled not needed since only used for selected and not display.
											} as SelectOption
											);
										}
									}
								}}
							/>
						</FormGroup>
						:
						<FormGroup>
							<FormattedMessage id='child.groups' />:
							<ListDisplayComponent items={groupsToList()} />
						</FormGroup>
					}
					{/* All (deep) meters in this group */}
					<FormattedMessage id='group.all.meters' />:
					<ListDisplayComponent items={deepMetersToList()} />
				</Container></ModalBody>
				<ModalFooter>
					{/* Delete, discard & save buttons if admin and close button if not. */}
					{loggedInAsAdmin ?
						<div>
							{/* delete group */}
							<Button color='danger' onClick={validateDelete}>
								<FormattedMessage id="group.delete.group" />
							</Button>
							{/* Hides the modal */}
							<Button color='secondary' onClick={handleClose}>
								<FormattedMessage id="discard.changes" />
							</Button>
							{/* On click calls the function handleSaveChanges in this component */}
							<Button color='primary' onClick={handleSubmit} disabled={!validGroup}>
								<FormattedMessage id="save.all" />
							</Button>
						</div>
						:
						<Button color='secondary' onClick={handleClose}>
							<FormattedMessage id="close" />
						</Button>
					}
				</ModalFooter>
			</Modal >
		</>
	);

	// The following functions are nested so can easily get and set the state that is local to the outer function.

	/**
	 * Validates and warns user when adding a child group/meter to a specific group.
	 * If the check pass, update the edited group and related groups.
	 * @param childId The group/meter's id to add to the parent group.
	 * @param childType Can be group or meter.
	 * @returns true if the child was assigned and false otherwise
	 */
	async function assignChildToGroup(childId: number, childType: DataType): Promise<boolean> {
		// Create a deep copy of the edit state before adding the child. We only need some of the state but this is easier.
		// This copy is directly changed without using the Redux hooks since it is not used by React.
		// This means that changes to the group do not happen unless the change is accepted and this copy is
		// put back into the edit state.
		const tempGroupsState = cloneDeep(editGroupsState);

		// Add the child to the group being edited in temp so can decide if want change.
		// This assumes there are no duplicates which is not allowed by menus
		if (childType === DataType.Meter) {
			tempGroupsState[groupState.id].childMeters.push(childId);
		} else {
			tempGroupsState[groupState.id].childGroups.push(childId);
		}
		// The deep meters of any group can change for any group containing the group that just had a meter/group added.
		// Since groups can be indirectly included in another group it is hard to know which ones where impacted so
		// just redo them all for now. Also do this group since it likely changed.
		// Returned value tells if update should happen.
		let shouldUpdate = !Object.values(tempGroupsState).some(group => {
			const deepMeters = calculateMetersInGroup(group.id, tempGroupsState);
			if (deepMeters.length === 0) {
				// There is a circular dependency so this change is not allowed.
				// Cannot be case of no children since adding child.
				// Let the user know.
				showErrorNotification(`${translate('group.edit.circular')}\n\n${translate('group.edit.cancelled')}`);
				// Stops processing and will return this result (negated).
				return true;
			} else {
				// Group okay so update deep meters for it.
				tempGroupsState[group.id].deepMeters = deepMeters;
				// Go to next group/keep processing.
				return false;
			}
		});

		// Only do next step if update is still possible.
		if (shouldUpdate) {
			// Get all parent groups of this group.
			const { data: parentGroupIDs = [] } = await store.dispatch(groupsApi.endpoints.getParentIDs.initiate(groupState.id, { subscribe: false }));
			// Check for group changes and have admin agree or not.
			shouldUpdate = await validateGroupPostAddChild(groupState.id, parentGroupIDs, tempGroupsState);
		}
		// If the admin wants to apply changes and allowed.
		if (shouldUpdate) {
			// Update the group. Now, the changes actually happen.
			// Done by setting the edit state to the temp state so does not impact other groups
			// and what is seen until the admin saves.
			// Could limit to only ones changed but just do since local state and easy pull easy to see changed by Redux.
			setEditGroupsState(tempGroupsState);
		}

		// Tell if applied update.
		return shouldUpdate;
	}

	/**
	 * Determines if the change in compatible units of one group are okay with another group.
	 * Warns admin of changes and returns true if the changes should happen.
	 * @param gid The group that has a change in compatible units.
	 * @param parentGroupIds The parent groups' ids of that group.
	 * @param groupsState The local group state to use.
	 * @returns true if change fine or if admin agreed. false if admin does not or the change is an issue.
	 */
	function validateGroupPostAddChild(gid: number, parentGroupIds: number[], groupsState: any): boolean {
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
			const compatibilityChangeCase = getCompatibilityChangeCase(parentCompatibleUnits, gid, DataType.Group,
				parentGroup.defaultGraphicUnit, groupsState[groupId].deepMeters);
			switch (compatibilityChangeCase) {
				case GroupCase.NoCompatibleUnits:
					// The group has no compatible units so cannot do this.
					msg += `${translate('group')} "${parentGroup.name}" ${translate('group.edit.nocompatible')}\n`;
					cancel = true;
					break;

				case GroupCase.LostDefaultGraphicUnit:
					// The group has fewer compatible units and one of the lost ones is the default graphic unit.
					msg += `${translate('group')} "${parentGroup.name}" ${translate('group.edit.nounit')}\n`;
					// The current default graphic unit is no longer valid so make it no unit.
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
				showErrorNotification(msg);
			} else {
				// If msg is not empty, warns the admin and asks if they want to apply changes.
				msg += `\n${translate('group.edit.verify')}`;
				cancel = !window.confirm(msg);
			}
		}
		return !cancel;
	}

	/**
	 * Handles removing child from a group.
	 * @param childId The group/meter's id to add to the parent group.
	 * @param childType Can be group or meter.
	 * @returns true if change fine or if admin agreed. false if admin does not or the change is an issue.
	 */
	function removeChildFromGroup(childId: number, childType: DataType): boolean {
		// Unlike adding, you do not change the default graphic unit by removing. Thus, you only need to recalculate the
		// deep meters and remove this child from the group being edited.

		// Create a deep copy of the edit state before adding the child. We only need some of the state but this is easier.
		// This copy is directly changed without using the Redux hooks since it is not used by React.
		// This means that changes to the group do not happen put back into the edit state.
		// For the record, it was tried to not create the copy and update the edit state for each change. This had
		// two issues. First, the next step in this function does not see the change because Redux does not update
		// until the next render. Second, and more importantly, the updated state was not showing during the render.
		// Why that is the case was unclear because the set value were correct. Given all of this and to make the
		// code more similar to add, it is done with a copy.
		const tempGroupsState = cloneDeep(editGroupsState);

		// Add the child to the group being edited.
		if (childType === DataType.Meter) {
			// All the children without one being removed.
			const newChildren = filter(tempGroupsState[groupState.id].childMeters, value => value != childId);
			tempGroupsState[groupState.id].childMeters = newChildren;
		} else {
			// All the children without one being removed.
			const newChildren = filter(tempGroupsState[groupState.id].childGroups, value => value != childId);
			tempGroupsState[groupState.id].childGroups = newChildren;
		}

		// The deep meters of any group can change for any group containing the group that just had a meter/group added.
		// Since groups can be indirectly included in another group it is hard to know which ones where impacted so
		// just redo them all for now. Also do this group since it likely changed.
		const groupOk = !Object.values(tempGroupsState).some(group => {
			const newDeepMeters = calculateMetersInGroup(group.id, tempGroupsState);
			// If the array is empty then there are no child meters nor groups and this is not allowed.
			// The change is rejected.
			// This should only happen for the group being edited but check for all since easier.
			if (newDeepMeters.length === 0) {
				// Let the user know.
				showErrorNotification(`${translate('group.edit.empty')}\n\n${translate('group.edit.cancelled')}`);
				// Indicate issue and stop processing.
				return true;
			} else {
				// Update the temp deep meters and continue.
				tempGroupsState[group.id].deepMeters = newDeepMeters;
				return false;
			}
		});

		// Only update if the group is okay.
		if (groupOk) {
			// Update the group. Now, the changes actually happen.
			// Done by setting the edit state to the temp state so does not impact other groups
			// and what is seen until the admin saves.
			// Could limit to only ones changed but just do since local state and easy.
			setEditGroupsState(tempGroupsState);
		}
		// Tells if the edit was accepted.
		return groupOk;
	}

	/**
	 * Checks if this group is contained in another group. If so, no delete.
	 * If not, then continue delete process.
	 */
	async function validateDelete() {
		// Get all parent groups of this group.
		const { data: parentGroupIDs = [] } = await store.dispatch(groupsApi.endpoints.getParentIDs.initiate(groupState.id, { subscribe: false }));

		// If there are parents then you cannot delete this group. Notify admin.
		if (parentGroupIDs.length !== 0) {
			// This will hold the overall message for the admin alert.
			let msg = `${translate('group')} "${groupState.name}" ${translate('group.delete.issue')}:\n`;
			parentGroupIDs.forEach(groupId => {
				msg += `${editGroupsState[groupId].name}\n`;
			});
			msg += `\n${translate('group.edit.cancelled')}`;
			showErrorNotification(msg);
		} else {
			// The group can be deleted.
			handleDeleteConfirmationModalOpen();
		}
	}

	/**
	 * Converts the child meters of this group to options for menu sorted by identifier
	 * @returns sorted SelectOption for child meters of group editing.
	 */
	function metersToSelectOptions(): SelectOption[] {
		// In format for the display component for menu.
		const selectedMetersUnsorted: SelectOption[] = [];
		groupState.childMeters.forEach(groupId => {
			selectedMetersUnsorted.push({
				value: groupId,
				label: meterDataById[groupId].identifier
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order.
		return selectedMetersUnsorted.sort((meterA, meterB) => meterA.label.toLowerCase()?.
			localeCompare(meterB.label.toLowerCase(), String(locale), { sensitivity: 'accent'}));
	}

	/**
	 * Converts the child groups of this group to options for menu sorted by name
	 * @returns sorted SelectOption for child groups of group editing.
	 */
	function groupsToSelectOptions(): SelectOption[] {
		// In format for the display component for menu.
		const selectedGroupsUnsorted: SelectOption[] = [];
		groupState.childGroups.forEach(groupId => {
			selectedGroupsUnsorted.push({
				value: groupId,
				// Use globalGroupsState so see edits in other groups. You would miss an update
				// in this group but it cannot be on the menu so that is okay.
				label: groupDataById[groupId].name
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order.
		return selectedGroupsUnsorted.sort((groupA, groupB) => groupA.label.toLowerCase()?.
			localeCompare(groupB.label.toLowerCase(), String(locale), { sensitivity: 'accent'}));
	}

	/**
	 * Converts the child meters of this group to list options sorted by name.
	 * This is needed for non-admins. Hidden items are not shown but noted in list.
	 * @returns names of all child meters in sorted order.
	 */
	function metersToList(): string[] {
		// Hold the list for display.
		const listedMeters: string[] = [];
		// Tells if any meter is not visible to user.
		let hasHidden = false;
		groupState.childMeters.forEach(meterId => {
			const meterIdentifier = meterDataById[meterId].identifier;
			// The identifier is null if the meter is not visible to this user. If hidden then do
			// not list and otherwise label.
			if (meterIdentifier === null) {
				hasHidden = true;
			} else {
				listedMeters.push(meterIdentifier);
			}
		});
		// Sort for display. Before were sorted by id so not okay here.
		listedMeters.sort((meterA, meterB) => meterA.toLowerCase().localeCompare(meterB.toLowerCase(), locale, { sensitivity : 'accent' }));
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
	function groupsToList(): string[] {
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
		listedGroups.sort((groupA, groupB) => groupA.toLowerCase().localeCompare(
			groupB.toLowerCase(), locale, { sensitivity : 'accent' }));
		if (hasHidden) {
			// There are hidden groups so note at bottom of list.
			listedGroups.push(translate('group.hidden'));
		}
		return listedGroups;
	}

	/**
	 * Converts the deep meters of this group to list options sorted by identifier.
	 * Hidden items are not shown but noted in list; admins should never see that.
	 * @returns names of all child meters in sorted order.
	 */
	function deepMetersToList() {
		// Unlike child meter/group, these are lists for all users.
		const listedDeepMeters: string[] = [];
		let hasHidden = false;
		groupState.deepMeters.forEach(meterId => {
			const meterIdentifier = meterDataById[meterId].identifier;
			if (meterIdentifier === null) {
				// The identifier is null if the meter is not visible to this user.
				hasHidden = true;
			} else {
				// If not null then either non-admin can see or you are an admin.
				listedDeepMeters.push(meterIdentifier);
			}
		});
		// Sort for display.
		listedDeepMeters.sort((deepMeterA, deepMeterB) => deepMeterA.toLowerCase().localeCompare(
			deepMeterB.toLowerCase(), locale, { sensitivity : 'accent' }));
		if (hasHidden) {
			// There are hidden meters so note at bottom of list.
			// This should never happen to an admin.
			listedDeepMeters.push(translate('meter.hidden'));
		}
		return listedDeepMeters;
	}
}

/**
 * Returns the set of meters ids associated with the groupId. Does full calculation where
 * only uses the direct meter and group children. It uses a store passed to it so it can
 * be changed without changing the Redux group store. Thus, it directly and recursively gets
 * the deep meters of a group.
 * @param groupId The groupId.
 * @param groupState The group state to use in the calculation.
 * @param times The number of times the function has been recursively called. Not passed on first call and only used internally.
 * @returns Array of deep children ids of this group or empty array if none/circular dependency.
 */
function calculateMetersInGroup(groupId: number, groupState: any, times: number = 0): number[] {
	// The number of times should be set to zero on the first call. Each time add one and assume
	// if depth of calls is greater than value then there is a circular dependency and stop to report issue.
	// This assumes no site will ever have a group chain of this length which seems safe.
	if (++times > 50) {
		return [];
	}
	// Group to get the deep meters for.
	const groupToCheck = groupState[groupId] as GroupData;
	// Use a set to avoid duplicates.
	// The deep meters are the direct child meters of this group plus the direct child meters
	// of all included meters, recursively.
	// This should reproduce some DB functionality but using local state.
	const deepMeters = new Set(groupToCheck.childMeters);
	// Loop over all included groups to get its meters.
	groupToCheck.childGroups.some(group => {
		// Get the deep meters of this group.
		const meters = calculateMetersInGroup(group, groupState, times);
		if (meters.length === 0) {
			// Issue found so stop loop and return empty set. There must be meters if all is okay.
			// Clear deep meters so calling function knows there is an issue.
			deepMeters.clear();
			// Stops the processing.
			return true;
		} else {
			// Add to set of deep meters for the group checking.
			meters.forEach(meter => { deepMeters.add(meter); });
			// Continue loop to process more.
			return false;
		}
	});
	// Create an array of the deep meters of this group and return it.
	// It will be empty if there are none.
	return Array.from(deepMeters);
}

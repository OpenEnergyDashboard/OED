/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
// TODO import store from '../../index';
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
import { unitsCompatibleWithMeters, metersInGroup } from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { notifyUser, getGPSString, nullToEmptyString } from '../../utils/input';
import { getSelectOptionsByItem } from '../ChartDataSelectComponent';

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

	// The chosen meters are initially the meter children of this group.
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
	// Want chosen in sorted order.
	let selectedMeters = _.sortBy(selectedMetersUnsorted, item => item.label.toLowerCase(), 'asc');

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// Set existing group values
	const values = {
		name: originalGroupState.name,
		childMeters: originalGroupState.childMeters,
		childGroups: originalGroupState.childGroups,
		displayable: originalGroupState.displayable,
		gps: originalGroupState.gps,
		note: originalGroupState.note,
		area: originalGroupState.area,
		defaultGraphicUnit: originalGroupState.defaultGraphicUnit,
		id: originalGroupState.id
	}

	// The information on the children of this group
	const groupChildrenDefaults = {
		// The identifiers of all direct meter children that are visible to this user.
		childMetersIdentifier: [] as string[],
		// The original number of direct meter children
		childMetersTrueSize: 0,
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
	}

	const handleClose = () => {
		props.handleClose();
		resetState();
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
		const childMeterChanges = !metersSame(originalGroupState.childMeters, selectedMeters);
		const groupHasChanges =
			(
				originalGroupState.name != state.name ||
				originalGroupState.displayable != state.displayable ||
				originalGroupState.gps != state.gps ||
				originalGroupState.note != state.note ||
				originalGroupState.area != state.area ||
				originalGroupState.defaultGraphicUnit != state.defaultGraphicUnit ||
				childMeterChanges
				// TODO add children value when can edit and any others
			);
		// Only validate and store if any changes.
		if (groupHasChanges) {
			//Check if area is positive
			// TODO object is possibly undefined
			// TODO For now allow zero so works with default value and DB. We should probably
			// make this better default than 0 (DB set to not null now).
			if (state.area < 0) {
				notifyUser(translate('area.invalid') + state.area + '.');
				inputOk = false;
			}

			// TODO - not done on meters; may not need once set value properly
			//Check default graphic unit
			if (state.defaultGraphicUnit === -999) {
				notifyUser(translate('group.graphic.invalid'));
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
				let childMeters: number[] = [];
				if (childMeterChanges) {
					// Send child meters to update but need to create array of the ids.
					childMeters = selectedMeters.map(meter => { return meter.value; });
					submitState = { ...state, childMeters: childMeters }
				}
				dispatch(submitGroupEdits(submitState));
				dispatch(removeUnsavedChanges());
			} else {
				notifyUser(translate('group.input.error'));
			}
		}
	};

	// TODO consider useSelect vs useEffect and implications for entire codebase
	const dataProps = useSelector((state: State) => {
		// Get meters that okay for this group in a format the component can display.
		const sortedMeters = getMeterCompatibilityForDropdown(state);
		// push a dummy item as a divider.
		const firstDisabledMeter: number = sortedMeters.findIndex(item => item.isDisabled);
		if (firstDisabledMeter != -1) {
			sortedMeters.splice(firstDisabledMeter, 0, {
				value: 0,
				label: '----- Incompatible Meters -----',
				isDisabled: true
			} as SelectOption
			);
		}

		return {
			// all meter, sorted alphabetically and by compatibility
			sortedMeters
		}
	});

	// Determine the names of the child meters/groups.
	useEffect(() => {
		// State for current group
		const currentGroup = groupsState[state.id];

		// Information to display the direct children meters.
		// Holds the names of all direct meter children of this group when visible to this user.
		const childMetersIdentifier: string[] = [];
		let trueMeterSize = 0;
		// Make sure state exists as the dispatch above may not be done.
		if (currentGroup.childMeters) {
			currentGroup.childMeters.forEach((meterID: number) => {
				// Make sure meter state exists. Also, the identifier is missing if not visible (non-admin).
				if (metersState[meterID] !== undefined && metersState[meterID].identifier !== null) {
					childMetersIdentifier.push(metersState[meterID].identifier.trim());
				}
			});
			childMetersIdentifier.sort();
			// Record the total number so later can compare the number in array to see if any missing.
			trueMeterSize = currentGroup.childMeters.length;
		}

		// Information to display the direct children groups.
		// Holds the names of all direct group children of this group when visible to this user.
		const childGroupsName: string[] = [];
		let trueGroupSize = 0;
		// Make sure state exists as the dispatch above may not be done.
		if (currentGroup.childGroups) {
			currentGroup.childGroups.forEach((groupID: number) => {
				// Make sure group state exists. Also, the name is missing if not visible (non-admin).
				if (groupsState[groupID] !== undefined && groupsState[groupID].name !== null) {
					childGroupsName.push(groupsState[groupID].name.trim());
				}
			});
			childGroupsName.sort();
			// Record the total number so later can compare the number in array to see if any missing.
			trueGroupSize = currentGroup.childGroups.length;
		}

		// Information to display all (deep) children meters.
		// Holds the names of all (deep) meter children of this group when visible to this user.
		const deepMetersIdentifier: string[] = [];
		let trueDeepMeterSize = 0;
		// Make sure state exists as the dispatch above may not be done.
		if (currentGroup.deepMeters) {
			currentGroup.deepMeters.forEach((meterID: number) => {
				// Make sure meter state exists. Also, the identifier is missing if not visible (non-admin).
				if (metersState[meterID] !== undefined && metersState[meterID].identifier !== null) {
					deepMetersIdentifier.push(metersState[meterID].identifier.trim());
				}
			});
			deepMetersIdentifier.sort();
			// Record the total number so later can compare the number in array to see if any missing.
			trueDeepMeterSize = currentGroup.deepMeters.length;
		}

		// Update the state
		setGroupChildrenState({
			...groupChildrenState,
			childMetersIdentifier: childMetersIdentifier,
			childMetersTrueSize: trueMeterSize,
			childGroupsName: childGroupsName,
			childGroupsTrueSize: trueGroupSize,
			deepMetersIdentifier: deepMetersIdentifier,
			deepMetersTrueSize: trueDeepMeterSize
		})
	}, [metersState, groupsState[state.id].childMeters, groupsState[state.id].childGroups, groupsState[state.id].deepMeters]);

	// Update compatible units and graphic units set.
	useEffect(() => {
		// Graphic units compatible with currently selected unit
		const compatibleGraphicUnits = new Set<UnitData>();
		// Graphic units incompatible with currently selected unit
		const incompatibleGraphicUnits = new Set<UnitData>();
		// Find all the meters in this group. Initially this will be the same as the deep meters but needs to be updated
		// if edited on this page. Then find all the units that are compatible with these meters.
		// TODO this isn't going to be correct if the meters or groups of this group is edited on this page
		// because it does not change the group state until you save.
		const allowedDefaultGraphicUnit = unitsCompatibleWithMeters(metersInGroup(state.id));
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
			compatibleGraphicUnits: new Set(compatibleGraphicUnits),
			incompatibleGraphicUnits: new Set(incompatibleGraphicUnits)
		});
		// If any of these change then it needs to be updated.
		// pik is needed since the compatible units is not correct until pik is available.
		// TODO need to add change in meters and groups of this group once settle how going to do above.
	}, [ConversionArray.pikAvailable()]);

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
											{state.defaultGraphicUnit === -99 ? 'no unit' : unitState[state.defaultGraphicUnit].identifier}
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
									<div style={formInputStyle}>
										<b><FormattedMessage id='child.meters' /></b>:
										<MultiSelectComponent
											options={dataProps.sortedMeters}
											selectedOptions={selectedMeters}
											placeholder={translate('select.meters')}
											onValuesChange={(newSelectedMeterOptions: SelectOption[]) => {
												selectedMeters = newSelectedMeterOptions;
											}}
										/>
									</div>
									{/* The child groups in this group */}
									<div>
										<b><FormattedMessage id='child.groups' /></b>:
										<ListDisplayComponent trueSize={groupChildrenState.childGroupsTrueSize} items={groupChildrenState.childGroupsName} />
									</div>
									{/* All (deep) meters in this group */}
									<div>
										<b><FormattedMessage id='group.all.meters' /></b>:
										<ListDisplayComponent trueSize={groupChildrenState.deepMetersTrueSize} items={groupChildrenState.deepMetersIdentifier} />
									</div>
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

// TODO maybe just pass the meter state?
/**
 * Determines the compatibility of meters in the redux state for display in dropdown
 * @param {State} state - current redux state
 * @returns {SelectOption[]} an array of SelectOption
 */
function getMeterCompatibilityForDropdown(state: State) {
	// meters that can be selected for this group
	const compatibleMeters = new Set<number>();
	// meters that cannot be selected for this group
	const incompatibleMeters = new Set<number>();
	// TODO right now just allowing all meters
	Object.values(state.meters.byMeterID).forEach(meter => {
		compatibleMeters.add(meter.id);
	});

	// Retrieve select options from meter sets
	const finalMeters = getSelectOptionsByItem(compatibleMeters, incompatibleMeters, state.meters);
	return finalMeters;
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

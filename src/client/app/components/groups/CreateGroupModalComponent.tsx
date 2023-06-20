/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as _ from 'lodash';
import * as React from 'react';
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
import { submitNewGroup } from '../../actions/groups';
import { TrueFalseType } from '../../types/items';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { UnitData } from '../../types/redux/units';
import {
	unitsCompatibleWithMeters, getMeterMenuOptionsForGroup, getGroupMenuOptionsForGroup, metersInChangedGroup
} from '../../utils/determineCompatibleUnits';
import { ConversionArray } from '../../types/conversionArray';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { notifyUser, getGPSString } from '../../utils/input'
import { formInputStyle, tableStyle, requiredStyle, tooltipBaseStyle } from '../../styles/modalStyle';
import { AreaUnitType, getAreaUnitConversion } from '../../utils/getAreaUnitConversion';

interface CreateGroupModalComponentProps {
	possibleGraphicUnits: Set<UnitData>;
}

export default function CreateGroupModalComponent(props: CreateGroupModalComponentProps) {
	const dispatch = useDispatch();

	// Meter state
	const metersState = useSelector((state: State) => state.meters.byMeterID);
	// Group state
	const groupsState = useSelector((state: State) => state.groups.byGroupID);
	// Unit state
	const unitsState = useSelector((state: State) => state.units.units);

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// Since creating group the initial values are effectively nothing or the desired defaults.
	const defaultValues = {
		name: '',
		childMeters: [] as number[],
		childGroups: [] as number[],
		deepMeters: [] as number[],
		gps: null,
		displayable: false,
		note: '',
		area: 0,
		// default is no unit or -99.
		defaultGraphicUnit: -99,
		areaUnit: AreaUnitType.none
	}

	// The information on the children of this group for state. Except for selected, the
	// values are set by the useEffect functions.
	const groupChildrenDefaults = {
		// The meter selections in format for selection dropdown and initially empty.
		meterSelectOptions: [] as SelectOption[],
		// The group selections in format for selection dropdown and initially empty.
		groupSelectOptions: [] as SelectOption[]
	}

	// Information on the default graphic unit values.
	const graphicUnitsStateDefaults = {
		possibleGraphicUnits: props.possibleGraphicUnits,
		compatibleGraphicUnits: props.possibleGraphicUnits,
		incompatibleGraphicUnits: new Set<UnitData>()
	}

	/* State */
	// State for the created group.
	const [state, setState] = useState(defaultValues);

	// Handlers for each type of input change

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	}

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	}

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: Number(e.target.value) });
	}

	// Unlike EditGroupsModalComponent, we don't pass show and close via props.
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// Dropdowns state
	const [groupChildrenState, setGroupChildrenState] = useState(groupChildrenDefaults)
	const [graphicUnitsState, setGraphicUnitsState] = useState(graphicUnitsStateDefaults);
	/* End State */

	// Sums the area of the group's deep meters. It will tell the admin if any meters are omitted from the calculation,
	// or if any other errors are encountered.
	const handleAutoCalculateArea = () => {
		if (state.deepMeters != undefined && state.deepMeters.length > 0) {
			if (state.areaUnit != AreaUnitType.none) {
				let areaSum = 0;
				let notifyMsg = '';
				state.deepMeters.forEach(meterID => {
					const meter = metersState[meterID];
					if (meter.area > 0) {
						if (meter.areaUnit != AreaUnitType.none) {
							areaSum += meter.area * getAreaUnitConversion(meter.areaUnit, state.areaUnit);
						} else {
							// This shouldn't happen because of the other checks in place when editing/creating a meter.
							// However, there could still be edge cases (i.e meters from before area units were added) that could violate this.
							notifyMsg += '\n"' + meter.identifier + '"' + translate('group.area.calculate.error.unit');
						}
					} else {
						notifyMsg += '\n"' + meter.identifier + '"' + translate('group.area.calculate.error.zero');
					}
				});
				translate('group.area.calculate.header')
				let msg = translate('group.area.calculate.header') + areaSum + ' ' + translate(`AreaUnitType.${state.areaUnit}`);
				if (notifyMsg != '') {
					msg += '\n' + translate('group.area.calculate.error.header') + notifyMsg;
				}
				if (window.confirm(msg)) {
					// the + here converts back into a number
					setState({ ...state, ['area']: +areaSum.toPrecision(6) });
				}
			} else {
				notifyUser(translate('group.area.calculate.error.group.unit'));
			}
		} else {
			notifyUser(translate('group.area.calculate.error.no.meters'));
		}
	}

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => { setShowModal(true); }

	// Reset the state to default value so each time starts from scratch.
	const resetState = () => {
		setState(defaultValues);
		setGroupChildrenState(groupChildrenDefaults);
		setGraphicUnitsState(graphicUnitsStateDefaults);
	}

	// Unlike edit, we decided to discard inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Save changes
	const handleSubmit = () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Check if area is non-negative
		if (state.area < 0) {
			notifyUser(translate('area.invalid') + state.area + '.');
			inputOk = false;
		} else if (state.area > 0 && state.areaUnit == AreaUnitType.none) {
			// If the group has an assigned area, it must have a unit
			notifyUser(translate('area.but.no.unit'));
			inputOk = false;
		}

		// Check GPS entered.
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
			dispatch(submitNewGroup(submitState));
			resetState();
		} else {
			// Tell user that not going to update due to input issues.
			notifyUser(translate('group.input.error'));
		}
	};

	// Determine allowed child meters/groups for menu.
	useEffect(() => {
		// Can only vary if admin and only used then.
		if (loggedInAsAdmin) {
			// This is the current deep meters of this group including any changes.
			// The id is not really needed so set to -1 since same function for edit.
			const groupDeepMeter = metersInChangedGroup({ ...state, id: -1 });
			// Get meters that okay for this group in a format the component can display.
			const possibleMeters = getMeterMenuOptionsForGroup(state.defaultGraphicUnit, groupDeepMeter);
			// Get groups okay for this group. Similar to meters.
			// Since creating a group, the group cannot yet exist in the Redux state. Thus, the id is not used
			// in this case so set to -1 so it never matches in this function.
			const possibleGroups = getGroupMenuOptionsForGroup(-1, state.defaultGraphicUnit, groupDeepMeter);
			// Update the state
			setGroupChildrenState({
				...groupChildrenState,
				meterSelectOptions: possibleMeters,
				groupSelectOptions: possibleGroups
			});
		}
		// pik is needed since the compatible units is not correct until pik is available.
		// metersState normally does not change but can so include.
		// groupState can change if another group is created/edited and this can change ones displayed in menus.
	}, [ConversionArray.pikAvailable(), metersState, groupsState, state.defaultGraphicUnit, state.deepMeters]);

	// Update compatible default graphic units set.
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
		// metersState normally does not change but can so include.
		// pik is needed since the compatible units is not correct until pik is available.
	}, [ConversionArray.pikAvailable(), metersState, state.deepMeters]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateGroupView: 'help.admin.groupcreate'
	};

	return (
		<>
			{/* Show modal button */}
			<Button variant="secondary" onClick={handleShow}>
				<FormattedMessage id="create.group" />
			</Button>

			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="create.group" />
						<TooltipHelpContainer page='groups-create' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='groups-create' helpTextId={tooltipStyle.tooltipCreateGroupView} />
						</div>
					</Modal.Title>
				</Modal.Header>
				{/* when any of the group properties are changed call one of the functions. */}
				{loggedInAsAdmin && // only render when logged in as Admin
					<Modal.Body className="show-grid">
						<div id="container">
							<div id="modalChild">
								{/* Modal content */}
								<div className="container-fluid">
									<div style={tableStyle}>
										{/* Name input */}
										<div style={formInputStyle}>
											<label>{translate('group.name')} <label style={requiredStyle}>*</label></label>
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												required value={state.name} />
										</div>
										{/* default graphic unit input */}
										< div style={formInputStyle}>
											<label><FormattedMessage id="group.defaultGraphicUnit" /></label>
											<Input
												name='defaultGraphicUnit'
												type='select'
												value={state.defaultGraphicUnit}
												onChange={e => handleNumberChange(e)}>
												{/* First list the selectable ones and then the rest as disabled. */}
												{Array.from(graphicUnitsState.compatibleGraphicUnits).map(unit => {
													return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
												})}
												{Array.from(graphicUnitsState.incompatibleGraphicUnits).map(unit => {
													return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
												})}
											</Input>
										</div>
										{/* Displayable input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.displayable" /></label>
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
										{/* Area input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.area" /></label>
											<Input
												name="area"
												type="number"
												min="0"
												// cannot use defaultValue because it won't update when area is auto calculated
												value={state.area}
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* meter area unit input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.area.unit" /></label>
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
										{/* Calculate sum of meter areas */}
										<div style={formInputStyle}>
											<Button variant="secondary" onClick={handleAutoCalculateArea}>
												<FormattedMessage id="group.area.calculate" />
											</Button>
											<TooltipMarkerComponent page='groups-edit' helpTextId='help.groups.area.calculate' />
										</div>
										{/* GPS input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.gps" /></label>
											<Input
												name='gps'
												type='text'
												onChange={e => handleStringChange(e)}
												value={getGPSString(state.gps)} />
										</div>
										{/* Note input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.note" /></label>
											<Input
												name='note'
												type='textarea'
												onChange={e => handleStringChange(e)}
												value={state.note} />
										</div>
										{/* The child meters in this group */}
										{
											<div style={formInputStyle}>
												<b><FormattedMessage id='child.meters' /></b>:
												<MultiSelectComponent
													options={groupChildrenState.meterSelectOptions}
													selectedOptions={metersToSelectOptions()}
													placeholder={translate('select.meters')}
													onValuesChange={(newSelectedMeterOptions: SelectOption[]) => {
														// The meters changed so update the current list of deep meters
														// Get the currently included/selected meters as an array of the ids.
														const updatedChildMeters = newSelectedMeterOptions.map(meter => { return meter.value; });
														// The id is not really needed so set to -1 since same function for edit.
														const newDeepMeters = metersInChangedGroup({ ...state, childMeters: updatedChildMeters, id: -1 });
														// The choice may have invalidated the default graphic unit so it needs
														// to be reset to no unit.
														// The selection encodes this information in the color but recalculate
														// to see if this is the case.
														// Get the units compatible with the new set of deep meters in group.
														const newAllowedDGU = unitsCompatibleWithMeters(new Set(newDeepMeters));
														// Add no unit (-99) since that is okay so no change needed if current default graphic unit.
														newAllowedDGU.add(-99);
														let dgu = state.defaultGraphicUnit;
														if (!newAllowedDGU.has(dgu)) {
															// The current default graphic unit is not compatible so set to no unit and warn admin.
															notifyUser(`${translate('group.create.nounit')} "${unitsState[dgu].identifier}"`);
															dgu = -99;
														}
														// Update the deep meter, child meter & default graphic unit state based on the changes.
														// Note could update child meters above to avoid updating state value for metersInChangedGroup but want
														// to avoid too many state updates.
														// It is possible the default graphic unit is unchanged but just do this.
														setState({ ...state, deepMeters: newDeepMeters, childMeters: updatedChildMeters, defaultGraphicUnit: dgu });
													}}
												/>
											</div>
										}
										{/* The child groups in this group */}
										{<div style={formInputStyle}>
											<b><FormattedMessage id='child.groups' /></b>:
											<MultiSelectComponent
												options={groupChildrenState.groupSelectOptions}
												selectedOptions={groupsToSelectOptions()}
												placeholder={translate('select.groups')}
												onValuesChange={(newSelectedGroupOptions: SelectOption[]) => {
													// The groups changed so update the current list of deep meters
													// Get the currently included/selected meters as an array of the ids.
													const updatedChildGroups = newSelectedGroupOptions.map(group => { return group.value; });
													// The id is not really needed so set to -1 since same function for edit.
													const newDeepMeters = metersInChangedGroup({ ...state, childGroups: updatedChildGroups, id: -1 });
													// The choice may have invalidated the default graphic unit so it needs
													// to be reset to no unit.
													// The selection encodes this information in the color but recalculate
													// to see if this is the case.
													// Get the units compatible with the new set of deep meters in group.
													const newAllowedDGU = unitsCompatibleWithMeters(new Set(newDeepMeters));
													// Add no unit (-99) since that is okay so no change needed if current default graphic unit.
													newAllowedDGU.add(-99);
													let dgu = state.defaultGraphicUnit;
													if (!newAllowedDGU.has(dgu)) {
														// The current default graphic unit is not compatible so set to no unit and warn admin.
														notifyUser(`${translate('group.create.nounit')} "${unitsState[dgu].identifier}"`);
														dgu = -99;
													}
													// Update the deep meter, child meter & default graphic unit state based on the changes.
													// Note could update child groups above to avoid updating state value for metersInChangedGroup but want
													// to avoid too many state updates.
													// It is possible the default graphic unit is unchanged but just do this.
													setState({ ...state, deepMeters: newDeepMeters, childGroups: updatedChildGroups, defaultGraphicUnit: dgu });
												}}
											/>
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

	/**
	 * Converts the child meters of this group to options for menu sorted by identifier
	 * @returns sorted SelectOption for child meters of group creating.
	 */
	function metersToSelectOptions(): SelectOption[] {
		// In format for the display component for menu.
		const selectedMetersUnsorted: SelectOption[] = [];
		state.childMeters.forEach(groupId => {
			selectedMetersUnsorted.push({
				value: groupId,
				label: metersState[groupId].identifier
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order.
		return _.sortBy(selectedMetersUnsorted, item => item.label.toLowerCase(), 'asc');
	}

	/**
	 * Converts the child groups of this group to options for menu sorted by name
	 * @returns sorted SelectOption for child groups of group editing.
	 */
	function groupsToSelectOptions(): SelectOption[] {
		// In format for the display component for menu.
		const selectedGroupsUnsorted: SelectOption[] = [];
		state.childGroups.forEach(groupId => {
			selectedGroupsUnsorted.push({
				value: groupId,
				label: groupsState[groupId].name
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order.
		return _.sortBy(selectedGroupsUnsorted, item => item.label.toLowerCase(), 'asc');
	}

	/**
	 * Converts the deep meters of this group to list options sorted by identifier.
	 * @returns names of all child meters in sorted order.
	 */
	function deepMetersToList() {
		// Create list of meter identifiers.
		const listedDeepMeters: string[] = [];
		state.deepMeters.forEach(meterId => {
			listedDeepMeters.push(metersState[meterId].identifier);
		});
		// Sort for display.
		return listedDeepMeters.sort();
	}
}

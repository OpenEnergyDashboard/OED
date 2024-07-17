/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { sortBy } from 'lodash';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button, Col, Container, FormFeedback, FormGroup, Input, InputGroup,
	Label, Modal, ModalBody, ModalFooter, ModalHeader, Row
} from 'reactstrap';
import { GroupData } from 'types/redux/groups';
import { groupsApi, selectGroupDataById } from '../../redux/api/groupsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectPossibleGraphicUnits } from '../../redux/selectors/adminSelectors';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { SelectOption, TrueFalseType } from '../../types/items';
import { UnitData } from '../../types/redux/units';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import {
	getGroupMenuOptionsForGroup,
	getMeterMenuOptionsForGroup,
	metersInChangedGroup,
	unitsCompatibleWithMeters
} from '../../utils/determineCompatibleUnits';
import { AreaUnitType, getAreaUnitConversion } from '../../utils/getAreaUnitConversion';
import { getGPSString } from '../../utils/input';
import { showErrorNotification, showWarnNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import ListDisplayComponent from '../ListDisplayComponent';
import MultiSelectComponent from '../MultiSelectComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

/**
 * Defines the create group modal form
 * @returns Group create element
 */
export default function CreateGroupModalComponent() {
	const [createGroup] = groupsApi.useCreateGroupMutation();

	// Meters state
	const metersDataById = useAppSelector(selectMeterDataById);
	// Groups state
	const groupDataById = useAppSelector(selectGroupDataById);
	// Units state
	const unitsDataById = useAppSelector(selectUnitDataById);
	// Which units are possible for graphing state
	const possibleGraphicUnits = useAppSelector(selectPossibleGraphicUnits);

	// Since creating group the initial values are effectively nothing or the desired defaults.
	const defaultValues: GroupData = {
		// ID not needed, assigned by DB, add here for TS
		id: -1,
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
	};

	// The information on the children of this group for state. Except for selected, the
	// values are set by the useEffect functions.
	const groupChildrenDefaults = {
		// The meter selections in format for selection dropdown and initially empty.
		meterSelectOptions: [] as SelectOption[],
		// The group selections in format for selection dropdown and initially empty.
		groupSelectOptions: [] as SelectOption[]
	};

	// Information on the default graphic unit values.
	const graphicUnitsStateDefaults = {
		possibleGraphicUnits: possibleGraphicUnits,
		compatibleGraphicUnits: possibleGraphicUnits,
		incompatibleGraphicUnits: new Set<UnitData>()
	};

	/* State */
	// State for the created group.
	const [state, setState] = useState(defaultValues);

	// Handlers for each type of input change

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: Number(e.target.value) });
	};

	// Unlike EditGroupsModalComponent, we don't pass show and close via props.
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// Dropdowns state
	const [groupChildrenState, setGroupChildrenState] = useState(groupChildrenDefaults);
	const [graphicUnitsState, setGraphicUnitsState] = useState(graphicUnitsStateDefaults);

	/* Create Group Validation:
		Name cannot be blank
		Area must be positive or zero
		If area is nonzero, area unit must be set
		Group must have at least one child (i.e has deep child meters)
	*/
	const [validGroup, setValidGroup] = useState(false);
	useEffect(() => {
		setValidGroup(
			state.name !== '' &&
			(state.area === 0 || (state.area > 0 && state.areaUnit !== AreaUnitType.none)) &&
			(state.deepMeters.length > 0)
		);
	}, [state.area, state.areaUnit, state.name, state.deepMeters]);
	/* End State */

	// Sums the area of the group's deep meters. It will tell the admin if any meters are omitted from the calculation,
	// or if any other errors are encountered.
	const handleAutoCalculateArea = () => {
		if (state.deepMeters.length > 0) {
			if (state.areaUnit != AreaUnitType.none) {
				let areaSum = 0;
				let notifyMsg = '';
				state.deepMeters.forEach(meterID => {
					const meter = metersDataById[meterID];
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
				let msg = translate('group.area.calculate.header') + areaSum + ' ' + translate(`AreaUnitType.${state.areaUnit}`);
				if (notifyMsg != '') {
					msg += '\n' + translate('group.area.calculate.error.header') + notifyMsg;
				}
				if (window.confirm(msg)) {
					// the + here converts back into a number
					setState({ ...state, ['area']: + areaSum.toPrecision(6) });
				}
			} else {
				showErrorNotification(translate('group.area.calculate.error.group.unit'));
			}
		} else {
			showErrorNotification(translate('group.area.calculate.error.no.meters'));
		}
	};

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => { setShowModal(true); };

	// Reset the state to default value so each time starts from scratch.
	const resetState = () => {
		setState(defaultValues);
		setGroupChildrenState(groupChildrenDefaults);
		setGraphicUnitsState(graphicUnitsStateDefaults);
	};

	// Unlike edit, we decided to discard inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Save changes
	const handleSubmit = () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

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
				// showErrorNotification(translate('input.gps.range') + state.gps + '.');
				inputOk = false;
			}
		}

		if (inputOk) {
			// The input passed validation.
			// GPS may have been updated so create updated state to submit.
			const submitState = { ...state, gps: gps };
			createGroup(submitState);
			resetState();
		} else {
			// Tell user that not going to update due to input issues.
			showErrorNotification(translate('group.input.error'));
		}
	};

	// Determine allowed child meters/groups for menu.
	useEffect(() => {
		// Can only vary if admin and only used then.
		// This is the current deep meters of this group including any changes.
		// The id is not really needed so set to -1 since same function for edit.
		const groupDeepMeter = metersInChangedGroup(state);
		// Get meters that okay for this group in a format the component can display.
		const possibleMeters = getMeterMenuOptionsForGroup(state.defaultGraphicUnit, groupDeepMeter);
		// Get groups okay for this group. Similar to meters.
		// Since creating a group, the group cannot yet exist in the Redux state. Thus, the id is not used
		// in this case so set to -1 so it never matches in this function.
		const possibleGroups = getGroupMenuOptionsForGroup(-1, state.defaultGraphicUnit, groupDeepMeter);
		// Update the state
		setGroupChildrenState(groupChildrenState => ({
			...groupChildrenState,
			meterSelectOptions: possibleMeters,
			groupSelectOptions: possibleGroups
		}));
		// meters and groups changes will update page due to useAppSelector above.
	}, [state]);

	// Update compatible default graphic units set.
	useEffect(() => {
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
		setGraphicUnitsState(graphicUnitsState => ({
			...graphicUnitsState,
			compatibleGraphicUnits: compatibleGraphicUnits,
			incompatibleGraphicUnits: incompatibleGraphicUnits
		}));
		// If any of these change then it needs to be updated.
		// metersState normally does not change but can so include.
		// pik is needed since the compatible units is not correct until pik is available.
	}, [graphicUnitsState.possibleGraphicUnits, state.deepMeters]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateGroupView: 'help.admin.groupcreate'
	};

	return (
		<>
			{/* Show modal button */}
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage id="create.group" />
			</Button>
			<Modal isOpen={showModal} toggle={handleClose} size='lg' >
				<ModalHeader>
					<FormattedMessage id="create.group" />
					<TooltipHelpComponent page='groups-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='groups-create' helpTextId={tooltipStyle.tooltipCreateGroupView} />
					</div>
				</ModalHeader>
				{/* when any of the group properties are changed call one of the functions. */}
				<ModalBody><Container>
					<Row xs='1' lg='2'>
						{/* Name input */}
						<Col><FormGroup>
							<Label for='name'>{translate('name')}</Label>
							<Input
								id='name'
								name='name'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								required value={state.name}
								invalid={state.name === ''} />
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup></Col>
						{/* default graphic unit input */}
						<Col><FormGroup>
							<Label for='defaultGraphicUnit'>{translate('defaultGraphicUnit')}</Label>
							<Input
								id='defaultGraphicUnit'
								name='defaultGraphicUnit'
								type='select'
								value={state.defaultGraphicUnit}
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
					</Row><Row xs='1' lg='2'>
						{/* Displayable input */}
						<Col><FormGroup>
							<Label for='displayable'>{translate('displayable')}</Label>
							<Input
								id='displayable'
								name='displayable'
								type='select'
								value={state.displayable.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
						</FormGroup></Col>
						{/* GPS input */}
						<Col><FormGroup>
							<Label for='gps'>{translate('gps')}</Label>
							<Input
								id='gps'
								name='gps'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={getGPSString(state.gps)} />
						</FormGroup></Col>
					</Row><Row xs='1' lg='2'>
						{/* Area input */}
						<Col><FormGroup>
							<Label for='area'>{translate('area')}</Label>
							<InputGroup>
								<Input
									id='area'
									name='area'
									type='number'
									min='0'
									// cannot use defaultValue because it won't update when area is auto calculated
									// this makes the validation redundant but still a good idea
									value={state.area}
									onChange={e => handleNumberChange(e)}
									invalid={state.area < 0} />
								{/* Calculate sum of meter areas */}
								<Button color='secondary' onClick={handleAutoCalculateArea}>
									<FormattedMessage id="group.area.calculate" />
								</Button>
								<TooltipMarkerComponent page='groups-create' helpTextId='help.groups.area.calculate' />
								<FormFeedback>
									<FormattedMessage id="error.negative" />
								</FormFeedback>
							</InputGroup>
						</FormGroup></Col>
						{/* meter area unit input */}
						<Col><FormGroup>
							<Label for='areaUnit'>{translate('area.unit')}</Label>
							<Input
								id='areaUnit'
								name='areaUnit'
								type='select'
								value={state.areaUnit}
								onChange={e => handleStringChange(e)}
								invalid={state.area > 0 && state.areaUnit === AreaUnitType.none}>
								{Object.keys(AreaUnitType).map(key => {
									return (<option value={key} key={key}>{translate(`AreaUnitType.${key}`)}</option>);
								})}
							</Input>
							<FormFeedback>
								<FormattedMessage id="area.but.no.unit" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					{/* Note input */}
					<FormGroup>
						<Label for='note'>{translate('note')} </Label>
						<Input
							id='note'
							name='note'
							type='textarea'
							onChange={e => handleStringChange(e)}
							value={state.note} />
					</FormGroup>
					{/* The child meters in this group */}
					{
						<FormGroup>
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
										showWarnNotification(`${translate('group.create.nounit')} "${unitsDataById[dgu].identifier}"`);
										dgu = -99;
									}
									// Update the deep meter, child meter & default graphic unit state based on the changes.
									// Note could update child meters above to avoid updating state value for metersInChangedGroup but want
									// to avoid too many state updates.
									// It is possible the default graphic unit is unchanged but just do this.
									setState({ ...state, deepMeters: newDeepMeters, childMeters: updatedChildMeters, defaultGraphicUnit: dgu });
								}}
							/>
						</FormGroup>
					}
					{/* The child groups in this group */}
					{<FormGroup>
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
									showWarnNotification(`${translate('group.create.nounit')} "${unitsDataById[dgu].identifier}"`);
									dgu = -99;
								}
								// Update the deep meter, child meter & default graphic unit state based on the changes.
								// Note could update child groups above to avoid updating state value for metersInChangedGroup but want
								// to avoid too many state updates.
								// It is possible the default graphic unit is unchanged but just do this.
								setState({ ...state, deepMeters: newDeepMeters, childGroups: updatedChildGroups, defaultGraphicUnit: dgu });
							}}
						/>
					</FormGroup>
					}
					{/* All (deep) meters in this group */}
					<FormGroup>
						<b><FormattedMessage id='group.all.meters' /></b>:
						<ListDisplayComponent items={deepMetersToList()} />
					</FormGroup>
				</Container></ModalBody>
				<ModalFooter>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} disabled={!validGroup}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);

	/**
	 * Converts the child meters of this group to options for menu sorted by identifier
	 * @returns SelectOptions sorted for child meters of group creating.
	 */
	function metersToSelectOptions(): SelectOption[] {
		// In format for the display component for menu.
		const selectedMetersUnsorted: SelectOption[] = [];
		state.childMeters.forEach(groupId => {
			selectedMetersUnsorted.push({
				value: groupId,
				label: metersDataById[groupId].identifier
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order.
		return sortBy(selectedMetersUnsorted, item => item.label.toLowerCase(), 'asc');
	}

	/**
	 * Converts the child groups of this group to options for menu sorted by name
	 * @returns SelectOptions sorted for child groups of group editing.
	 */
	function groupsToSelectOptions(): SelectOption[] {
		// In format for the display component for menu.
		const selectedGroupsUnsorted: SelectOption[] = [];
		state.childGroups.forEach(groupId => {
			selectedGroupsUnsorted.push({
				value: groupId,
				label: groupDataById[groupId].name
				// isDisabled not needed since only used for selected and not display.
			} as SelectOption
			);
		});
		// Want chosen in sorted order.
		return sortBy(selectedGroupsUnsorted, item => item.label.toLowerCase(), 'asc');
	}

	/**
	 * Converts the deep meters of this group to list options sorted by identifier.
	 * @returns names of all child meters in sorted order.
	 */
	function deepMetersToList() {
		// Create list of meter identifiers.
		const listedDeepMeters: string[] = [];
		state.deepMeters.forEach(meterId => {
			listedDeepMeters.push(metersDataById[meterId].identifier);
		});
		// Sort for display.
		return listedDeepMeters.sort();
	}
}

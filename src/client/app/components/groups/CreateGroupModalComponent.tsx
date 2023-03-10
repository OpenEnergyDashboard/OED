/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
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

interface CreateGroupModalComponentProps {
	possibleGraphicUnits: Set<UnitData>;
}

export default function CreateGroupModalComponent(props: CreateGroupModalComponentProps) {
	const dispatch = useDispatch();

	// Meter state
	const metersState = useSelector((state: State) => state.meters.byMeterID);

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
		defaultGraphicUnit: -99
	}

	// The information on the children of this group for state. Except for selected, the
	// values are set by the useEffect functions.
	const groupChildrenDefaults = {
		// The meter selections in format for selection dropdown and initially empty.
		meterSelectOptions: [] as SelectOption[],
		// Meters that have been selected for this group and initially empty.
		meterSelectedSelectOptions: [] as SelectOption[],
		// The group selections in format for selection dropdown and initially empty.
		groupSelectOptions: [] as SelectOption[],
		// Groups that have been selected for this group and intiially empty.
		groupSelectedSelectOptions: [] as SelectOption[],
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

	// Unlike EditGroupsModalComponent, we don't pass show and close via props.
	// Modal show
	const [showModal, setShowModal] = useState(false);

	const [groupChildrenState, setGroupChildrenState] = useState(groupChildrenDefaults)

	// Dropdowns
	const [graphicUnitsState, setGraphicUnitsState] = useState(graphicUnitsStateDefaults);
	/* End State */

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => setShowModal(true);

	// Reset the state to default values
	const resetState = () => {
		setState(defaultValues);
	}

	// Unlike edit, we decided to discard inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Save changes
	const handleSubmit = () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Check area is positive.
		// TODO For now allow zero so works with default value and DB. We should probably
		// make this better default than 0 (DB set to not null now).
		// if (state.area <= 0) {
		if (state.area < 0) {
			notifyUser(translate('area.invalid') + state.area + '.');
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
			// Submit new group if checks where ok.
			// GPS may have been updated so create updated state to submit.
			const submitState = { ...state, gps: gps };
			dispatch(submitNewGroup(submitState));
			resetState();
		} else {
			// Tell user that not going to update due to input issues.
			notifyUser(translate('group.input.error'));
		}
	};

	// Determine child meters/groups and deep meters.
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

			// Information to display all (deep) children meters.
			// Holds the names of all (deep) meter children of this group when visible to this user.
			const identifierDeepMeters: string[] = [];
			// Because deepMeters is optional in state, TS is worried it may not exist. It should always be set
			// at this point but if stops the error.
			if (state.deepMeters) {
				state.deepMeters.forEach((meterID: number) => {
					// Make sure meter state exists. Also, the identifier is missing if not visible (non-admin).
					if (metersState[meterID] !== undefined && metersState[meterID].identifier !== null) {
						identifierDeepMeters.push(metersState[meterID].identifier.trim());
					}
				});
				// We want to display in alphabetical order.
				identifierDeepMeters.sort();
			}
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
		tooltipCreateGroupView: 'help.admin.groupcreate'
	};

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}

	const tableStyle: React.CSSProperties = {
		width: '100%'
	};

	return (
		<>
			{/* Show modal button */}
			<Button variant="Secondary" onClick={handleShow}>
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
											<label><FormattedMessage id="group.name" /></label><br />
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.name} />
										</div>
										{/* default graphic unit input */}
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
										{/* Displayable input */}
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
										{/* Area input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.area" /></label><br />
											<Input
												name="area"
												type="number"
												step="0.01"
												min="0"
												value={state.area}
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* GPS input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.gps" /></label><br />
											<Input
												name='gps'
												type='text'
												onChange={e => handleStringChange(e)}
												value={getGPSString(state.gps)} />
										</div>
										{/* Note input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="group.note" /></label><br />
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
													selectedOptions={groupChildrenState.meterSelectedSelectOptions}
													placeholder={translate('select.meters')}
													onValuesChange={(newSelectedMeterOptions: SelectOption[]) => {
														// The meters changed so update the current list of deep meters
														// Get the currently included/selected meters as an array of the ids.
														const updatedChildMeters = newSelectedMeterOptions.map(meter => { return meter.value; });
														// The id is not really needed so set to -1 since same function for edit.
														const newDeepMeters = metersInChangedGroup({ ...state, childMeters: updatedChildMeters, id: -1 });
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
										}
										{/* The child groups in this group */}
										{<div style={formInputStyle}>
											<b><FormattedMessage id='child.groups' /></b>:
											<MultiSelectComponent
												options={groupChildrenState.groupSelectOptions}
												selectedOptions={groupChildrenState.groupSelectedSelectOptions}
												placeholder={translate('select.groups')}
												onValuesChange={(newSelectedGroupOptions: SelectOption[]) => {
													// The groups changed so update the current list of deep meters
													// Get the currently included/selected meters as an array of the ids.
													const updatedChildGroups = newSelectedGroupOptions.map(group => { return group.value; });
													// The id is not really needed so set to -1 since same function for edit.
													const newDeepMeters = metersInChangedGroup({ ...state, childGroups: updatedChildGroups, id: -1 });
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
										}
										{/* All (deep) meters in this group */}
										<div>
											<b><FormattedMessage id='group.all.meters' /></b>:
											<ListDisplayComponent items={groupChildrenState.deepMetersIdentifier} />
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

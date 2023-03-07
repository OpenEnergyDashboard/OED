/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { State } from 'types/redux/state';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import '../../styles/modal.css';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { TrueFalseType } from '../../types/items';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { submitNewGroup } from '../../actions/groups';
import { notifyUser } from '../../utils/input'

export default function CreateGroupModalComponent() {
	const dispatch = useDispatch();

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	const defaultValues = {
		name: '',
		displayable: false,
		gps: '',
		note: '',
		area: 0,
		// TODO need to get correct once have correct menus to choose
		// childMeters: [],
		// childGroups: [],
		childMeters: [1],
		childGroups: [1],
		// TODO defaultGraphicUnit: -999,
		defaultGraphicUnit: 1,
		id: -99
	}

	/* State */
	// Unlike EditGroupsModalComponent, there are no props so we don't pass show and close via props.
	// Modal show
	const [showModal, setShowModal] = useState(false);

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => setShowModal(true);

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
	/* End State */

	// Reset the state to default values
	const resetState = () => {
		setState(defaultValues);
	}

	// Unlike edit, we decided to discard inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Submit
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

		// TODO is -99 okay - do we need to fix
		// A group default graphic unit must be selected.
		if (state.defaultGraphicUnit === -999) {
			notifyUser(translate('group.graphic.invalid'));
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
				notifyUser(translate('input.gps.range') + state.gps + '.');
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
										{/* TODO <div style={formInputStyle}>
											<label><FormattedMessage id="group.defaultGraphicUnit" /></label><br />
											<Input
												name='defaultGraphicUnit'
												type='select'
												value={state.defaultGraphicUnit}
												onChange={e => handleNumberChange(e)}>
												{<option
													value={-999}
													key={-999}
													hidden={state.defaultGraphicUnit !== -999}
													disabled>
													{translate('select.unit')}
												</option>}
												{Array.from(dropdownsState.compatibleGraphicUnits).map(unit => {
													return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
												})}
												{Array.from(dropdownsState.incompatibleGraphicUnits).map(unit => {
													return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
												})}
											</Input>
										</div> */}
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
												value={state.gps} />
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

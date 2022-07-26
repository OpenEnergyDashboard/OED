/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import '../../styles/Modal.unit.css';
import { UnitRepresentType, DisplayableType, UnitType } from '../../types/redux/units';
import { useDispatch } from 'react-redux';
import { addUnit } from '../../actions/units';
import { useState } from 'react';
import { TrueFalseType } from '../../types/items';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';

export default function CreateUnitModalComponent() {
	const dispatch = useDispatch();

	const defaultValues = {
		name: '',
		identifier: '',
		typeOfUnit: UnitType.unit,
		unitRepresent: UnitRepresentType.quantity,
		displayable: DisplayableType.all,
		preferredDisplay: true,
		secInRate: 3600,
		suffix: '',
		note: '',
		// These two values are necessary but are not used.
		// The client code makes the id for the selected unit and default graphic unit be -99
		// so it can tell it is not yet assigned and do the correct logic for that case.
		// The units API expects these values to be undefined on call so that the database can assign their values.
		id: -99,
		unitIndex: -99
	}

	/* State */
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
		// Set default identifier as name if left blank
		state.identifier = (!state.identifier || state.identifier.length === 0) ? state.name : state.identifier;
		// Add the new unit and update the store
		dispatch(addUnit(state));
		resetState();
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '60%',
		tooltipCreateUnitView: 'help.admin.unitcreate'
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
				<FormattedMessage id="create.unit" />
			</Button>

			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="create.unit" />
						<TooltipHelpContainer page='units' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='units' helpTextId={tooltipStyle.tooltipCreateUnitView} />
						</div>
					</Modal.Title>
				</Modal.Header>
				{/* when any of the unit properties are changed call one of the functions. */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div style={tableStyle}>
									{/* Identifier input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.identifier" /></label><br />
										<Input
											name='identifier'
											type='text'
											onChange={e => handleStringChange(e)}
											value={state.identifier} />
									</div>
									{/* Name input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.name" /></label><br />
										<Input
											name='name'
											type='text'
											onChange={e => handleStringChange(e)}
											value={state.name} />
									</div>
									{/* Type of unit input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.type.of.unit" /></label><br />
										<Input
											name='typeOfUnit'
											type='select'
											onChange={e => handleStringChange(e)}
											value={state.typeOfUnit}>
											{Object.keys(UnitType).map(key => {
												return (<option value={key} key={key}>{translate(`UnitType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Unit represent input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.represent" /></label><br />
										<Input
											name='unitRepresent'
											type='select'
											onChange={e => handleStringChange(e)}
											value={state.unitRepresent}>
											{Object.keys(UnitRepresentType).map(key => {
												return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Displayable type input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.dropdown.displayable" /></label><br />
										<Input
											name='displayable'
											type='select'
											onChange={e => handleStringChange(e)}
											value={state.displayable} >
											{Object.keys(DisplayableType).map(key => {
												return (<option value={key} key={key}>{translate(`DisplayableType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Preferred display input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.preferred.display" /></label><br />
										<Input
											name='preferredDisplay'
											type='select'
											onChange={e => handleBooleanChange(e)}>
											{Object.keys(TrueFalseType).map(key => {
												return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Seconds in rate input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.sec.in.rate" /></label><br />
										<Input
											name='secInRate'
											type='number'
											onChange={e => handleNumberChange(e)}
											value={state.secInRate}
											// TODO validate negative input by typing for rate but database stops it.
											// This stops negative input by use of arrows to change value.
											min="1" />
									</div>
									{/* Suffix input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.suffix" /></label><br />
										<Input
											name='suffix'
											type='text'
											onChange={e => handleStringChange(e)}
											value={state.suffix} />
									</div>
									{/* Note input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.note.optional" /></label><br />
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
				</Modal.Body>
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

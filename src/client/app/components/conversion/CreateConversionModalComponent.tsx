/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import '../../styles/Modal.conversion.css';
import { TrueFalseType } from '../../types/items';
import { useDispatch } from 'react-redux';
import { addConversion } from '../../actions/conversions';
import { useState } from 'react';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { UnitDataById } from 'types/redux/units';

interface CreateConversionModalComponentProps {
	unitsState: UnitDataById;
}

export default function CreateConversionModalComponent(props: CreateConversionModalComponentProps) {

	const dispatch = useDispatch();

	const defaultValues = {
		// Gets first unit ID from all units in the unit state. The first index of units in unit state = 1, not 0.
		// The first unit in the unit state will be the default value in the dropdown menu for sourceId and destinationId.
		// Since not changing the value doesn't call event handler, we must set the default ID values to this first unit
		// in order to ensure that we are not setting invalid or incorrect unit IDs for source and destination.
		sourceId: props.unitsState[1].id,       // Set default to ID of first unit in state.
		destinationId: props.unitsState[1].id,  // Set default to ID of first unit in state.
		bidirectional: false,
		slope: 0,
		intercept: 0,
		note: ''
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

	// Unlike edit, we decided to discard and inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Submit
	const handleSubmit = () => {

		// Close modal first to avoid repeat clicks
		setShowModal(false);

		dispatch(addConversion(state));

		resetState();
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '60%',
		// For now, it uses the same help text from conversion view page.
		tooltipCreateConversionView: 'help.admin.conversionview'
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
				<FormattedMessage id="create.conversion" />
			</Button>

			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="create.conversion" />
						<TooltipHelpContainer page='conversions' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='conversions' helpTextId={tooltipStyle.tooltipCreateConversionView} />
						</div>
					</Modal.Title>
				</Modal.Header>
				{/* when any of the conversion are changed call one of the functions. */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div style={tableStyle}>
									{/* SourceId input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="conversion.sourceId" /></label><br />
										<Input
											name='sourceId'
											type='select'
											onChange={e => handleNumberChange(e)}>
											{Object.values(props.unitsState).map(unitData => {
												return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>)
											})}
										</Input>
									</div>
									{/* DestinationId input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="conversion.destinationId" /></label><br />
										<Input
											name='destinationId'
											type='select'
											onChange={e => handleNumberChange(e)}>
											{Object.values(props.unitsState).map(unitData => {
												return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>)
											})}
										</Input>
									</div>
									{/* Bidirectional Y/N input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="conversion.bidirectional" /></label><br />
										<Input
											name='bidirectional'
											type='select'
											onChange={e => handleBooleanChange(e)}>
											{Object.keys(TrueFalseType).map(key => {
												return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Slope input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="conversion.slope" /></label><br />
										<Input
											name='slope'
											type='number'
											onChange={e => handleNumberChange(e)}
											required value={state.slope} />
									</div>
									{/* Intercept input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="conversion.intercept" /></label><br />
										<Input
											name='intercept'
											type='number'
											onChange={e => handleNumberChange(e)}
											required value={state.intercept} />
									</div>
									{/* Note input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="conversion.note.optional" /></label><br />
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
					<Button variant="primary" onClick={handleSubmit} disabled={!state.sourceId || !state.destinationId || state.sourceId === state.destinationId}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

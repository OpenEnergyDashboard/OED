/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { ConversionData } from '../../types/redux/conversions';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import { useDispatch } from 'react-redux';
import { submitEditedConversion } from '../../actions/conversions';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
// I realize that * is already imported from react
import { useState } from 'react';
import '../../styles/Modal.conversion.css';
import { TrueFalseType } from '../../types/items';
import { UnitDataById } from 'types/redux/units';

interface EditConversionModalComponentProps {
	show: boolean;
	conversion: ConversionData;
	unitsState: UnitDataById;
	// passed in to handle closing the modal
	handleClose: () => void;
}

// Updated to hooks
export default function EditConversionModalComponent(props: EditConversionModalComponentProps) {

	const dispatch = useDispatch();

	// Set existing conversion values
	const values = {
		sourceId: props.conversion.sourceId,
		destinationId: props.conversion.destinationId,
		bidirectional: props.conversion.bidirectional,
		slope: props.conversion.slope,
		intercept: props.conversion.intercept,
		note: props.conversion.note
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
	/* End State */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateConversionModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit conversions will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
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
	// Side note, we could probably just set a boolean when any input i
	const handleSaveChanges = () => {

		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// Check for changes by comparing state to props
		const conversionHasChanges =
			(
				props.conversion.sourceId != state.sourceId ||
				props.conversion.destinationId != state.destinationId ||
				props.conversion.bidirectional != state.bidirectional ||
				props.conversion.slope != state.slope ||
				props.conversion.intercept != state.intercept ||
				props.conversion.note != state.note);
		// Only do work if there are changes
		if (conversionHasChanges) {
			// Save our changes by dispatching the submitEditedConversion action
			dispatch(submitEditedConversion(state));
			dispatch(removeUnsavedChanges());
		}
	}

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '60%',
		// For now, it uses the same help text from conversion view page.
		tooltipEditConversionView: 'help.admin.conversionview'
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
					<Modal.Title> <FormattedMessage id="edit.conversion" />
						<TooltipHelpContainer page='conversions' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='conversions' helpTextId={tooltipStyle.tooltipEditConversionView} />
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
											onChange={e => handleStringChange(e)}>
											{Object.values(props.unitsState).map(unitData => {
												return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>)
											})}
										</Input>
										<div />
										{/* DestinationId input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="conversion.destinationId" /></label><br />
											<Input
												name='destinationId'
												type='select'
												onChange={e => handleStringChange(e)}>
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
												defaultValue={state.bidirectional.toString()}
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
												type="number"
												defaultValue={state.slope}
												onChange={e => handleNumberChange(e)}
												placeholder="Slope" />
										</div>
										{/* Intercept input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="conversion.intercept" /></label><br />
											<Input
												name="intercept"
												type="number"
												defaultValue={state.intercept}
												placeholder="Intercept"
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* Note input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="conversion.note" /></label><br />
											<Input
												name="note"
												type="textarea"
												defaultValue={state.note}
												placeholder="Note"
												onChange={e => handleStringChange(e)} />
										</div>
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
					<Button variant="primary" onClick={handleSaveChanges} disabled={!state.sourceId || !state.destinationId || state.sourceId === state.destinationId}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}
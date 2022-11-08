/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import '../../styles/modal.css';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import { submitEditedConversion, deleteConversion } from '../../actions/conversions';
import { TrueFalseType } from '../../types/items';
import { ConversionData } from '../../types/redux/conversions';
import { UnitDataById } from 'types/redux/units';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent'

interface EditConversionModalComponentProps {
	show: boolean;
	conversion: ConversionData;
	unitsState: UnitDataById;
	header: string;
	// passed in to handle opening the modal
	handleShow: () => void;
	// passed in to handle closing the modal
	handleClose: () => void;
}

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

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('conversion.delete.conversion') + ' [' + props.header + '] ?';
	const deleteConfirmText = translate('conversion.delete.conversion');
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
	const handleDeleteConversion = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);
		// Delete the conversion using the state object, it should only require the source and destination ids set
		dispatch(deleteConversion(state as ConversionData));
	}
	/* End Confirm Delete Modal */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateConversionModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit conversions will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setState(values);
	}

	const handleShow = () => {
		props.handleShow();
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

		// Need to redo Cik if slope, intercept, or bidirectional changes.
		const shouldRedoCik = props.conversion.slope !== state.slope
			|| props.conversion.intercept !== state.intercept
			|| props.conversion.bidirectional !== state.bidirectional;
		// Check for changes by comparing state to props
		const conversionHasChanges = shouldRedoCik || props.conversion.note != state.note;
		// Only do work if there are changes
		if (conversionHasChanges) {
			// Save our changes by dispatching the submitEditedConversion action
			dispatch(submitEditedConversion(state, shouldRedoCik));
			dispatch(removeUnsavedChanges());
		}
	}

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '60%',
		// For now, it uses the same help text from conversion view page.
		tooltipEditConversionView: 'help.admin.conversionedit'
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
				actionFunction={handleDeleteConversion}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText}/>
			<Modal show={props.show} onHide={props.handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="conversion.edit.conversion" />
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
									{/* Source unit - display only */}
									<div style={formInputStyle}>
										<label><FormattedMessage id="conversion.source" /></label><br />
										<Input
											name='sourceId'
											type='text'
											defaultValue={props.unitsState[state.sourceId].identifier}
											// Disable input to prevent changing ID value
											disabled>
										</Input>
										<div />
										{/* Destination unit - display only */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="conversion.destination" /></label><br />
											<Input
												name='destinationId'
												type='text'
												defaultValue={props.unitsState[state.destinationId].identifier}
												// Disable input to prevent changing ID value
												disabled>
											</Input>
										</div>
										{/* Bidirectional Y/N input */}
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
										{/* Slope input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="conversion.slope" /></label><br />
											<Input
												name='slope'
												type="number"
												defaultValue={state.slope}
												placeholder="Slope"
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* Intercept input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="conversion.intercept" /></label><br />
											<Input
												name="intercept"
												type="number"
												defaultValue={state.intercept}
												placeholder="Intercept"
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* Note input */}
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
					<Button variant="danger" onClick={handleDeleteConfirmationModalOpen}>
						<FormattedMessage id="conversion.delete.conversion" />
					</Button>
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
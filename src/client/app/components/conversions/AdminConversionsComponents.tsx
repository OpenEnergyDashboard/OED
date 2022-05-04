/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Conversion, ConversionBidirectional } from '../../types/items';
import { Button, Input } from 'reactstrap';
import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { FormattedMessage } from 'react-intl';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import { updateUnsavedChanges, removeUnsavedChanges } from '../../actions/unsavedWarning';
import store from '../../index'
import { Card, Row, Modal } from 'react-bootstrap'
import { useState } from 'react';

interface AdminConversionsComponentProps {
	conversions: Conversion[];
	deleteConversion: (source_id: number, destination_id: number) => Promise<void>;
	edited: boolean;
	editConversion: (source_id: number, newBidirectional: ConversionBidirectional, newSlope: number, newIntercept: number, newNote: string) => void;
	editBidirectional: (source_id: number, destinationId: number, newBidirectional: ConversionBidirectional) => void;
	editSlope: (source_id: number, destinationId: number, newSlope: number) => void;
	editIntercept: (source_id: number, destinationId: number, newIntercept: number) => void;
	editNote: (source_id: number, destinationId: number, newNote: string) => void;
	submitConversionEdits: () => Promise<void>;

	// sourceId:string, destinationId: string, bidirectional:ConversionBidirectional, slope:number, intercept:number, note:string
}

//source_id, dest_id, bidirection, slope, intercept, note

function AdminConversionsComponents(props: AdminConversionsComponentProps) {


	// const removeUnsavedChangesFunction = (callback: () => void) => {
	// 	// This function is called to reset all the inputs to the initial state
	// 	// Do not need to do anything since unsaved changes will be removed after leaving this page
	// 	callback();
	// }

	// const submitUnsavedChangesFunction = (successCallback: () => void, failureCallback: () => void) => {
	// 	// This function is called to submit the unsaved changes
	// 	props.submitConversionEdits().then(successCallback, failureCallback);
	// }


	// const addUnsavedChanges = () => {
	// 	// Notify that there are unsaved changes
	// 	store.dispatch(updateUnsavedChanges(removeUnsavedChangesFunction, submitUnsavedChangesFunction));
	// }

	// const clearUnsavedChanges = () => {
	// 	// Notify that there are no unsaved changes
	// 	store.dispatch(removeUnsavedChanges());
	// }



	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tableStyle: React.CSSProperties = {
		marginLeft: '10%',
		marginRight: '10%'
	};

	// const buttonsStyle: React.CSSProperties = {
	//     display: 'flex',
	//     justifyContent: 'space-between'
	// };

	const cardStyle: React.CSSProperties = {
		width: '20%',
		margin: '5px 5px 5px 5px',
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%'
	};

	return (
		<div>
			<UnsavedWarningContainer />
			<TooltipHelpContainerAlternative page='conversions' />
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='Conversions'/>
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='users' helpTextId='help.admin.conversions' />
					</div>
				</h2>
				<div style={tableStyle}>
					<Row xs={1} sm={3} md={4} lg={5} xl={5} className="g-4" style={{ justifyContent: 'center' }}>
						<Card style={cardStyle} className='align-items-center justify-content-center'>
							<Button style={{ backgroundColor: 'blue', margin: '0px 5px 5px 5px'}}>
                                Create New Conversion
							</Button>
						</Card>
						{props.conversions.map(conversion => (
							<Card style={cardStyle}>
								<Card.Title style={{ margin: '5px 0px 5px 0px'}}>
									<span style={{ padding: '0px 0px 5px 0px'}}>
                                        Source Id: {conversion.sourceId} <br/>
									</span>
									<span>
                                        Destination Id: {conversion.destinationId}
									</span>
								</Card.Title>
								<Card.Text>
                                    Bidirectional: {conversion.bidirectional}
								</Card.Text>
								<Card.Text>
                                    Slope: {conversion.slope}
								</Card.Text>
								<Card.Text>
                                    Intercept: {conversion.intercept}
								</Card.Text>
								<Card.Text>
                                    Note: {conversion.note}
								</Card.Text>
								{EditModalCard(conversion, props)}
								<Button style={{ backgroundColor: 'red', margin: '0px 5px 5px 5px' }} onClick={() => {

									props.deleteConversion(conversion.sourceId,conversion.destinationId);
								}}>
                                    Delete
								</Button>
							</Card>
						))}
					</Row>
				</div>
			</div>
		</div>
	)
}

function EditModalCard(conversion: Conversion, props: AdminConversionsComponentProps) {
	const [showModal, setShow] = useState(false);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);

	const removeUnsavedChangesFunction = (callback: () => void) => {
		// This function is called to reset all the inputs to the initial state
		// Do not need to do anything since unsaved changes will be removed after leaving this page
		callback();
	}

	const submitUnsavedChangesFunction = (successCallback: () => void, failureCallback: () => void) => {
		// This function is called to submit the unsaved changes
		props.submitConversionEdits().then(successCallback, failureCallback);
	}

	const addUnsavedChanges = () => {
		// Notify that there are unsaved changes
		store.dispatch(updateUnsavedChanges(removeUnsavedChangesFunction, submitUnsavedChangesFunction));
	}

	const clearUnsavedChanges = () => {
		// Notify that there are no unsaved changes
		store.dispatch(removeUnsavedChanges());
	}

	return (
		<>
			<Button onClick={handleShow} style={{ backgroundColor: 'blue', margin: '0px 5px 5px 5px'}}>
                Edit Conversion
			</Button>

			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header>
					<Modal.Title> Edit Conversion Information</Modal.Title>
				</Modal.Header>

				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							<div>
                                Source Id: {conversion.sourceId}
							</div>

							<div>
                                Destination Id: {conversion.destinationId}
							</div>

							<div>
                                Bidirectional:
								<span>
									<Input
										type='select'
										value={conversion.bidirectional}
										onChange={({ target }) => {
											props.editBidirectional(conversion.sourceId, conversion.destinationId, target.value as ConversionBidirectional);
											addUnsavedChanges();
										}}
									>
										{Object.entries(ConversionBidirectional).map(([bidirectional, val]) => (
											<option value={val} key={bidirectional}> {bidirectional} </option>
										))}
									</Input>
								</span>
							</div>

							<div>
                                Slope:
								<span>
									<Input
										type='number'
										value={conversion.slope}
										onChange={({ target }) => {
											props.editSlope(conversion.sourceId, conversion.destinationId, +target.value as number);
											addUnsavedChanges();
										}}
									>
									</Input>
								</span>
							</div>

							<div>
                                Intercept:
								<span>
									<Input
										type='number'
										value={conversion.intercept}
										onChange={({ target }) => {
											props.editIntercept(conversion.sourceId, conversion.destinationId, +target.value as number);
											addUnsavedChanges();
										}}
									>
									</Input>
								</span>
							</div>

							<div>
                                Note:
								<Input
									type='text'
									value={conversion.note}
									onChange={({ target }) => {
										props.editNote(conversion.sourceId, conversion.destinationId, target.value as string);
										addUnsavedChanges();
									}}
								>
								</Input>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleClose}>
                        Close
					</Button>
					<Button variant="primary" color="success" disabled={!props.edited}
						onClick={() => {
							props.submitConversionEdits(
								// conversion.sourceId,
								// conversion.destinationId,
								// conversion.bidirectional,
								// conversion.slope,
								// conversion.intercept,
								// conversion.note
							);
							props.submitConversionEdits();
							clearUnsavedChanges();
							handleClose
						}}
					>
                        Save Changes
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

export default AdminConversionsComponents;
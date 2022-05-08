/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import  { useState } from 'react';
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { ConversionBidirectional } from '../../types/items';

interface CreateUnitFormProps{
	sourceId: string;
	destinationId: string;
	bidirectional: ConversionBidirectional;
	slope: number;
	intercept: number;
	note: string;
	submittedOnce: boolean;
	handleSourceIdChange: (val: string) => void;
	handleDestinationIdChange: (val: string) => void;
	handleBidirectionalChange: (val: ConversionBidirectional) => void;
	handleSlopeChange: (val: string) => void;
	handleInterceptChange: (val: string) => void;
	handleNoteChange: (val: string) => void;
	submitNewConversion: () => void;
}

const ModalCard = (props: CreateUnitFormProps) => {
	//showModal sets the value for the show function to false to make sure the moda
	//does not show unless it is pressed
	const [showModal, setShow] = useState(false);
	const handleClose = () => setShow(false);

	//This functino will be used to submit the new conversions
	// TODO The Connection to the backend to actually submit the new conversion needs to be set up.
	const handleSubmit = () => {
		setShow(false)
		props.submitNewConversion()
	};

	const handleShow = () => setShow(true);

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}

	const tableStyle: React.CSSProperties = {
		marginLeft: '25%',
		marginRight: '25%',
		width: '50%'
	};

	return (
		<>
			{/* Show modal button */}
			<Button onClick={handleShow} style={{ margin: '0px 5px 5px 5px'}}>
				<FormattedMessage id='conversion.create.button'/>
			</Button>

			{/* Modal for the form to create a new conversion ||
            this needs to be hooked up to the backend so that the
            user can actually create the new conversion */}
			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header>
					<Modal.Title><FormattedMessage id='conversion.create.title'/></Modal.Title>
				</Modal.Header>
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="containter-fluid">
								<div style={tableStyle}>
									<form onSubmit={e => { e.preventDefault(); props.submitNewConversion(); }}>

										<div style={formInputStyle}>
											<label> <FormattedMessage id='conversion.source'/> </label><br />
											<Input onChange={({ target }) => props.handleSourceIdChange(target.value)} required value={props.sourceId} />
										</div>

										<div style={formInputStyle}>
											<label> <FormattedMessage id='conversion.destination'/> </label><br />
											<Input onChange={({ target }) => props.handleDestinationIdChange(target.value)} required value={props.destinationId} />
										</div>

										<div style={formInputStyle}>
											<label> <FormattedMessage id='conversion.bidirectional'/> </label><br />
											<Input type='select' onChange={({ target }) => props.handleBidirectionalChange(target.value as ConversionBidirectional)} value={props.bidirectional}>
												{Object.entries(ConversionBidirectional).map(([role, val]) => (
													<option value={val} key={val}> {role} </option>
												))}
											</Input>
										</div>

										<div style={formInputStyle}>
											<label> <FormattedMessage id='conversion.slope'/> </label><br />
											<Input type="number" onChange={({ target }) => props.handleSlopeChange(target.value)} required value={props.slope} />
										</div>

										<div style={formInputStyle}>
											<label> <FormattedMessage id='conversion.intercept'/> </label><br />
											<Input type="number" onChange={({ target }) => props.handleInterceptChange(target.value)} required value={props.intercept} />
										</div>

										<div style={formInputStyle}>
											<label> <FormattedMessage id='conversion.note'/> </label><br />
											<Input type='textarea' onChange={({ target }) => props.handleNoteChange(target.value)} required value={props.note} />
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>
				</Modal.Body>

				<Modal.Footer>
					<Button variant="secondary" onClick={handleClose}>
						<FormattedMessage id='conversion.close'/>
					</Button>
					<Button variant="primary" onClick={handleSubmit}>
						<FormattedMessage id='conversion.submit.new'/>
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}


export default ModalCard

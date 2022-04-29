/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { useState } from 'react';
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import '../../styles/unit-add-modal.css';

interface CreateUnitFormProps {
	name: string,
	identifier: string,
	unitRepresent: string,
	secInRate: number,
	typeOfUnit: string,
	unitIndex?: number,
	suffix: string,
	displayable: string,
	preferredDisplay: boolean,
	note: string,
	submitNewUnit: () => void;
	handleNameChange: (val: string) => void;
	handleIdentifierChange: (val: string) => void;
	handleUnitRepresentChange: (val: string) => void;
	handleSecInRateChange: (val: number) => void;
	handleTypeOfUnitChange: (val: string) => void;
	handleSuffixChange: (val: string) => void;
	handleDisplayableChange: (val: string) => void;
	handlePreferredDisplayChange: (val: boolean) => void;
	handleNoteChange: (val: string) => void;
}

const ModalCard = (props: CreateUnitFormProps) => {
	const handleNameChange = props.handleNameChange

	const [showModal, setShow] = useState(false);
	const handleClose = () => setShow(false);

	const handleSubmit = () => {
		setShow(false)
		props.submitNewUnit()
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
			<Button variant="Secondary" onClick={handleShow}>
				Create Unit
			</Button>

			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header closeButton>
					<Modal.Title> <FormattedMessage id="create.unit" /></Modal.Title>
				</Modal.Header>
				{/* TODO: Styling of the form could use some work to make textboxes bigger, etc */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="containter-fluid">
								<div style={tableStyle}>
									{/*HTML form to accept new unit information*/}
									<form onSubmit={e => { e.preventDefault(); props.submitNewUnit(); }}>
										{/* Name input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.name" /></label><br />
											<Input type='text' onChange={({ target }) => handleNameChange(target.value)} required value={props.name} />
										</div>
										{/* Identifier input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.identifier" /></label><br />
											<Input type='text' onChange={({ target }) => props.handleIdentifierChange(target.value)} required value={props.identifier} />
										</div>
										{/* Unit represent input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.represent" /></label><br />
											<Input type='select' onChange={({ target }) => props.handleUnitRepresentChange(target.value)} required value={props.unitRepresent}>
												<option value='raw' key='raw'>Raw</option>
												<option value='quantity' key='quantity'>Quantity</option>
												<option value='flow' key='flow'>Flow</option>
												<option value='unused' key='unused'>Unused</option>
											</Input>
										</div>
										{/* Seconds in rate input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.sec.in.rate" /></label><br />
											<Input type='number' onChange={({ target }) => props.handleSecInRateChange(parseInt(target.value))} required value={props.secInRate} />
										</div>
										{/* Type of input input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.type.of.unit" /></label><br />
											<Input type='select' onChange={({ target }) => props.handleTypeOfUnitChange(target.value)} required value={props.typeOfUnit}>

												<option value='unit' key='unit'>Unit</option>
												<option value='meter' key='meter'>Meter</option>
												<option value='suffix' key='suffix'>Suffix</option>
											</Input>
										</div>
										{/* Suffix input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.suffix" /></label><br />
											<Input type='text' onChange={({ target }) => props.handleSuffixChange(target.value)} required value={props.suffix} />
										</div>
										{/* Displayable type input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.dropdown.displayable" /></label><br />
											<Input type='select' onChange={({ target }) => props.handleDisplayableChange(target.value)} required value={props.displayable} >
												<option value='all' key='all'><FormattedMessage id="unit.dropdown.displayable.option.all" /></option>
												<option value='none' key='none'><FormattedMessage id="unit.dropdown.displayable.option.none" /></option>
												<option value='admin' key='admin'><FormattedMessage id="unit.dropdown.displayable.option.admin" /></option>
											</Input>
										</div>
										{/* Preferred display input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.preferred.display" /></label>
											{/* <Input type='checkbox' onChange={({ target }) => props.handlePreferredDisplayChange(JSON.parse(target.value))}
												value={props.preferredDisplay.toString()} /> */}
											<Input type='select' onChange={({ target }) => props.handlePreferredDisplayChange(JSON.parse(target.value))}>
												<option value="true"> Yes </option>
												<option value="false"> No </option>
											</Input>

										</div>


										{/* Note input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.note.optional" /></label><br />
											<Input type='textarea' onChange={({ target }) => props.handleNoteChange(target.value)} value={props.note} />
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>
				</Modal.Body>

				<Modal.Footer>
					<Button variant="secondary" onClick={handleClose}>
						Close
					</Button>
					<Button variant="primary" onClick={handleSubmit}>
						Save Changes
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}


export default ModalCard
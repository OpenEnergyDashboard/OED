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

interface UnitFormProps {
	name: string,
	identifier: string,
	unitRepresent: UnitRepresentType,
	secInRate: number,
	typeOfUnit: UnitType,
	unitIndex?: number,
	suffix: string,
	displayable: DisplayableType,
	preferredDisplay: boolean,
	note: string,
	showModal: boolean,
	handleNameChange: (val: string) => void;
	handleIdentifierChange: (val: string) => void;
	handleUnitRepresentChange: (val: string) => void;
	handleSecInRateChange: (val: number) => void;
	handleTypeOfUnitChange: (val: string) => void;
	handleSuffixChange: (val: string) => void;
	handleDisplayableChange: (val: string) => void;
	handlePreferredDisplayChange: (val: boolean) => void;
	handleNoteChange: (val: string) => void;
	handleShowModal: (val: boolean) => void;
	handleSaveAll: () => void;
}

const ModalCard = (props: UnitFormProps) => {

	return (
		<>
			{/* Show modal button */}
			<Button variant="Secondary" onClick={ () => props.handleShowModal(true) }>
				<FormattedMessage id="create.unit" />
			</Button>
			<Modal show={props.showModal} onHide={ () => props.handleShowModal(false) }>
				<Modal.Header closeButton>
					<Modal.Title> <FormattedMessage id="create.unit" /></Modal.Title>
				</Modal.Header>
				{/* TODO: Styling of the form could use some work to make textboxes bigger, etc */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div>
									{/* Name input*/}
									<div>
										<label><FormattedMessage id="unit.name" /></label><br />
										<Input type='text' onChange={({ target }) => props.handleNameChange(target.value)} required value={props.name} />
									</div>
									{/* Identifier input*/}
									<div>
										<label><FormattedMessage id="unit.identifier" /></label><br />
										<Input type='text' onChange={({ target }) => props.handleIdentifierChange(target.value)} required value={props.identifier} />
									</div>
									{/* Unit represent input*/}
									<div>
										<label><FormattedMessage id="unit.represent" /></label><br />
										<Input type='select' onChange={({ target }) => props.handleUnitRepresentChange(target.value)}
											required value={props.unitRepresent}>
											{Object.keys(UnitRepresentType).map(key => {
												return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Seconds in rate input*/}
									<div>
										<label><FormattedMessage id="unit.sec.in.rate" /></label><br />
										<Input type='number' onChange={({ target }) => props.handleSecInRateChange(parseInt(target.value))} required value={props.secInRate} />
									</div>
									{/* Type of input input*/}
									<div>
										<label><FormattedMessage id="unit.type.of.unit" /></label><br />
										<Input type='select' onChange={({ target }) => props.handleTypeOfUnitChange(target.value)} required value={props.typeOfUnit}>
											{Object.keys(UnitType).map(key => {
												return (<option value={key} key={key}>{translate(`UnitType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Suffix input*/}
									<div>
										<label><FormattedMessage id="unit.suffix" /></label><br />
										<Input type='text' onChange={({ target }) => props.handleSuffixChange(target.value)} required value={props.suffix} />
									</div>
									{/* Displayable type input*/}
									<div>
										<label><FormattedMessage id="unit.dropdown.displayable" /></label><br />
										<Input type='select' onChange={({ target }) => props.handleDisplayableChange(target.value)} required value={props.displayable} >
											{Object.keys(DisplayableType).map(key => {
												return (<option value={key} key={key}>{translate(`DisplayableType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Preferred display input*/}
									<div>
										<label><FormattedMessage id="unit.preferred.display" /></label>
										{/* <Input type='checkbox' onChange={({ target }) => props.handlePreferredDisplayChange(JSON.parse(target.value))}
											value={props.preferredDisplay.toString()} /> */}
											<Input type='select' onChange={({ target }) => props.handlePreferredDisplayChange(JSON.parse(target.value))}>
											<option value="true"> {translate('yes')} </option>
											<option value="false"> {translate('no')} </option>
										</Input>
									</div>
									{/* Note input*/}
									<div>
										<label><FormattedMessage id="unit.note.optional" /></label><br />
										<Input type='textarea' onChange={({ target }) => props.handleNoteChange(target.value)} value={props.note} />
									</div>
								</div>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => props.handleShowModal(false)}>
						<FormattedMessage id="close" />
					</Button>
					<Button variant="primary" onClick={() => props.handleSaveAll()} disabled={!props.name || !props.identifier}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

export default ModalCard
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

interface CreateUnitModalProps {
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
	handleUnitRepresentChange: (val: UnitRepresentType) => void;
	handleSecInRateChange: (val: number) => void;
	handleTypeOfUnitChange: (val: UnitType) => void;
	handleSuffixChange: (val: string) => void;
	handleDisplayableChange: (val: DisplayableType) => void;
	handlePreferredDisplayChange: (val: boolean) => void;
	handleNoteChange: (val: string) => void;
	handleShowModal: (val: boolean) => void;
	handleSaveAll: () => void;
}

interface CreateUnitModalStates {
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
}

class CreateUnitModelComponent extends React.Component<CreateUnitModalProps, CreateUnitModalStates> {

	//Creates a constructor and sets the set to the prop for each unit data.
	constructor(props: CreateUnitModalProps) {
		super(props);
		this.state = {
			name: this.props.name,
			identifier: this.props.identifier,
			typeOfUnit: this.props.typeOfUnit,
			unitRepresent: this.props.unitRepresent,
			displayable: this.props.displayable,
			preferredDisplay: this.props.preferredDisplay,
			secInRate: this.props.secInRate,
			suffix: this.props.suffix,
			note: this.props.note,
			showModal: this.props.showModal,
		};
	}
	render() {
		return (
			<>
				{/* Show modal button */}
				<Button variant="Secondary" onClick={ () => this.props.handleShowModal(true) }>
					<FormattedMessage id="create.unit" />
				</Button>
				<Modal show={this.props.showModal} onHide={ () => this.props.handleShowModal(false) }>
					<Modal.Header /*closeButton*/>
						<Modal.Title> <FormattedMessage id="create.unit" /></Modal.Title>
					</Modal.Header>
					<Modal.Body className="show-grid">
						<div id="container">
							<div id="modalChild">
								{/* Modal content */}
								<div className="container-fluid">
									<div>
										{/* Name input*/}
										<div>
											<label><FormattedMessage id="unit.name" /></label><br />
											<Input type='text' onChange={({ target }) => this.props.handleNameChange(target.value)} required value={this.props.name} />
										</div>
										{/* Identifier input*/}
										<div>
											<label><FormattedMessage id="unit.identifier" /></label><br />
											<Input type='text' onChange={({ target }) => this.props.handleIdentifierChange(target.value)} required value={this.props.identifier} />
										</div>
										{/* Unit represent input*/}
										<div>
											<label><FormattedMessage id="unit.represent" /></label><br />
											<Input type='select' onChange={({ target }) => this.props.handleUnitRepresentChange(JSON.parse(target.value))}
												required value={this.props.unitRepresent}>
												{Object.keys(UnitRepresentType).map(key => {
													return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Seconds in rate input*/}
										<div>
											<label><FormattedMessage id="unit.sec.in.rate" /></label><br />
											<Input type='number' onChange={({ target }) => this.props.handleSecInRateChange(parseInt(target.value))} required value={this.props.secInRate} />
										</div>
										{/* Type of input input*/}
										<div>
											<label><FormattedMessage id="unit.type.of.unit" /></label><br />
											<Input type='select' onChange={({ target }) => this.props.handleTypeOfUnitChange(JSON.parse(target.value))} required value={this.props.typeOfUnit}>
												{Object.keys(UnitType).map(key => {
													return (<option value={key} key={key}>{translate(`UnitType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Suffix input*/}
										<div>
											<label><FormattedMessage id="unit.suffix" /></label><br />
											<Input type='text' onChange={({ target }) => this.props.handleSuffixChange(target.value)} required value={this.props.suffix} />
										</div>
										{/* Displayable type input*/}
										<div>
											<label><FormattedMessage id="unit.dropdown.displayable" /></label><br />
											<Input type='select' onChange={({ target }) => this.props.handleDisplayableChange(JSON.parse(target.value))} required value={this.props.displayable} >
												{Object.keys(DisplayableType).map(key => {
													return (<option value={key} key={key}>{translate(`DisplayableType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Preferred display input*/}
										<div>
											<label><FormattedMessage id="unit.preferred.display" /></label>
												<Input type='select' onChange={({ target }) => this.props.handlePreferredDisplayChange(JSON.parse(target.value))}>
												<option value="true"> {translate('yes')} </option>
												<option value="false"> {translate('no')} </option>
											</Input>
										</div>
										{/* Note input*/}
										<div>
											<label><FormattedMessage id="unit.note.optional" /></label><br />
											<Input type='textarea' onChange={({ target }) => this.props.handleNoteChange(target.value)} value={this.props.note} />
										</div>
									</div>
								</div>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => this.props.handleShowModal(false)}>
							<FormattedMessage id="discard.changes" />
						</Button>
						<Button variant="primary" onClick={() => this.props.handleSaveAll()} disabled={!this.props.name || !this.props.identifier}>
							<FormattedMessage id="save.all" />
						</Button>
					</Modal.Footer>
				</Modal>
			</>
		);
	}
}

export default CreateUnitModelComponent;
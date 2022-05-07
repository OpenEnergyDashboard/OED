/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import '../../styles/unit-edit-modal.css';
import { UnitData, EditUnitDetailsAction, DisplayableType, UnitRepresentType, UnitType } from '../../types/redux/units';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';

//Interface for edited units props
interface EditUnitProps {
	unit: UnitData;
	onhide: () => void;
	editUnitDetails(unit: UnitData): EditUnitDetailsAction;
	show: boolean;
	name: string;
	identifier: string;
	unitRepresent: UnitRepresentType;
	secInRate: number;
	typeOfUnit: UnitType;
	unitIndex: number;
	suffix: string;
	displayable: DisplayableType;
	preferredDisplay: boolean;
	note: string;
}

//Interface for the unit state
interface UnitViewState {
	show: boolean;
	nameInput: string;
	identifierInput: string;
	unitRepresentInput: UnitRepresentType;
	typeOfUnitInput: UnitType;
	displayableInput: DisplayableType;
	preferredDisplayableInput: boolean;
	secInRateInput: number;
	suffixInput: string;
	noteInput: string;
}

type UnitViewPropsWithIntl = EditUnitProps;

class UnitModelEditComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState>{

	//Creates a constructor and sets the set to the prop for each unit data.
	constructor(props: UnitViewPropsWithIntl) {
		super(props);
		this.state = {
			show: this.props.show,
			nameInput: this.props.name,
			identifierInput: this.props.identifier,
			typeOfUnitInput: this.props.typeOfUnit,
			unitRepresentInput: this.props.unitRepresent,
			displayableInput: this.props.displayable,
			preferredDisplayableInput: this.props.preferredDisplay,
			secInRateInput: this.props.secInRate,
			suffixInput: this.props.suffix,
			noteInput: this.props.note
		};
	}

	render() {
		return (
			<>
				<Modal show={this.props.show} onHide={this.props.onhide}>
					<Modal.Header closeButton>
						<Modal.Title> <FormattedMessage id="edit.unit" /></Modal.Title>
					</Modal.Header>

					{/* when any of the unit are changed call one of the functions.  */}
					<Modal.Body className="show-grid">
						<div id="container">
							<div id="modalChild">
								{this.isIdentifier(this.props.identifier)}
								{this.isTypeOfUnit(this.props.typeOfUnit)}
								{this.isUnitRepresent(this.props.unitRepresent)}
								{this.isDisplayableType(this.props.displayable)}
								{this.isSecInRate(this.props.secInRate)}
								{this.isPreferredDisplayable(this.props.preferredDisplay)}
								{this.isSuffix(this.props.suffix)}
								{this.isNote(this.props.note)}
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						{/* Hides the modal */}
						<Button variant="secondary" onClick={this.props.onhide}>
							<FormattedMessage id="close" />
						</Button>
						{/* On click calls the function onSaveChanges in this componenet */}
						<Button variant="primary" onClick={() => this.onSaveChanges()}>
							<FormattedMessage id="save.all" />
						</Button>
					</Modal.Footer>
				</Modal>
			</>
		);
	}

	/** This function (1) checks if the unit state value is different from the unit prop value.
	 * (2) If the value is different, add all the changed values to editedUnit and call the prop editUnitDeatils(editedUnit).
	 * (3) Call the function onHide() -> this will hide the modal and call function handleClose on UnitViewComponent.tsx */

	private onSaveChanges() {
		const oldIdentifier = this.props.unit.identifier;
		const oldUnitRepresentType = this.props.unit.unitRepresent;
		const oldTypeOfUnit = this.props.unit.typeOfUnit;
		const oldDisplayable = this.props.unit.displayable;
		const oldPreferredDisplay = this.props.unit.preferredDisplay;
		const oldSecInRate = this.props.unit.secInRate;
		const oldSuffix = this.props.unit.suffix.toString();
		const oldNote = this.props.unit.note;
		if (oldIdentifier != this.state.identifierInput || oldUnitRepresentType != this.state.unitRepresentInput ||
			oldTypeOfUnit != this.state.typeOfUnitInput || oldDisplayable != this.state.displayableInput ||
			oldPreferredDisplay != this.state.preferredDisplayableInput || oldSecInRate != this.state.secInRateInput ||
			oldSuffix != this.state.suffixInput || oldNote != this.state.noteInput) {
			const identifier = this.state.identifierInput;
			const unitRepresent = this.state.unitRepresentInput as UnitRepresentType;
			const typeOfUnit = this.state.typeOfUnitInput as UnitType;
			const displayable = this.state.displayableInput as DisplayableType;
			const preferredDisplay = this.state.preferredDisplayableInput;
			const secInRate = this.state.secInRateInput;
			const suffix = this.state.suffixInput;
			const note = this.state.noteInput;

			const editedUnit = {
				...this.props.unit,
				identifier, unitRepresent, typeOfUnit,
				displayable, preferredDisplay, secInRate,
				suffix, note
			};
			this.props.editUnitDetails(editedUnit);
			this.props.onhide();
		}
	}

	/**
	 * The following handlers will change the state to the corresponding unit
	 */
	private handleIdentifierChange(event: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ identifierInput: event.target.value });
	}

	private handleTypeOfUnitChange(event: React.ChangeEvent<HTMLInputElement>) {
		const TypeOfUnit = event.target.value as UnitType;
		this.setState({ typeOfUnitInput: TypeOfUnit });
	}

	private handleUnitRepresentChange(event: React.ChangeEvent<HTMLInputElement>) {
		const unitRepresent = event.target.value as UnitRepresentType;
		this.setState({ unitRepresentInput: unitRepresent });
	}

	private handleDisplayableChange(event: React.ChangeEvent<HTMLInputElement>) {
		const displayable = event.target.value as DisplayableType;
		this.setState({ displayableInput: displayable });
	}

	private handlePreferredDisplayableChange(event: React.ChangeEvent<HTMLInputElement>) {
		const preferredDisplayable = JSON.parse(event.target.value);
		this.setState({ preferredDisplayableInput: preferredDisplayable });
	}

	private handleSecInRateChange(event: React.ChangeEvent<HTMLInputElement>) {
		const secInRate = Number(event.target.value);
		this.setState({ secInRateInput: secInRate });
	}

	private handleSuffixChange(event: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ suffixInput: event.target.value });
	}

	private handleNoteChange(event: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ noteInput: event.target.value });
	}

	/**
	 * The following functions will append each unit detail to the modal card.
	 */
	private isIdentifier(identifier: string) {
		return (
			<div>
				<FormattedMessage id="unit.identifier" /> <span><br /><input type="text" defaultValue={identifier}
					placeholder="Identifier" onChange={event => this.handleIdentifierChange(event)} /></span>
			</div>
		)
	}

	private isUnitRepresent(unitRepresent: UnitRepresentType) {
		return (
			<div>
				<label><FormattedMessage id="unit.represent" /> </label>
				<Input type='select' defaultValue={unitRepresent}
					onChange={event => this.handleUnitRepresentChange(event)}>
					{Object.keys(UnitRepresentType).map(key => {
						return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>)
					})}
				</Input>
			</div>
		)
	}

	private isSecInRate(secInRate: number) {
		return (
			<div>
				<FormattedMessage id="unit.sec.in.rate" /> <span><br /><input type="number" defaultValue={secInRate}
					onChange={event => this.handleSecInRateChange(event)}
					placeholder="Sec In Rate" /></span>
			</div>
		)
	}

	private isTypeOfUnit(typeOfUnit: UnitType) {
		return (
			<div>
				<label><FormattedMessage id="unit.type.of.unit" /> </label>
				<Input type='select' defaultValue={typeOfUnit}
					onChange={event => this.handleTypeOfUnitChange(event)}>
					{Object.keys(UnitType).map(key => {
						return (<option value={key} key={key}>{translate(`UnitType.${key}`)}</option>)
					})}
				</Input>
			</div>
		)
	}

	private isSuffix(suffix: string) {
		return (
			<div>
				<label><FormattedMessage id="unit.suffix" /> </label>
				<input type="text" defaultValue={suffix} placeholder="Suffix"
					onChange={event => this.handleSuffixChange(event)} />
			</div>
		)
	}

	private isDisplayableType(displayable: DisplayableType) {
		return (
			<div>
				<label><FormattedMessage id="unit.displayable" /> </label>
				<Input type='select' defaultValue={displayable}
					onChange={event => this.handleDisplayableChange(event)}>
					{Object.keys(DisplayableType).map(key => {
						return (<option value={key} key={key}>{translate(`DisplayableType.${key}`)}</option>)
					})}
				</Input>
			</div>
		)
	}

	private isPreferredDisplayable(preferredDisplay: boolean) {
		return (
			<div>
				<label><FormattedMessage id="unit.preferred.display" /> </label>
				<Input type='select' defaultValue={preferredDisplay.toString()}
					onChange={event => this.handlePreferredDisplayableChange(event)}>
					<option value="true"> {translate('yes')} </option>
					<option value="false"> {translate('no')} </option>
				</Input>
			</div>
		)
	}

	private isNote(note: string) {
		return (
			<div>
				<label><FormattedMessage id="unit.note" /> </label>
				<input type="text" defaultValue={note} placeholder="Note"
					onChange={event => this.handleNoteChange(event)} />
			</div>
		)
	}
}

export default UnitModelEditComponent;
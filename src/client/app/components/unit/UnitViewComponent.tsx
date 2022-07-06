/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Button } from 'reactstrap';
import { UnitData, EditUnitDetailsAction } from '../../types/redux/units';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import ModalCard from './EditUnitModalComponent';
import '../../styles/unit-card-page.css';

interface UnitViewProps {
	id: number;
	unit: UnitData;
	isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;
	onSubmitClicked: () => void;
	show: boolean;
	onHide: boolean;
	editUnitDetails(unit: UnitData): EditUnitDetailsAction;
	log(level: string, message: string): any;
}

interface UnitViewState {
	identifierInput: string;
	secInRateInput: number;
	unitRepresentInput: string;
	typeOfUnitInput: string;
	displayableInput: string;
	preferredDisplayableInput: boolean;
	suffixInput: string;
	noteInput: string;
	show: boolean;
	onHide: boolean;
}

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState> {
	constructor(props: UnitViewPropsWithIntl) {
		super(props);
		this.state = {
			identifierInput: this.props.unit.identifier,
			unitRepresentInput: this.props.unit.unitRepresent,
			typeOfUnitInput: this.props.unit.typeOfUnit,
			secInRateInput: this.props.unit.secInRate,
			displayableInput: this.props.unit.displayable,
			preferredDisplayableInput: this.props.unit.preferredDisplay,
			suffixInput: this.props.unit.suffix,
			noteInput: this.props.unit.note,
			show: false,
			onHide: true
		};
	}

	public render() {
		return (
			<div className="card">
				<div className="identifier-container">
					{this.props.unit.name}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.identifier" /></b> {this.props.unit.identifier}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.type.of.unit" /></b> {this.props.unit.typeOfUnit}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.represent" /></b> {this.props.unit.unitRepresent}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.displayable" /></b> {this.props.unit.displayable}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.preferred.display" /></b> {this.props.unit.preferredDisplay.toString()}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.sec.in.rate" /></b> {this.props.unit.secInRate}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.suffix" /></b> {this.props.unit.suffix}
				</div>
				<div className="unit-container">
					{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
					<b><FormattedMessage id="unit.note" /></b> {this.props.unit.note.slice(0, 29)}
				</div>
				{this.isAdmin()}
			</div>
		);
	}

	//This checks if the current user is an admin and create the model for editing a unit.
	private isAdmin() {
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			return (
				<div className="edit-btn">
					<Button variant="Secondary" onClick={this.handleShow}>
						<FormattedMessage id="edit.unit" />
					</Button>
					{/* this will direct to the createUnitModalComponent.tsx */}
					<ModalCard
						show={this.state.show}
						onhide={this.handleClose}
						editUnitDetails={this.props.editUnitDetails}
						unit={this.props.unit}
						identifier={this.props.unit.identifier}
						name={this.props.unit.name}
						unitRepresent={this.props.unit.unitRepresent}
						secInRate={this.props.unit.secInRate}
						typeOfUnit={this.props.unit.typeOfUnit}
						unitIndex={this.props.unit.unitIndex}
						suffix={this.props.unit.suffix}
						displayable={this.props.unit.displayable}
						preferredDisplay={this.props.unit.preferredDisplay}
						note={this.props.unit.note}
					/>
				</div>
			)
		}
		// returns null because the user is not logged in
		// mostly here to avoid compiler errors referencing return values
		return null;
	}

	//This will show the modal
	private handleShow = () => {
		this.setState({ show: true });
	}

	//This will close the modal and will trigger the onSubmitClick handler.
	private handleClose = () => {
		this.props.onSubmitClicked();
		this.setState({ show: false });
	}
}

export default injectIntl(UnitViewComponent);
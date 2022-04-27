/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Button } from 'reactstrap';
import { UnitData, EditUnitDetailsAction } from '../../types/redux/units';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import ModalCard from './UnitModalEditComponent'
import '../../styles/unit-card-page.css'

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
	identifierFocus: boolean;
	identifierInput: string;
	secInRateFocus: boolean;
	secInRateInput: number;
	unitRepresentFocus: boolean;
	unitRepresentInput: string;
	typeOfUnitFocus: boolean;
	typeOfUnitInput: string;
	displayableFocus: boolean;
	displayableInput: string;
	preferredDisplayableFocus: boolean;
	preferredDisplayableInput: boolean;
	suffixFocus: boolean;
	suffixInput: string;
	noteFocus: boolean;
	noteInput: string;
	show: boolean;
	onHide: boolean;
}

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState> {
	constructor(props: UnitViewPropsWithIntl) {
		super(props);
		this.state = {
			identifierFocus: false,
			identifierInput: this.props.unit.identifier,
			unitRepresentFocus: false,
			unitRepresentInput: this.props.unit.unitRepresent,
			typeOfUnitFocus: false,
			typeOfUnitInput: this.props.unit.typeOfUnit,
			secInRateFocus: false,
			secInRateInput: this.props.unit.secInRate,
			displayableFocus: false,
			displayableInput: this.props.unit.displayable,
			preferredDisplayableFocus: false,
			preferredDisplayableInput: this.props.unit.preferredDisplay,
			suffixFocus: false,
			suffixInput: this.props.unit.suffix,
			noteFocus: false,
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
					<b>Unit Identifier:</b> {this.props.unit.identifier}
				</div>
				<div className="unit-container">
					<b>Type of Unit:</b> {this.props.unit.typeOfUnit}
				</div>
				<div className="unit-container">
					<b>Unit Represent:</b> {this.props.unit.unitRepresent}
				</div>
				<div className="unit-container">
					<b>Displayable:</b> {this.props.unit.displayable}
				</div>
				<div className="unit-container">
					<b>Preferred Display:</b> {this.props.unit.preferredDisplay.toString()}
				</div>
				<div className="unit-container">
					<b>Suffix:</b> {this.props.unit.suffix}
				</div>
				<div className="unit-container">
					<b>Note:</b> {this.props.unit.note}
				</div>
				{this.isAdmin()}
			</div>
		);
	}

	private isAdmin() {
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			return (
				<div className="edit-btn">
					<Button variant="Secondary" onClick={this.handleShow}>
                        Edit Unit
					</Button>
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
		return null;
	}

	private handleShow = () => {
		this.setState({ show: true });
	}

	private handleClose = () => {
		this.props.onSubmitClicked();
		this.setState({ show: false });
	}
}

export default injectIntl(UnitViewComponent);
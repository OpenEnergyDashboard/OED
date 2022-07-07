/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { unitsApi } from '../../utils/api';
import { UnitType, UnitRepresentType, DisplayableType } from '../../types/redux/units';
import translate from '../../utils/translate';
import CreateUnitModalComponent from '../../components/unit/CreateUnitModalComponent';

class CreateUnitContainer extends React.Component {
	constructor(props: any) {
		super(props);
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleIdentifierChange = this.handleIdentifierChange.bind(this);
		this.handleUnitRepresentChange = this.handleUnitRepresentChange.bind(this);
		this.handleSecInRateChange = this.handleSecInRateChange.bind(this);
		this.handleTypeOfUnitChange = this.handleTypeOfUnitChange.bind(this);
		this.handleSuffixChange = this.handleSuffixChange.bind(this);
		this.handleDisplayableChange = this.handleDisplayableChange.bind(this);
		this.handlePreferredDisplayChange = this.handlePreferredDisplayChange.bind(this);
		this.handleNoteChange = this.handleNoteChange.bind(this);
		this.handleShowModal = this.handleShowModal.bind(this);
		this.handleSaveAll = this.handleSaveAll.bind(this);
	}

	//default values
	state = {
		name: '',
		identifier: '',
		unitRepresent: UnitRepresentType.quantity,
		secInRate: 3600,
		typeOfUnit: UnitType.unit,
		unitIndex: undefined,
		suffix: '',
		displayable: DisplayableType.all,
		preferredDisplay: false,
		note: '',
		showModal: false,
	}

	/**
	 * The following handlers will change the state to the corresponding unit
	 */
	
	private handleNameChange = (newName: string) => {
		this.setState({ name: newName });
	}

	private handleIdentifierChange = (newIdentifier: string) => {
		this.setState({ identifier: newIdentifier });
	}

	private handleUnitRepresentChange = (newUnitRepresent: string) => {
		this.setState({ unitRepresent: newUnitRepresent });
	}

	private handleSecInRateChange = (newSecInRate: number) => {
		this.setState({ secInRate: newSecInRate });
	}

	private handleTypeOfUnitChange = (newTypeOfUnit: string) => {
		this.setState({ typeOfUnit: newTypeOfUnit });
	}

	private handleSuffixChange = (newSuffix: string) => {
		this.setState({ suffix: newSuffix })
	}

	private handleDisplayableChange = (newDisplayable: string) => {
		this.setState({ displayable: newDisplayable });
	}

	private handlePreferredDisplayChange = (newPreferredDisplay: boolean) => {
		this.setState({ preferredDisplay: newPreferredDisplay });
	}
	
	private handleNoteChange = (newNote: string) => {
		this.setState({ note: newNote });
	}

	private handleShowModal = (newShowModal: boolean) => {
		// if showModal False
		if (!newShowModal) {
			// clear input fields & set to defaults
			this.state.name = ''
			this.state.identifier = ''
			this.state.unitRepresent = UnitRepresentType.quantity
			this.state.secInRate = 3600
			this.state.typeOfUnit = UnitType.unit
			this.state.unitIndex = undefined
			this.state.suffix = ''
			this.state.displayable = DisplayableType.all
			this.state.preferredDisplay = false
			this.state.note = ''
		}
		this.setState({ showModal: newShowModal });
	}

	// Direct call to the API, this does not use the Redux state and goes around it to go directly to the API
	// TODO: Current implementation requires page refresh to show new unit; Ideally we would refresh the redux state when the handleSaveAll runs.
	private handleSaveAll = async () => {
		try {
			await unitsApi.addUnit({
				// This value is not used but must be assigned so -99 is used.
				id: -99,
				name: this.state.name,
				identifier: this.state.identifier,
				unitRepresent: this.state.unitRepresent,
				secInRate: this.state.secInRate,
				typeOfUnit: this.state.typeOfUnit,
				// This value is not used but must be assigned so -99 is used.
				unitIndex: -99,
				suffix: this.state.suffix,
				displayable: this.state.displayable,
				preferredDisplay: this.state.preferredDisplay,
				note: this.state.note
			});
			showSuccessNotification(translate('unit.successfully.create.unit'))
			this.handleShowModal(false);
		} catch (error) {
			showErrorNotification(translate('unit.failed.to.create.unit'));
		}
	};
	public render() {
		return (
			<div>
				<CreateUnitModalComponent
					name={this.state.name}
					identifier={this.state.identifier}
					unitRepresent={this.state.unitRepresent}
					secInRate={this.state.secInRate}
					typeOfUnit={this.state.typeOfUnit}
					unitIndex={this.state.unitIndex}
					suffix={this.state.suffix}
					displayable={this.state.displayable}
					preferredDisplay={this.state.preferredDisplay}
					note={this.state.note}
					showModal={this.state.showModal}
					handleNameChange={this.handleNameChange}
					handleIdentifierChange={this.handleIdentifierChange}
					handleUnitRepresentChange={this.handleUnitRepresentChange}
					handleSecInRateChange={this.handleSecInRateChange}
					handleTypeOfUnitChange={this.handleTypeOfUnitChange}
					handleSuffixChange={this.handleSuffixChange}
					handleDisplayableChange={this.handleDisplayableChange}
					handlePreferredDisplayChange={this.handlePreferredDisplayChange}
					handleNoteChange={this.handleNoteChange}
					handleShowModal={this.handleShowModal}
					handleSaveAll={this.handleSaveAll}
				/>
			</div>
		);
	}
}

export default CreateUnitContainer
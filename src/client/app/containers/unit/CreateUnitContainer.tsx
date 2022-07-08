/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { unitsApi } from '../../utils/api';
import { UnitType, UnitRepresentType, DisplayableType } from '../../types/redux/units';
import translate from '../../utils/translate';
import CreateUnitModalComponent from '../../components/unit/CreateUnitModalComponent';


interface CreateUnitContainerProps {

}

interface CreateUnitContainerStates {
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

class CreateUnitContainer extends React.Component<CreateUnitContainerProps, CreateUnitContainerStates> {

	constructor(props: CreateUnitContainerProps) {
		super(props);
		this.state = {
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
		};

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

	/**
	 * The following handlers will change the state to the corresponding unit
	 */
	
	private handleNameChange = (newName: string) => {
		this.setState({ name: newName });
	}

	private handleIdentifierChange = (newIdentifier: string) => {
		this.setState({ identifier: newIdentifier });
	}

	private handleUnitRepresentChange = (newUnitRepresent: UnitRepresentType) => {
		this.setState({ unitRepresent: newUnitRepresent });
	}

	private handleSecInRateChange = (newSecInRate: number) => {
		this.setState({ secInRate: newSecInRate });
	}

	private handleTypeOfUnitChange = (newTypeOfUnit: UnitType) => {
		this.setState({ typeOfUnit: newTypeOfUnit });
	}

	private handleSuffixChange = (newSuffix: string) => {
		this.setState({ suffix: newSuffix })
	}

	private handleDisplayableChange = (newDisplayable: DisplayableType) => {
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
			this.setState({ name: '' })
			this.setState({ identifier: '' })
			this.setState({ unitRepresent: UnitRepresentType.quantity })
			this.setState({ secInRate: 3600 })
			this.setState({ typeOfUnit: UnitType.unit })
			this.setState({ unitIndex: undefined })
			this.setState({ suffix: '' })
			this.setState({ displayable: DisplayableType.all })
			this.setState({ preferredDisplay: false })
			this.setState({ note: '' })
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
			window.location.reload(); // not the correct way but works
		} catch (error) {
			showErrorNotification(translate('unit.failed.to.create.unit'));
		}
	}

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
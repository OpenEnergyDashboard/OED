import * as React from 'react'; 
import {Button} from 'reactstrap'; 
import { UnitData, EditUnitDetailsAction} from '../../types/redux/unit';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { UnitMetadata, UnitsAction } from '../../types/redux/unit';
import { confirmEditedUnits, fetchUnitsDetails, submitEditedUnits } from '../../actions/unit';
import { updateUnsavedChanges } from '../../actions/unsavedWarning';
import store from '../../index';

interface UnitViewProps {
    id: number; 
    unit: UnitData;
    isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;

//    editUnitDetails(unit: UnitMetadata): UnitsAction;
}

interface UnitViewState {
	identifierFocus: boolean;
	identifierInput: string;
    secInRateFocus: boolean;
	secInRateInput: number;
    unitRepresentFocus: boolean;
    unitRepresentInput: string;
    noteFocus: boolean;
	noteInput: string;
    // editUnitDetails(unit: UnitData): EditUnitDetailsAction;
}

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState> {
    constructor(props: UnitViewPropsWithIntl){
        super(props); 
        this.state = {
            secInRateFocus: false,
	        secInRateInput: this.props.unit.secInRate,
            identifierFocus: false,
            identifierInput: this.props.unit.identifier,
            unitRepresentFocus: false,
            unitRepresentInput: this.props.unit.unitRepresent,
            noteFocus: false,
            noteInput: this.props.unit.note,
        };
        this.toggleSecInRateInput = this.toggleSecInRateInput.bind(this);
        this.handleSecInRateChange = this.handleSecInRateChange.bind(this);
        this.toggleIdentifierInput = this.toggleIdentifierInput.bind(this);
        this.handleIdentifierChange = this.handleIdentifierChange.bind(this);
        this.handleUnitRepresentChange = this.handleUnitRepresentChange.bind(this);
        this.toggleUnitRepresentInput = this.toggleUnitRepresentInput.bind(this);
        this.toggleNoteInput = this.toggleNoteInput.bind(this);
        this.handleNoteChange = this.handleNoteChange.bind(this);
    }
    public render() {
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        return (
            <tr>
                {loggedInAsAdmin && <td> {this.props.unit.id} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.name}</td>}
				<td> {this.unitIdentifierInput()} </td>
                {/* {loggedInAsAdmin && <td> {this.props.unit.unitRepresent}</td>} */}
                <td> {this.formatUnitRepresentInput()} </td>
                {/* {loggedInAsAdmin && <td> {this.props.unit.secInRate}</td>} */}
                <td> {this.formatSecInRateInput()} </td>
                {loggedInAsAdmin && <td> {this.props.unit.typeOfUnit}</td>}
                {loggedInAsAdmin && <td> {this.props.unit.suffix}</td>}
                {loggedInAsAdmin && <td> {this.props.unit.displayable}</td>}
                {loggedInAsAdmin && <td> {this.props.unit.preferredDisplay}</td>}
                {loggedInAsAdmin && <td> {this.props.unit.note}</td>}
            </tr>
        );
    }
    private handleUnitRepresentChange(event: React.ChangeEvent<HTMLSelectElement>){
        this.setState({unitRepresentInput: event.target.value});
    }

    private toggleUnitRepresentInput(){
        if(this.state.unitRepresentFocus){
            const unitRepresent = this.state.unitRepresentInput;

            const editedUnit = {
                ...this.props.unit,
                unitRepresent
            };
            // this.props.editUnitDetails(editedUnit);
        }
        this.setState({unitRepresentFocus: !this.state.unitRepresentFocus});
    }


    private toggleSecInRateInput(){
        if(this.state.secInRateFocus){
            const secInRate = this.state.secInRateInput;

            const editedUnit = {
                ...this.props.unit,
                secInRate
            };
            //this.props.editUnitDetails(editedUnit) //Needs editUnitDetails function used to dispatch the action to edit unit details (refer to line #24 on MeterViewComponent.tsx)
        }
        this.setState({secInRateFocus: !this.state.secInRateFocus});
    }

    private handleSecInRateChange(event: React.ChangeEvent<HTMLInputElement>){
        this.setState({ secInRateInput: parseInt(event.target.value)}); //converts string to number
    }



    private removeUnsavedChangesFunction(callback: () => void) {
		// This function is called to reset all the inputs to the initial state
		store.dispatch<any>(confirmEditedUnits()).then(() => {
			store.dispatch<any>(fetchUnitsDetails()).then(callback);
		});
	}

	private submitUnsavedChangesFunction(successCallback: () => void, failureCallback: () => void) {
		// This function is called to submit the unsaved changes
		store.dispatch<any>(submitEditedUnits()).then(successCallback, failureCallback);
	}

	private updateUnsavedChanges() {
		// Notify that there are unsaved changes
		store.dispatch(updateUnsavedChanges(this.removeUnsavedChangesFunction, this.submitUnsavedChangesFunction));
	}

	componentDidUpdate(prevProps: UnitViewProps) {
		if (this.props.isEdited && !prevProps.isEdited) {
			// When the props.isEdited changes from false to true, there are unsaved changes
			this.updateUnsavedChanges();
		}
	}

    private styleToggleBtn(): React.CSSProperties {
		return { float: 'right' };
	}
    
    private styleEnabled(): React.CSSProperties {
		return { color: 'green' };
	}

	private styleDisabled(): React.CSSProperties {
		return { color: 'red' };
	}

    private formatStatus(): string {
		if (this.props.isSubmitting) {
			return '(' + this.props.intl.formatMessage({id: 'submitting'}) + ')';
		}

		if (this.props.isEdited) {
			return this.props.intl.formatMessage({id: 'edited'});
		}

		return '';
    }

    private handleIdentifierChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ identifierInput: event.target.value });
	}


    private toggleIdentifierInput() {
		if (this.state.identifierFocus) {
			const identifier = this.state.identifierInput;

			const editedUnit = {
                ...this.props.unit,
                identifier
			};
			// this.props.editUnitDetails(editedUnit);
		}
		this.setState({ identifierFocus: !this.state.identifierFocus });
	}

    

    private unitIdentifierInput(){
		let formattedIdentifier;
		let buttonMessageId;
		if(this.state.identifierFocus){
			formattedIdentifier = <textarea
				id={'identifier'}
				autoFocus
				value={this.state.identifierInput}
				onChange={event => this.handleIdentifierChange(event)}
			/>;
			buttonMessageId = 'update';
		} else {
			formattedIdentifier = <div>{this.state.identifierInput}</div>;
			buttonMessageId = 'edit';
		}

		let toggleButton;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleIdentifierInput}>
				<FormattedMessage id={buttonMessageId} />
			</Button>;
		} else {
			toggleButton = <div />;
		}

		if (loggedInAsAdmin) {
			return ( // add onClick
				<div>
					{formattedIdentifier}
					{toggleButton}
				</div>
			);
		} else {
			return (
				<div>
					{this.state.identifierInput}
					{toggleButton}
				</div>
			);
		}
	}



    private toggleNoteInput() {
		if (this.state.noteFocus) {
			const note = this.state.noteInput;

			const editedUnit = {
				...this.props.unit,
				note
			};
			//this.props.editUnitDetails(editedMeter);
		}
		this.setState({ noteFocus: !this.state.noteFocus });
	}

	private handleNoteChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
		this.setState({ noteInput: event.target.value });
	}

	private formatNoteInput(){
		let formattedNote;
		let buttonMessageId;
		if(this.state.noteFocus){
			formattedNote = <textarea
				id={'note'}
				autoFocus
				value={this.state.noteInput}
				onChange={event => this.handleNoteChange(event)}
			/>;
			buttonMessageId = 'update';
		} else {
			formattedNote = <div>{this.state.noteInput}</div>;
			buttonMessageId = 'edit';
		}

		let toggleButton;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		if (loggedInAsAdmin) {
			toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleNoteInput}>
				<FormattedMessage id={buttonMessageId} />
			</Button>;
		} else {
			toggleButton = <div />;
		}

		if (loggedInAsAdmin) {
			return ( // add onClick
				<div>
					{formattedNote}
					{toggleButton}
				</div>
			);
		} else {
			return (
				<div>
					{this.state.noteInput}
					{toggleButton}
				</div>
			);
		}
	}

    private formatUnitRepresentInput() {
        let formattedUnitRepresent;
        let buttonMessageId;
        if(this.state.unitRepresentFocus){
            formattedUnitRepresent = <select 
            id={'unitRepresent'} 
            value={this.state.unitRepresentInput}
            onChange={event => this.handleUnitRepresentChange(event)}>
            <option value="quantity">Quantity</option>
            <option value="flow">Flow</option>
            <option value="raw">Raw</option>
            <option value="unused">Unused</option>
            </select>
            buttonMessageId = 'update';
        }else{
            formattedUnitRepresent = <div>{this.state.unitRepresentInput}</div>
            buttonMessageId = 'edit';
        }

        let toggleButton;
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        if(loggedInAsAdmin) { 
            toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleUnitRepresentInput}>
            <FormattedMessage id={buttonMessageId} />
        </Button>;
        } else {
            toggleButton = <div /> 
        }

        if (loggedInAsAdmin) {
			return ( // add onClick
				<div>
					{formattedUnitRepresent}
					{toggleButton}
				</div>
			);
		} else {
			return (
				<div>
					{this.state.unitRepresentInput}
					{toggleButton}
				</div>
			);
		}
    }

    private formatSecInRateInput(){
        let formattedSecInRate;
        let buttonMessageId;
        if(this.state.secInRateFocus){
            formattedSecInRate = <input
                type = 'number'
                id = {'secInRate'}
                autoFocus
                value={this.state.secInRateInput}
                onChange={event => this.handleSecInRateChange(event)}
            />;
            buttonMessageId = 'update';
        } else {
            formattedSecInRate = <div>{this.state.secInRateInput}</div>
            buttonMessageId = 'edit';
        }

        let toggleButton;
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        if (loggedInAsAdmin) {
            toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleSecInRateInput}>
                <FormattedMessage id={buttonMessageId} />
            </Button>;
        } else {
            toggleButton = <div />;
        }

        if (loggedInAsAdmin) {
            return (
                <div>
                    {formattedSecInRate}
                    {toggleButton}
                </div>
            );
        } else {
            return (
                <div>
                    {this.state.secInRateInput}
                    {toggleButton}
                </div>
            );
        }
    }
}
export default injectIntl(UnitViewComponent);
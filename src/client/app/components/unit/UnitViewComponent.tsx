import * as React from 'react'; 
import {Button} from 'reactstrap'; 
import { UnitData, EditUnitDetailsAction} from '../../types/redux/unit';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { confirmEditedUnits, fetchUnitsDetails, submitEditedUnits } from '../../actions/unit';
import { updateUnsavedChanges } from '../../actions/unsavedWarning';
import store from '../../index';



interface UnitViewProps {
    id: number; 
    unit: UnitData;
    isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;

    editUnitDetails(unit: UnitData): EditUnitDetailsAction; 
}

interface UnitViewState {
	identifierFocus: boolean;
	identifierInput: string;
  secInRateFocus: boolean;
	secInRateInput: number;
}

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState> {
    constructor(props: UnitViewPropsWithIntl){
        super(props); 
        this.state = {
           secInRateFocus: false,
	        secInRateInput: this.props.unit.secInRate,
          identifierFocus: false,
			    identifierInput: this.props.unit.identifier
        };
        this.toggleSecInRateInput = this.toggleSecInRateInput.bind(this);
        this.handleSecInRateChange = this.handleSecInRateChange.bind(this);
        this.toggleIdentifierInput = this.toggleIdentifierInput.bind(this);
        this.handleIdentifierChange = this.handleIdentifierChange.bind(this);
    }
    public render() {
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        return (
            <tr>
                {loggedInAsAdmin && <td> {this.props.unit.id} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.name} {this.formatStatus()} </td>}
				<td> {this.unitIdentifierInput()} </td>
                {loggedInAsAdmin && <td> {this.props.unit.unitRepresent} {this.formatStatus()} </td>}
                {/* {loggedInAsAdmin && <td> {this.props.unit.secInRate} {this.formatStatus()} </td>} */}
                <td> {this.formatSecInRateInput()} </td>
                {loggedInAsAdmin && <td> {this.props.unit.typeOfUnit} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.suffix} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.displayable} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.preferredDisplay} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.note} {this.formatStatus()} </td>}
            </tr>
        );
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

    private handleSecInRateChange(event: React.ChangeEvent<HTMLTextAreaElement>){
        this.setState({ secInRateInput: parseInt(event.target.value)}); //converts string to number
    }

    private formatSecInRateInput(){
        let formattedSecInRate;
        let buttonMessageId;
        if(this.state.secInRateFocus){
            formattedSecInRate = <textarea
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
			this.props.editUnitDetails(editedUnit);
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

    private formatStatus(): string {
		if (this.props.isSubmitting) {
			return '(' + this.props.intl.formatMessage({id: 'submitting'}) + ')';
		}

		if (this.props.isEdited) {
			return this.props.intl.formatMessage({id: 'edited'});
		}

		return '';
	}

    private styleEnabled(): React.CSSProperties {
		return { color: 'green' };
	}

	private styleDisabled(): React.CSSProperties {
		return { color: 'red' };
	}

}
export default injectIntl(UnitViewComponent);
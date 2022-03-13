import * as React from 'react'; 
import {Button} from 'reactstrap'; 
import { UnitData } from '../../types/redux/unit';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';



interface UnitViewProps {
    id: number; 
    unit: UnitData;
    isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;

    //editUnitDetails(unit: UnitMetadata): EditUnitDetailsAction;
}

interface UnitViewState {
	secInRateFocus: boolean;
	secInRateInput: number; //Need to convert from string to number
}

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState> {
    constructor(props: UnitViewPropsWithIntl){
        super(props); 
        this.state = {
            secInRateFocus: false,
	        secInRateInput: this.props.unit.secInRate
        };
        this.toggleSecInRateInput = this.toggleSecInRateInput.bind(this);
        this.handleSecInRateChange = this.handleSecInRateChange.bind(this);
    }
    public render() {
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        return (
            <tr>
                {loggedInAsAdmin && <td> {this.props.unit.id} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.name} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.identifier} {this.formatStatus()} </td>}
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

	private styleToggleBtn(): React.CSSProperties {
		return { float: 'right' };
	}
}
export default injectIntl(UnitViewComponent);
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

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

interface UnitViewState {
    unitRepresentFocus: boolean;
    unitRepresentInput: string;
}

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState> {
    constructor(props: UnitViewPropsWithIntl){
        super(props); 
        this.state = {
            unitRepresentFocus: false,
            unitRepresentInput: this.props.unit.unitRepresent
        }
        this.handleUnitRepresentChange = this.handleUnitRepresentChange.bind(this);
        this.toggleUnitRepresentInput = this.toggleUnitRepresentInput.bind(this);
    }
    public render() {
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        return (
            <tr>
                {loggedInAsAdmin && <td> {this.props.unit.id} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.name} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.identifier} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.formatUnitRepresentInput()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.secInRate} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.typeOfUnit} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.suffix} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.displayable} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.preferredDisplay} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.note} {this.formatStatus()} </td>}
            </tr>
        );
    }

    private styleToggleBtn(): React.CSSProperties {
		return { float: 'right' };
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
        toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleUnitRepresentInput}>
            <FormattedMessage id={buttonMessageId} />
        </Button>
        return(<div>
            {formattedUnitRepresent}
            {toggleButton}
        </div>)
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
}
export default injectIntl(UnitViewComponent);
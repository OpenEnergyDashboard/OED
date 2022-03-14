import * as React from 'react'; 
import {Button} from 'reactstrap'; 
import { UnitData } from '../../types/redux/unit';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { UnitMetadata, UnitsAction } from '../../types/redux/unit';


interface UnitViewProps {
    id: number; 
    unit: UnitData;
    isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;

   // editUnitDetails(unit: UnitMetadata): UnitsAction;
}

interface UnitViewState {
	noteFocus: boolean;
	noteInput: string;
}

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState> {
    constructor(props: UnitViewPropsWithIntl){
        super(props); 
        this.state = {
            noteFocus: false,
            noteInput: this.props.unit.note
        };
       this.toggleNoteInput = this.toggleNoteInput.bind(this);
       this.handleNoteChange = this.handleNoteChange.bind(this);
    }
    public render() {
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        return (
            <tr>
                {loggedInAsAdmin && <td> {this.props.unit.id} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.name} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.identifier} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.unitRepresent} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.secInRate} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.typeOfUnit} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.suffix} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.displayable} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.preferredDisplay} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.formatNoteInput()} </td>}
                
            </tr>
        );
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
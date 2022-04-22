import * as React from 'react';
import { Button } from 'reactstrap';
import { UnitData, EditUnitDetailsAction } from '../../types/redux/units';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { confirmEditedUnits, fetchUnitsDetails, submitEditedUnits } from '../../actions/units';
import { updateUnsavedChanges } from '../../actions/unsavedWarning';
import store from '../../index';
import ModalCard from './UnitModalEditComponent'
import '../../styles/unit-card-page.css'
import { unitsApi } from '../../utils/api';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import { browserHistory } from '../../utils/history';

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
    noteFocus: boolean;
    noteInput?: string;
    show: boolean;
    onHide: boolean;
    // editUnitDetails(unit: UnitData): EditUnitDetailsAction;
}

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, UnitViewState> {
    constructor(props: UnitViewPropsWithIntl) {
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
            show: false,
            onHide: true,
        };
        //this.submitEditUnit = this.submitEditUnit.bind(this);
        this.toggleSecInRateInput = this.toggleSecInRateInput.bind(this);
        this.handleSecInRateChange = this.handleSecInRateChange.bind(this);
        this.toggleIdentifierInput = this.toggleIdentifierInput.bind(this);
        this.handleUnitRepresentChange = this.handleUnitRepresentChange.bind(this);
        this.toggleUnitRepresentInput = this.toggleUnitRepresentInput.bind(this);
        this.toggleNoteInput = this.toggleNoteInput.bind(this);
        this.handleNoteChange = this.handleNoteChange.bind(this);
        this.checkPreferredDisplay = this.checkPreferredDisplay.bind(this);
    }
    handleShow = () => {
        this.setState({ show: true });
    }

    handleClose = () => {
        this.setState({ show: false });
    }
    onSubmitClicked() {
        console.log("on submit clicked 100");
		// this.props.submitEditedUnits();
        //this.submitUnsavedChangesFunction();
		// Notify that the unsaved changes have been submitted
		//this.removeUnsavedChanges();
	}
    public render() {
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        return (
            <div className="card">
                <div className="identifier-container">
                    {this.props.unit.name}
                </div>
                <div className="unit-container">
                    <b>Unit Identifer:</b> {this.formatIdentifierUnitInput()}
                </div>
                {/* <div className="unit-container">
                    <b>Unit Represent:</b> {this.formatUnitRepresentInput()}
                </div>
                <div className="unit-container">
                    <b>Sec In Rate:</b> {this.formatSecInRateInput()}
                </div> */}

                {this.isAdmin()}
                {/* {loggedInAsAdmin && <div className="edit-btn">
                    <ModalCard name={this.props.unit.name} identifier={this.props.unit.identifier}
                        unitRepresent={this.props.unit.unitRepresent} secInRate={this.props.unit.secInRate}
                        typeOfUnit={this.props.unit.typeOfUnit} unitIndex={this.props.unit.unitIndex}
                        suffix={this.props.unit.suffix} displayable={this.props.unit.displayable}
                        preferredDisplay={this.props.unit.preferredDisplay} note={this.props.unit.note}
                        handleUnitIdentifierChange={this.handleUnitIdentifierChange} 
                        submitEditUnit={this.submitEditUnit}/>
                </div>} */}
            </div>
            // <tr>
            //     {loggedInAsAdmin && <td> {this.props.unit.id} {this.formatStatus()} </td>}
            //     {loggedInAsAdmin && <td> {this.props.unit.name}</td>}
            // 	<td> {this.unitIdentifierInput()} </td>
            //     {/* {loggedInAsAdmin && <td> {this.props.unit.unitRepresent}</td>} */}
            //     <td> {this.formatUnitRepresentInput()} </td>
            //     {/* {loggedInAsAdmin && <td> {this.props.unit.secInRate}</td>} */}
            //     <td> {this.formatSecInRateInput()} </td>
            //     {loggedInAsAdmin && <td> {this.props.unit.typeOfUnit}</td>}
            //     {loggedInAsAdmin && <td> {this.props.unit.suffix}</td>}
            //     {loggedInAsAdmin && <td> {this.props.unit.displayable}</td>}
            //     {loggedInAsAdmin && <td> {this.checkPreferredDisplay()}</td>}
            //     {loggedInAsAdmin && <td> {this.props.unit.note}</td>}
            // </tr>
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
                        onSaveChanges={this.onSaveChanges} />
                </div>
            )
        }
        return null;
    }
    onSaveChanges = (newIdentifer: string) => {
        console.log(newIdentifer);
        this.setState({ identifierInput: newIdentifer });
        console.log("1. " + this.state.identifierInput);
        console.log(this.state.identifierFocus);
        this.setState({ identifierFocus: !this.state.identifierFocus });
        console.log(this.state.identifierFocus);
        this.toggleIdentifierInput();
        //this.updateUnsavedChanges();
        console.log("100. " + this.props.unit.identifier);
        this.props.onSubmitClicked();
    }

    private formatIdentifierUnitInput() {
        let formattedIdentifier;
        //let buttonMessageId;
        if (this.state.identifierFocus) {
            formattedIdentifier = <textarea
                id={'identifier'}
                autoFocus
                value={this.state.identifierInput}
                onChange={event => this.handleIdentifierChange(event)}
            />;
            //buttonMessageId = 'update';
        } else {
            formattedIdentifier = <div>{this.state.identifierInput}</div>;
            //buttonMessageId = 'edit';
        }

        //let toggleButton;
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        // if (loggedInAsAdmin) {
        //     toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleIdentifierInput}>
        //         <FormattedMessage id={buttonMessageId} />
        //     </Button>;
        // } else {
        //     toggleButton = <div />;
        // }

        if (loggedInAsAdmin) {
            return ( // add onClick
                <div>
                    {formattedIdentifier}
                    {/* {{toggleButton}} */}
                </div>
            );
        } else {
            return (
                <div>
                    {this.state.identifierInput}
                    {/* {{toggleButton}} */}
                </div>
            );
        }
    }

    private formatUnitRepresentInput() {
        let formattedUnitRepresent;
        //let buttonMessageId;
        if (this.state.unitRepresentFocus) {
            formattedUnitRepresent = <textarea
                id={'unitRepresent'}
                autoFocus
                value={this.state.unitRepresentInput}
                onChange={event => this.handleIdentifierChange(event)}
            />
            // formattedUnitRepresent = <select
            //     id={'unitRepresent'}
            //     value={this.state.unitRepresentInput}
            //     onChange={event => this.handleUnitRepresentChange(event)}>
            //     <option value="quantity">Quantity</option>
            //     <option value="flow">Flow</option>
            //     <option value="raw">Raw</option>
            //     <option value="unused">Unused</option>
            // </select>
            //buttonMessageId = 'update';
        } else {
            formattedUnitRepresent = <div>{this.state.unitRepresentInput}</div>
            //buttonMessageId = 'edit';
        }

        const loggedInAsAdmin = this.props.loggedInAsAdmin;

        if (loggedInAsAdmin) {
            return ( // add onClick
                <div>
                    {formattedUnitRepresent}
                    {/* {{toggleButton}} */}
                </div>
            );
        } else {
            return (
                <div>
                    {this.state.unitRepresentInput}
                    {/* {{toggleButton}} */}
                </div>
            );
        }

        //let toggleButton;
        //const loggedInAsAdmin = this.props.loggedInAsAdmin;
        // if (loggedInAsAdmin) {
        //     toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleUnitRepresentInput}>
        //         <FormattedMessage id={buttonMessageId} />
        //     </Button>;
        // } else {
        //     toggleButton = <div />
        // }

        // if (loggedInAsAdmin) {
        //     return ( // add onClick
        //         <div>
        //             {formattedUnitRepresent}
        //             {toggleButton}
        //         </div>
        //     );
        // } else {
        //     return (
        //         <div>
        //             {this.state.unitRepresentInput}
        //             {toggleButton}
        //         </div>
        //     );
        // }
    }

    private formatSecInRateInput() {
        let formattedSecInRate;
        //let buttonMessageId;
        if (this.state.secInRateFocus) {
            formattedSecInRate = <input
                type='number'
                id={'secInRate'}
                autoFocus
                value={this.state.secInRateInput}
                onChange={event => this.handleSecInRateChange(event)}
            />;
            //buttonMessageId = 'update';
        } else {
            formattedSecInRate = <div>{this.state.secInRateInput}</div>
            //buttonMessageId = 'edit';
        }

        //let toggleButton;
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        // if (loggedInAsAdmin) {
        //     toggleButton = <Button style={this.styleToggleBtn()} color='primary' onClick={this.toggleSecInRateInput}>
        //         <FormattedMessage id={buttonMessageId} />
        //     </Button>;
        // } else {
        //     toggleButton = <div />;
        // }

        if (loggedInAsAdmin) {
            return (
                <div>
                    {formattedSecInRate}
                    {/* {toggleButton} */}
                </div>
            );
        } else {
            return (
                <div>
                    {this.state.secInRateInput}
                    {/* {toggleButton} */}
                </div>
            );
        }
    }

    private formatNoteInput() {
        let formattedNote;
        let buttonMessageId;
        if (this.state.noteFocus) {
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

    private formatDisplayable() {
        let messageId;
        let displaySwitch;

        if (this.props.unit.displayable) {
            messageId = 'unit.is.displayable';
            displaySwitch = <span className="on-off-switch-span-on"><FormattedMessage id={messageId} /></span>
        } else {
            messageId = 'unit.is.not.displayable';
            displaySwitch = <span className="on-off-switch-span-off"><FormattedMessage id={messageId} /></span>
        }
        return (
            displaySwitch
        );
    }

    private checkPreferredDisplay() {
        if (this.props.unit.preferredDisplay) {
            return (
                "true"
            )
        } else {
            return (
                "false"
            )
        }
    }

    private handleUnitRepresentChange(event: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ unitRepresentInput: event.target.value });
    }

    private toggleUnitRepresentInput() {
        if (this.state.unitRepresentFocus) {
            const unitRepresent = this.state.unitRepresentInput;

            const editedUnit = {
                ...this.props.unit,
                unitRepresent
            };
            // this.props.editUnitDetails(editedUnit);
        }
        this.setState({ unitRepresentFocus: !this.state.unitRepresentFocus });
    }

    private handleSecInRateChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ secInRateInput: parseInt(event.target.value) }); //converts string to number
    }

    private toggleSecInRateInput() {
        if (this.state.secInRateFocus) {
            const secInRate = this.state.secInRateInput;

            const editedUnit = {
                ...this.props.unit,
                secInRate
            };
            //this.props.editUnitDetails(editedUnit) //Needs editUnitDetails function used to dispatch the action to edit unit details (refer to line #24 on MeterViewComponent.tsx)
        }
        this.setState({ secInRateFocus: !this.state.secInRateFocus });
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

    private handleNoteChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        this.setState({ noteInput: event.target.value });
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

    private removeUnsavedChangesFunction(callback: () => void) {
        // This function is called to reset all the inputs to the initial state
        console.log("remove unsaved changes function");
        store.dispatch<any>(confirmEditedUnits()).then(() => {
            store.dispatch<any>(fetchUnitsDetails()).then(callback);
        });
    }

    private submitUnsavedChangesFunction(successCallback: () => void, failureCallback: () => void) {
        // This function is called to submit the unsaved changes
        console.log("submit unsaved changes function");
        store.dispatch<any>(submitEditedUnits()).then(successCallback, failureCallback);
    }

    private updateUnsavedChanges() {
        // Notify that there are unsaved changes
        console.log("update unsaved changes");
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
            return '(' + this.props.intl.formatMessage({ id: 'submitting' }) + ')';
        }

        if (this.props.isEdited) {
            return this.props.intl.formatMessage({ id: 'edited' });
        }

        return '';
    }
}


export default injectIntl(UnitViewComponent);
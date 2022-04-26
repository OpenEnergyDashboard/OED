import * as React from "react";
import { Modal, Button, Dropdown } from "react-bootstrap";
import '../../styles/unit-edit-modal.css';
import { UnitData, EditUnitDetailsAction, DisplayableType, UnitRepresentType, UnitType } from "../../types/redux/units";
import { Input } from 'reactstrap';

interface EditUnitProps {
  unit: UnitData;
  onhide: () => void;
  editUnitDetails(unit: UnitData): EditUnitDetailsAction;
  show: boolean;
  name: string;
  identifier: string;
  unitRepresent: UnitRepresentType;
  secInRate: number;
  typeOfUnit: UnitType;
  unitIndex: number;
  suffix: string;
  displayable: DisplayableType;
  preferredDisplay: boolean;
  note: string;
}

type UnitViewPropsWithIntl = EditUnitProps;

class UnitModelEditComponent extends React.Component<UnitViewPropsWithIntl,
  {
    show: boolean, nameInput: string, identifierInput: string,
    identifier: string, identifierFocus: boolean, unitRepresent: UnitRepresentType,
    typeOfUnit: UnitType, displayable: DisplayableType, secInRate: number, preferredDisplay: boolean,
    suffix: string, note: string
  }>{

  constructor(props: UnitViewPropsWithIntl) {
    super(props);
    this.state = {
      show: this.props.show,
      nameInput: this.props.name,
      identifier: this.props.identifier,
      identifierInput: this.props.identifier,
      identifierFocus: false,
      typeOfUnit: this.props.typeOfUnit,
      unitRepresent: this.props.unitRepresent,
      displayable: this.props.displayable,
      secInRate: this.props.secInRate,
      preferredDisplay: this.props.preferredDisplay,
      suffix: this.props.suffix,
      note: this.props.note
    };
  }

  render() {
    return (
      <>
        <Modal show={this.props.show} onHide={this.props.onhide}>
          <Modal.Header closeButton>
            <Modal.Title> Edit Unit Information</Modal.Title>
          </Modal.Header>

          <Modal.Body className="show-grid">
            <div id="container">
              <div id="modalChild">
                {this.isIdentifier(this.props.identifier)}
                {this.isTypeOfUnit(this.props.typeOfUnit)}
                {this.isUnitRepresent(this.props.unitRepresent)}
                {this.isDisplayableType(this.props.displayable)}
                {this.isSecInRate(this.props.secInRate)}
                {this.isPreferredDisplayable(this.props.preferredDisplay)}
                {this.isSuffix(this.props.suffix)}
                {this.isNote(this.props.note)}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.props.onhide}>
              Close
            </Button>
            {/* <Button variant="primary" onClick={() => this.props.onSaveChanges(this.state.identifierInput,
              this.state.unitRepresent, this.state.typeOfUnit, this.state.displayable, this.state.secInRate,
              this.state.preferredDisplay, this.state.suffix, this.state.note)}>
             Save Changes
            </Button> */}
            <Button variant="primary" onClick={() => this.onSaveChanges()}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  private onSaveChanges() {
    const oldIdentifer = this.props.unit.identifier; 
    const oldunitRepresentType = this.props.unit.unitRepresent; 
    const oldTypeOfUnit = this.props.unit.typeOfUnit;
    const oldDisplayable = this.props.unit.displayable;
    const oldPreferredDisplay = this.props.unit.preferredDisplay;
    const oldSuffix = this.props.unit.suffix.toString();
    const oldNote = this.props.unit.note;
    console.log(oldNote);
    console.log(this.state.note);
    if (oldIdentifer != this.state.identifierInput || oldunitRepresentType != this.state.unitRepresent || 
      oldTypeOfUnit != this.state.typeOfUnit || oldDisplayable != this.state.displayable || 
      oldPreferredDisplay != this.state.preferredDisplay || oldSuffix != this.state.suffix ||
      oldNote != this.state.note) {
      console.log("hold on")
      const identifier = this.state.identifierInput;
      const unitRepresent = this.state.unitRepresent as UnitRepresentType;
      const typeOfUnit = this.state.typeOfUnit as UnitType;
      const displayable = this.state.displayable as DisplayableType;
      const preferredDisplay = this.state.preferredDisplay;
      const suffix = this.state.suffix;
      const note = this.state.note;

      const editedUnit = {
        ...this.props.unit,
        identifier, unitRepresent, typeOfUnit,
        displayable, preferredDisplay, suffix, note
      };
      console.log(editedUnit); 
      this.props.editUnitDetails(editedUnit);
      this.props.onhide(); 
    }
  }

  private handleIdentifier(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ identifierInput: event.target.value });
  }

  private handleTypeOfUnitChange(event: React.ChangeEvent<HTMLInputElement>) {
    const TypeOfUnit = event.target.value as UnitType;
    this.setState({ typeOfUnit: TypeOfUnit });
  }

  private handleUnitRepresentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const unitRepresent = event.target.value as UnitRepresentType;
    this.setState({ unitRepresent: unitRepresent });
  }

  private handleDisplayableChange(event: React.ChangeEvent<HTMLInputElement>) {
    const displayable = event.target.value as DisplayableType;
    this.setState({ displayable: displayable });
  }

  private handlePreferredDisplayableChange(event: React.ChangeEvent<HTMLInputElement>) {
    const preferredDisplayable = JSON.parse(event.target.value);
    console.log(preferredDisplayable); 
    console.log(typeof(preferredDisplayable)); 
    this.setState({ preferredDisplay: preferredDisplayable });
  }

  private handleSuffixChange(event: React.ChangeEvent<HTMLInputElement>) {
    console.log(event.target.value);
    this.setState({ suffix: event.target.value });
  }

  private handleNoteChange(event: React.ChangeEvent<HTMLInputElement>) {
    console.log(event.target.value); 
    this.setState({ note: event.target.value });
  }

  private isIdentifier(identifier: string) {
    return (
      <div>
        Identifier: <span><br /><input type="text" defaultValue={identifier}
          placeholder="Identifier" onChange={event => this.handleIdentifier(event)} /></span>
      </div>
    )
  }

  private isTypeOfUnit(typeOfUnit: UnitType) {
    return (
      <div>
        <label>Type of Unit: </label>
        <Input type='select' defaultValue = {typeOfUnit} 
        onChange={event => this.handleTypeOfUnitChange(event)}>
          <option value="unit"> unit </option>
          <option value="meter">meter</option>
          <option value="suffix">suffix</option>
        </Input>
      </div>
    )
  }

  private isUnitRepresent(unitRepresent: UnitRepresentType) {
    return (
      <div>
        <label>Unit Represent: </label>
        <Input type='select' defaultValue = {unitRepresent} 
        onChange={event => this.handleUnitRepresentChange(event)}>
          <option value="quantity"> quantity </option>
          <option value="flow">flow</option>
          <option value="raw">raw</option>
          <option value="unused">unused</option>
        </Input>
      </div>
    )
  }

  private isDisplayableType(displayable: DisplayableType) {
    return (
      <div>
        <label>Displayable: </label>
        <Input type='select' defaultValue = {displayable} 
        onChange={event => this.handleDisplayableChange(event)}>
          <option value="none"> none </option>
          <option value="all">all</option>
          <option value="admin">admin</option>
        </Input>
      </div>
    )
  }

  private isSecInRate(secInRate: number) {
    return (
      <div>
        Sec In Rate: <span><br /><input type="number" defaultValue={secInRate}
          placeholder="Sec In Rate" /></span>
      </div>
    )
  }

  private isPreferredDisplayable(preferredDisplay: boolean) {
    return (
      <div>
        <label>Preferred Displayable: </label>
        <Input type='select' defaultValue={preferredDisplay.toString()} 
        onChange={event => this.handlePreferredDisplayableChange(event)}>
          <option value="true"> Yes </option>
          <option value="false"> No </option>
        </Input>
      </div>
    )
  }

  private isSuffix(suffix: string) {
    return (
      <div>
        <label>Suffix: </label>
        <input type="text" defaultValue = {suffix} placeholder="Suffix"
          onChange={event => this.handleSuffixChange(event)} />
      </div>
    )
  }

  private isNote(note: string) {
    return (
      <div>
        <label>Note: </label>
        <input type="text" defaultValue = {note} placeholder="Note"
          onChange={event => this.handleNoteChange(event)} />
      </div>
    )
  }
}

export default UnitModelEditComponent;
import { useState } from "react";
import * as React from "react";
import { Modal, Button, Dropdown } from "react-bootstrap";
import '../../styles/unit-edit-modal.css';
import { DisplayableType, UnitRepresentType, UnitType } from "../../types/redux/units";
interface EditUnitProps {
  show: boolean; 
  onhide: () => void;
  onSaveChanges: (identifier: string) => void;
  name: string;
  identifier: string;
  unitRepresent: UnitRepresentType;
  secInRate: number;
  typeOfUnit: UnitType;
  unitIndex: number;
  suffix: string;
  displayable: DisplayableType;
  preferredDisplay: boolean;
  note?: string;
  //submitEditUnit: () => void;
  //handleUnitIdentifierChange: (val : string) => void;
}

type UnitViewPropsWithIntl = EditUnitProps;

class UnitModelEditComponent extends React.Component<UnitViewPropsWithIntl,
{show: boolean, nameinput: string, identifierinput: string, identifier: string}>{

  constructor(props: UnitViewPropsWithIntl){
    super(props);
    this.state = {
      show: this.props.show, 
      nameinput: this.props.name, 
      identifier: this.props.identifier,
      identifierinput: this.props.identifier
    };
  }

  identifierInput() {
    this.props.onhide();
    var identifier = this.state.identifierinput;
    return identifier;
  }

  // const [showModal, setShow] = useState(false);

  // const handleClose = () => setShow(false);
  // const handleShow = () => setShow(true);

  render(){
    return (
      <>
        {/* <Button variant="Secondary" onClick={handleShow}>
          Edit Unit
        </Button> */}
  
        <Modal show={this.props.show} onHide={this.props.onhide}>
          <Modal.Header closeButton>
            <Modal.Title> Edit Unit Information</Modal.Title>
          </Modal.Header>
  
          <Modal.Body className="show-grid">
            <div id="container">
              <div id="modalChild">
                {this.isIdentifier(this.props.identifier)}
                {/* <div>
                  Unit Identifier: <span><br /><input type="text" defaultValue={props.identifier}
                  onChange={({target})=> props.handleUnitIdentifierChange(target.value)}/></span>
                </div> */}
  
                {/* <div>
                  Unit-Type
                  <Dropdown>
                    <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
                      Select
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                      <Dropdown.Item active>
                        Action
                      </Dropdown.Item>
                      <Dropdown.Item >unit</Dropdown.Item>
                      <Dropdown.Item >meter</Dropdown.Item>
                      <Dropdown.Item >none</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
  
                <div>
                  Units Represent Type: <span>
                    <Dropdown>
                      <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
                        Select
                      </Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item active>
                          Action
                        </Dropdown.Item>
                        <Dropdown.Item >quantity</Dropdown.Item>
                        <Dropdown.Item >flow</Dropdown.Item>
                        <Dropdown.Item >raw</Dropdown.Item>
                        <Dropdown.Item >unused </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </span>
                </div>
  
                <div>
                  Displayable-type: <span>
                    <Dropdown>
                      <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
                        Select
                      </Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item active>
                          Action
                        </Dropdown.Item>
                        <Dropdown.Item >all</Dropdown.Item>
                        <Dropdown.Item >admin</Dropdown.Item>
                        <Dropdown.Item >none</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </span>
                </div>
  
                <div>
                  Sec In Rate: <span><br /><input type="number" value="Filler Information" autoFocus /></span>
                </div>
  
                <div>
                  Suffix: <span><br /><input type="text" value="Filler Information" autoFocus /></span>
                </div>
  
                <div>
                  Displayable: <span><input type="checkbox" /></span>
                </div>
  
                <div>
                  Preferred Displayable: <span><input type="checkbox" /></span>
                </div>
  
                <div>
                  Notes:<br /> <input type="text" value="Filler Information" autoFocus />
                </div> */}
  
              </div>
            </div>
          </Modal.Body>
  
          <Modal.Footer>
            <Button variant="secondary" onClick={this.props.onhide}>
              Close
            </Button>
            <Button variant="primary" onClick={() => this.props.onSaveChanges(this.state.identifierinput)}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
  private handleIdentifier(event: React.ChangeEvent<HTMLInputElement>) {
    console.log(event.target.value);
    this.setState({identifierinput: event.target.value});
    console.log('120 ' + this.state.identifierinput);
  }

  private isIdentifier(identifier: string) {
    return(
      <div>
        Identifier: <span><br/><input type="text" defaultValue={identifier} placeholder="Identifier" onChange={event => this.handleIdentifier(event)}/></span>
      </div>
    )
  }
}


export default UnitModelEditComponent;


import { useState } from "react";
import * as React from "react";
import { Modal, Button, Dropdown } from "react-bootstrap";
import '../../styles/unit-edit-modal.css';
import { DisplayableType, UnitRepresentType, UnitType } from "../../types/redux/units";
interface modelcardprops {
  id: number;
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
}

function ModalCard() {
  const [showModal, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button variant="Secondary" onClick={handleShow}>
        Edit Unit
      </Button>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title> Edit Unit Information</Modal.Title>
        </Modal.Header>

        <Modal.Body className="show-grid">
          <div id="container">
            <div id="modalChild">
              <div>
                Unit Identifier: <span><br /><input type="text" value="filled in info" autoFocus /></span>
              </div>

              <div>
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
              </div>

            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}


export default ModalCard;
import  { useState } from "react";
import * as React from "react";
import { Modal, Button, Dropdown } from "react-bootstrap";
import '../../styles/meter-edit-modal.css';

function ModalCard() {
const [showModal, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
        <Button variant="Secondary" onClick={handleShow}>
          Edit Meter
        </Button>
      
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title> Edit Meter Information</Modal.Title>
        </Modal.Header>

        <Modal.Body className="show-grid">
          <div id="container">
            <div id="modalChild">
              <div>
              Identifier: <span><br/><input type="text" value="filled in info" autoFocus /></span>
              </div>

              <div>
                Units: <span> 
                  <Dropdown>
                  <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
                  Dropdown Button
                </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                      <Dropdown.Item active>
                        Action
                      </Dropdown.Item>
                      <Dropdown.Item >option1</Dropdown.Item>
                      <Dropdown.Item >Something else</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item >other option </Dropdown.Item>
                  </Dropdown.Menu>
                  </Dropdown>
                  </span>
              </div>

              <div>
                Meter-Type: <span>
                  <Dropdown>
                  <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
                    Dropdown Button
                  </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                      <Dropdown.Item active>
                        Action
                      </Dropdown.Item>
                      <Dropdown.Item >option1</Dropdown.Item>
                      <Dropdown.Item >Something else</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item >other option </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  </span>
              </div>

              <div>
              Graphic Units: 
                  <Dropdown>
                  <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm"variant="secondary">
                    Dropdown Button
                  </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                      <Dropdown.Item active>
                        Action
                      </Dropdown.Item>
                      <Dropdown.Item >option1</Dropdown.Item>
                      <Dropdown.Item >Something else</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item >other option </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
              </div>

              <div>
                GPS: <span><br/><input type="text" value="Filler Information" autoFocus/></span>
              </div>

              <div>
                Area: <span><br/><input type="text" value="Filler Information" autoFocus/></span>
              </div>

              <div>
                Displayable: <span><input type="checkbox"/></span>
              </div>

              <div>
                Enabled: <span><input type="checkbox"/></span>
              </div>

              <div>
                Meter Address: <span><br/><input type="text" value="Filler Information" autoFocus/></span>
              </div>

              <div>
                Timezones:
                <span> 
                  <Dropdown>
                  <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
                  EST/PST/CST
                </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark">
                      <Dropdown.Item active>
                        Action
                      </Dropdown.Item>
                      <Dropdown.Item >option1</Dropdown.Item>
                      <Dropdown.Item >Something else</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item >other option </Dropdown.Item>
                  </Dropdown.Menu>
                  </Dropdown>
                  </span>
              </div>
              <div>
                Notes:<br/> <input type="text" value="Filler Information" autoFocus/>
              </div>

            </div>
              <div id="modalChild">
                <div>
                  Cumulative: <input type="checkbox"/>
                </div>

                <div>
                  Cumulative Reset: <input type="checkbox"/>
                </div>

                <div>
                  Reset Start-Time: <br/> <input type="text" value="00:00:00" autoFocus/>
                </div>
                <div>
                  Time Sort: <input type="checkbox"/>
                </div>
                
                <div>
                  End Only: <input type="checkbox"/>
                </div>

                <div>
                  Read Gap: <br/> <input type="text" value="Filler Information"/>
                </div>

                <div>
                  Reading Variation: <br/> <input type="text" value="Filler Information"/>
                </div>
                
                <div>
                  Reading Duplication: <br/> 
                  <span> 
                    <Dropdown>
                    <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
                    Filler Information
                  </Dropdown.Toggle>
                      <Dropdown.Menu variant="dark">
                        <Dropdown.Item active>
                          Action
                        </Dropdown.Item>
                        <Dropdown.Item >option1</Dropdown.Item>
                        <Dropdown.Item >Something else</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item >other option </Dropdown.Item>
                    </Dropdown.Menu>
                    </Dropdown>
                    </span>
                </div>

                <div>
                  Reading:
                </div>

                <div>
                  Start Date/Time:<br/> <input type="text" value="Filler Information"/>
                </div>

                <div>
                  End Date/Time:<br/> <input type="text" value="Filler Information"/>
                </div>
                <div>
                  ID: <br/><input type="text" readOnly value="00"/>
                </div>

                <div>
                  Name of Meter: <br/> <input type="text" value="Filler Meter Name"/> 
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
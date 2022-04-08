import  { useState } from "react";
import * as React from "react";
import { Modal, Button, Dropdown } from "react-bootstrap";
import '../../styles/unit-add-modal.css';

function ModalCard() {
const [showModal, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
        <Button variant="Secondary" onClick={handleShow}>
          Create Unit
        </Button>
      
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title> Create Meter</Modal.Title>
        </Modal.Header>

        <Modal.Body className="show-grid">
          <div id="container">
            <div id="modalChild">
                {/* TODO: NEEDS FORM CONTENT */}
                stuff goes here
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
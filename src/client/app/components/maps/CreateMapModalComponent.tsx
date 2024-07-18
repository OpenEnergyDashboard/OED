import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { Link } from 'react-router-dom';
import { CalibrationModeTypes } from '../../types/redux/map';

interface CreateMapModalProps {
	show: boolean;
	handleClose: () => void;
	createNewMap: () => void;
}

/**
 *
 */
function CreateMapModalComponent({ show, handleClose, createNewMap }: CreateMapModalProps) {
	const [nameInput, setNameInput] = useState('');
	const [noteInput, setNoteInput] = useState('');

	const handleCreate = () => {
		// TODO: Implement create functionality
		createNewMap();
		handleClose();
	};

	return (
		<Modal isOpen={show} toggle={handleClose}>
			<ModalHeader toggle={handleClose}>
				<FormattedMessage id="create.map" />
			</ModalHeader>
			<ModalBody>
				<Form>
					<FormGroup>
						<Label for="mapName"><FormattedMessage id="map.name" /></Label>
						<Input
							id="mapName"
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="mapNote"><FormattedMessage id="note" /></Label>
						<Input
							id="mapNote"
							type="textarea"
							value={noteInput}
							onChange={(e) => setNoteInput(e.target.value)}
						/>
					</FormGroup>
				</Form>
				<div>
					<Link to='/calibration' onClick={() => createNewMap()}>
						<Button color='primary'>
							<FormattedMessage id='map.upload.file' />
						</Button>
					</Link>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" onClick={handleClose}>
					<FormattedMessage id="cancel" />
				</Button>
				<Button color="primary" onClick={handleCreate}>
					<FormattedMessage id="create" />
				</Button>
			</ModalFooter>
		</Modal>
	);
}

export default CreateMapModalComponent;
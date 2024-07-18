/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { Link } from 'react-router-dom';

interface CreateMapModalProps {
	show: boolean;
	handleClose: () => void;
	createNewMap: () => void;
}

/**
 * Defines the create map modal form
 * @returns Map create element
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
							onChange={e => setNameInput(e.target.value)}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="mapNote"><FormattedMessage id="note" /></Label>
						<Input
							id="mapNote"
							type="textarea"
							value={noteInput}
							onChange={e => setNoteInput(e.target.value)}
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
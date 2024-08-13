/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { debounce, isEqual } from 'lodash';
import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { mapsApi, selectMapById } from '../../redux/api/mapsApi';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { localEditsSlice } from '../../redux/slices/localEditsSlice';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { showErrorNotification } from '../../utils/notifications';

interface EditMapModalProps {
	map: MapMetadata;
}

// TODO: Migrate to RTK
const EditMapModalComponent: React.FC<EditMapModalProps> = ({ map }) => {
	const [showModal, setShowModal] = useState(false);
	const dispatch = useAppDispatch();
	const [nameInput, setNameInput] = useState(map.name);
	const [noteInput, setNoteInput] = useState(map.note || '');
	const [circleInput, setCircleInput] = useState(map.circleSize);
	const [displayable, setDisplayable] = useState(map.displayable);
	const [submitEdit] = mapsApi.useEditMapMutation();
	const [deleteMap] = mapsApi.useDeleteMapMutation();
	// Only used to track stable reference changes to reset form.
	const apiMapCache = useAppSelector(state => selectMapById(state, map.id));
	const intl = useIntl();


	const handleShow = () => setShowModal(true);
	const handleClose = () => setShowModal(false);
	const updatedMap = (): MapMetadata => ({
		...map,
		name: nameInput,
		note: noteInput,
		circleSize: circleInput,
		displayable: displayable
	});
	const debouncedLocalUpdate = React.useMemo(() => debounce(
		(map: MapMetadata) => !isEqual(map, updatedMap()) && dispatch(localEditsSlice.actions.setOneEdit(map)),
		1000
	), []);
	React.useEffect(() => { debouncedLocalUpdate(updatedMap()); }, [nameInput, noteInput, circleInput, displayable]);

	// Sync with API Cache changes, if any.
	React.useEffect(() => {
		setNameInput(map.name);
		setNoteInput(map.note || '');
		setCircleInput(map.circleSize);
		setDisplayable(map.displayable);
	}, [apiMapCache]);

	const handleSave = () => {
		submitEdit(updatedMap());
		handleClose();
	};

	const handleDelete = () => {
		const consent = window.confirm(intl.formatMessage({ id: 'map.confirm.remove' }, { name: map.name }));
		if (consent) {
			deleteMap(map.id);
			handleClose();
		}
	};

	const handleCalibrationSetting = (mode: CalibrationModeTypes) => {
		// Add/update entry to localEdits Slice
		dispatch(localEditsSlice.actions.setOneEdit(updatedMap()));
		// Update Calibration Mode
		dispatch(localEditsSlice.actions.updateMapCalibrationMode({ mode, id: map.id }));
		handleClose();
	};

	const circIsValid = circleInput > 0.0 && circleInput <= 2.0;
	const toggleCircleEdit = () => {
		if (!circIsValid) {
			showErrorNotification(intl.formatMessage({ id: 'invalid.number' }));
		}
	};

	return (
		<>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="edit.map" />
				</Button>
			</div>
			<Modal isOpen={showModal} toggle={handleClose}>
				<ModalHeader toggle={handleClose}>
					<FormattedMessage id="edit.map" />
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
							<Label for='map.displayable'><FormattedMessage id='map.displayable' /></Label>
							<Input
								id="mapDisplayable"
								type="select"
								value={displayable.toString()}
								onChange={e => setDisplayable(e.target.value === 'true')}
							>
								<option value="true">{intl.formatMessage({ id: 'map.is.displayable' })}</option>
								<option value="false">{intl.formatMessage({ id: 'map.is.not.displayable' })}</option>
							</Input>
						</FormGroup>
						<FormGroup>
							<Label for="mapCircleSize"><FormattedMessage id="map.circle.size" /></Label>
							<Input
								id="mapCircleSize"
								type='number'
								value={String(circleInput)}
								onChange={e => setCircleInput(parseFloat(e.target.value))}
								invalid={!circIsValid}
								step={0.1}
								onBlur={toggleCircleEdit}
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
						<Label><FormattedMessage id="map.filename" /></Label>
						<Input
							id='mapFilename'
							name='mapFilename'
							type='text'
							defaultValue={map.filename}
							disabled>
						</Input>
						<Link to='/calibration' onClick={() => handleCalibrationSetting(CalibrationModeTypes.initiate)}>
							<Button color='primary' >
								<FormattedMessage id='map.upload.new.file' />
							</Button>
						</Link>
					</div>
					<div>
						<Label><FormattedMessage id="map.calibration" /></Label>
						<p>
							<FormattedMessage id={map.origin && map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
						</p>
						<Link to='/calibration' onClick={() => handleCalibrationSetting(CalibrationModeTypes.calibrate)}>
							<Button color='primary' >
								<FormattedMessage id='map.calibrate' />
							</Button>
						</Link>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button color="danger" onClick={handleDelete}>
						<FormattedMessage id="delete.map" />
					</Button>
					<Button color="secondary" onClick={handleClose}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button color="primary" onClick={handleSave} disabled={!circIsValid}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default EditMapModalComponent;

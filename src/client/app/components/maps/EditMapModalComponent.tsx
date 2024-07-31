/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { editMapDetails, submitEditedMap, removeMap } from '../../redux/actions/map';
import { showErrorNotification } from '../../utils/notifications';
import { State } from '../../types/redux/state';
import { AnyAction } from 'redux';

interface EditMapModalProps {
	show: boolean;
	handleClose: () => void;
	map: MapMetadata;
	editMapDetails(map: MapMetadata): any;
	setCalibration(mode: CalibrationModeTypes, mapID: number): any;
	removeMap(id: number): any;
}

const EditMapModalComponent: React.FC<EditMapModalProps> = ({ show, handleClose, map, setCalibration }) => {
	const dispatch: ThunkDispatch<State, void, AnyAction> = useDispatch();
	const [nameInput, setNameInput] = useState(map.name);
	const [noteInput, setNoteInput] = useState(map.note || '');
	const [circleInput, setCircleInput] = useState(map.circleSize.toString());
	const [displayable, setDisplayable] = useState(map.displayable);

	const intl = useIntl();

	const handleSave = () => {
		const updatedMap = {
			...map,
			name: nameInput,
			note: noteInput,
			circleSize: parseFloat(circleInput),
			displayable
		};
		dispatch(editMapDetails(updatedMap));
		dispatch(submitEditedMap(updatedMap.id) as any).then(() => {
			handleClose();
		});
	};

	const handleDelete = () => {
		const consent = window.confirm(intl.formatMessage({ id: 'map.confirm.remove' }, { name: map.name }));
		if (consent) {
			dispatch(removeMap(map.id) as any).then(() => {
				handleClose();
			});
		}
	};

	const handleCalibrationSetting = (mode: CalibrationModeTypes) => {
		setCalibration(mode, map.id);
		handleClose();
	};

	const toggleCircleEdit = () => {
		const regtest = /^\d+(\.\d+)?$/;
		if (regtest.test(circleInput) && parseFloat(circleInput) <= 2.0) {
			setCircleInput(circleInput);
		} else {
			showErrorNotification(intl.formatMessage({ id: 'invalid.number' }));
		}
	};

	return (
		<Modal isOpen={show} toggle={handleClose}>
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
						<Label for="mapDisplayable"><FormattedMessage id="map.displayable" /></Label>
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
							value={circleInput}
							onChange={e => setCircleInput(e.target.value)}
							invalid={parseFloat(circleInput)<0}
							onBlur={toggleCircleEdit}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="mapNote"><FormattedMessage id="note" /></Label>
						<Input
							id="mapNote"
							type="textarea"
							value={noteInput}
							onChange={e => setNoteInput(e.target.value.slice(0,30))}
						/>
					</FormGroup>
				</Form>
				<div>
					<Label><FormattedMessage id="map.filename" /></Label>
					<p>{map.filename}</p>
					<Button color='primary' onClick={() => handleCalibrationSetting(CalibrationModeTypes.initiate)}>
						<FormattedMessage id='map.upload.new.file' />
					</Button>
				</div>
				<div>
					<Label><FormattedMessage id="map.calibration" /></Label>
					<p>
						<FormattedMessage id={map.origin && map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
					</p>
					<Button color='primary' onClick={() => handleCalibrationSetting(CalibrationModeTypes.calibrate)}>
						<FormattedMessage id='map.calibrate' />
					</Button>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color="danger" onClick={handleDelete}>
					<FormattedMessage id="delete.map" />
				</Button>
				<Button color="secondary" onClick={handleClose}>
					<FormattedMessage id="cancel" />
				</Button>
				<Button color="primary" onClick={handleSave}>
					<FormattedMessage id="save.all" />
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default EditMapModalComponent;
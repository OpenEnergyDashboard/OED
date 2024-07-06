import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { Link } from 'react-router-dom';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { showErrorNotification } from '../../utils/notifications';

interface EditMapModalProps {
	show: boolean;
	handleClose: () => void;
	map: MapMetadata;
	editMapDetails(map: MapMetadata): any;
	setCalibration(mode: CalibrationModeTypes, mapID: number): any;
	removeMap(id: number): any;
}

/**
 *Defines the edit maps modal form
 * @param props state variables needed to define the component
 * @returns Map edit element
 */
function EditMapModalComponent(props: EditMapModalProps) {
	const [nameInput, setNameInput] = useState(props.map.name);
	const [noteInput, setNoteInput] = useState(props.map.note || '');
	const [circleInput, setCircleInput] = useState(props.map.circleSize.toString());
	const [displayable, setDisplayable] = useState(props.map.displayable);

	const intl = useIntl();

	const handleSave = () => {
		const updatedMap = {
			...props.map,
			name: nameInput,
			note: noteInput,
			circleSize: parseFloat(circleInput),
			displayable: displayable
		};
		props.editMapDetails(updatedMap);
		props.handleClose();
	};

	const handleDelete = () => {
		const consent = window.confirm(intl.formatMessage({ id: 'map.confirm.remove' }, { name: props.map.name }));
		if (consent) {
			props.removeMap(props.map.id);
			props.handleClose();
		}
	};

	const handleCalibrationSetting = (mode: CalibrationModeTypes) => {
		props.setCalibration(mode, props.map.id);
		props.handleClose();
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
		<Modal isOpen={props.show} toggle={props.handleClose}>
			<ModalHeader toggle={props.handleClose}>
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
							value={circleInput}
							onChange={e => setCircleInput(e.target.value)}
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
					<p>{props.map.filename}</p>
					<Link to='/calibration' onClick={() => handleCalibrationSetting(CalibrationModeTypes.initiate)}>
						<Button color='primary'>
							<FormattedMessage id='map.upload.new.file' />
						</Button>
					</Link>
				</div>
				<div>
					<Label><FormattedMessage id="map.calibration" /></Label>
					<p>
						<FormattedMessage id={props.map.origin && props.map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
					</p>
					<Link to='/calibration' onClick={() => handleCalibrationSetting(CalibrationModeTypes.calibrate)}>
						<Button color='primary'>
							<FormattedMessage id='map.calibrate' />
						</Button>
					</Link>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color="danger" onClick={handleDelete}>
					<FormattedMessage id="delete.map" />
				</Button>
				<Button color="secondary" onClick={props.handleClose}>
					<FormattedMessage id="cancel" />
				</Button>
				<Button color="primary" onClick={handleSave}>
					<FormattedMessage id="save.map.edits" />
				</Button>
			</ModalFooter>
		</Modal>
	);
}

export default EditMapModalComponent;
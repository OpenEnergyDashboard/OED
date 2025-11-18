/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { isEqual } from 'lodash';
import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button, Form, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { mapsApi, selectMapById } from '../../redux/api/mapsApi';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { localEditsSlice } from '../../redux/slices/localEditsSlice';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { useTranslate } from '../../redux/componentHooks';
import { TrueFalseType } from '../../types/items';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import { SimpleUnsavedWarningComponent } from '../SimpleUnsavedWarningComponent';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { tooltipBaseStyle } from '../../styles/modalStyle';

interface EditMapModalProps {
	map: MapMetadata;
}

// TODO: Migrate to RTK
const EditMapModalComponent: React.FC<EditMapModalProps> = ({ map }) => {
	const translate = useTranslate();

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

	const handleShow = () => {
		setShowModal(true);
	};
	const handleClose = () => {
		setShowModal(false);
		resetState();
	};

	// boolean that updates if any change is made to any conversion modal
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
	// If there are no changes, then save is disabled
	const [canSave, setCanSave] = useState(false);

	// displays the unsaved warning component whenever there's unsaved
	// changes, otherwise closes out of the modal
	const handleToggle = () => {
		if (hasUnsavedChanges) {
			setShowUnsavedWarning(true);
		}
		else {
			// Proceed to close the modal
			handleClose();
		}
	};

	const resetState = () => {
		// TODO This duplicates code below. Decide if use function or if going to remove if change
		// to other pages use where there is a state variable.
		setNameInput(map.name);
		setNoteInput(map.note || '');
		setCircleInput(map.circleSize);
		setDisplayable(map.displayable);
	};

	const updatedMap = (): MapMetadata => ({
		...map,
		name: nameInput,
		note: noteInput,
		circleSize: circleInput,
		displayable: displayable
	});
	// TODO This caused a delayed syncing between the edited state and the global Redux state of map.
	// No other component does this so it was removed. I think OED wants to stick with the unsaved
	// warning and not update the values while editing. Doing this causes the card values to change
	// and are not reset on discard (at this point). It does indicate that there are unsaved values.
	// Most OED pages use local state for edits but this does not. It seems more complicated to fix up
	// since it interacts with the calibration. At some point this should be cleaned up to see if
	// this system/global state should be left.
	// const debouncedLocalUpdate = React.useMemo(() => debounce(
	// 	(map: MapMetadata) => !isEqual(map, updatedMap()) && dispatch(localEditsSlice.actions.setOneEdit(map)),
	// 	1000
	// ), []);
	// React.useEffect(() => { debouncedLocalUpdate(updatedMap()); }, [nameInput, noteInput, circleInput, displayable]);

	// Sync with API Cache changes, if any.
	React.useEffect(() => {
		setNameInput(map.name);
		setNoteInput(map.note || '');
		setCircleInput(map.circleSize);
		setDisplayable(map.displayable);
	}, [apiMapCache]);

	// Checks for edits
	React.useEffect(() => {
		const editMade = !isEqual(map, updatedMap());
		// If editMade is true, then hasUnsavedChanges will be set to true.
		setHasUnsavedChanges(editMade);
		// If editsMade, then canSave is true (saving is enabled)
		setCanSave(editMade && circIsValid);
	}, [nameInput, noteInput, circleInput, displayable]);

	const handleSave = () => {
		submitEdit(updatedMap());
		handleClose();
	};

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('map.confirm.remove') + ' "' + map.name + '" ?';
	const deleteConfirmText = translate('map.confirm.remove');
	const deleteRejectText = translate('cancel');
	// The first two handle functions below are required because only one Modal can be open at a time (properly)
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShow();
	};
	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};

	/* End Confirm Delete Modal */

	const handleDelete = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);
		deleteMap(map.id);
		handleClose();
	};

	const handleCalibrationSetting = (mode: CalibrationModeTypes) => {
		// Add/update entry to localEdits Slice
		dispatch(localEditsSlice.actions.setOneEdit(updatedMap()));
		// Update Calibration Mode
		dispatch(localEditsSlice.actions.updateMapCalibrationMode({ mode, id: map.id }));
		handleClose();
	};

	const circIsValid = circleInput > 0.0 && circleInput <= 2.0;

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditUnitView: 'help.admin.mapedit'
	};

	return (
		<>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="edit.map" />
				</Button>
			</div>
			{/* Unsaved Warning Component */}
			{showUnsavedWarning && (
				<SimpleUnsavedWarningComponent
					isOpen={showUnsavedWarning}
					onDiscard={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleClose();
						resetState();
					}}
					onConfirm={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleSave();
						handleClose();
					}}
					onCancel={() => setShowUnsavedWarning(false)}
					disabled={!canSave}
				/>
			)}
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDelete}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<Modal isOpen={showModal} toggle={handleToggle}>
				<ModalHeader>
					<FormattedMessage id="edit.map" />
					<TooltipHelpComponent page='units-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='units-edit' helpTextId={tooltipStyle.tooltipEditUnitView} />
					</div>
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
							<Label for='displayable'><FormattedMessage id='displayable' /></Label>
							<Input
								id="mapDisplayable"
								type="select"
								value={displayable.toString()}
								onChange={e => setDisplayable(e.target.value === 'true')}
							>
								{Object.keys(TrueFalseType).map(key => {
									return (
										<option value={key} key={key}>
											{translate(`TrueFalseType.${key}`)}
										</option>
									);
								})}
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
								min={0}
								max={2}
							/>
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: 0, max: 2 }} />
							</FormFeedback>
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
						{/* top padding */}
						<div style={{ padding: '15px 0 0 0' }}>
							<Link to='/calibration' onClick={() => handleCalibrationSetting(CalibrationModeTypes.initiate)}>
								<Button color='primary' >
									<FormattedMessage id='map.upload.new.file' />
								</Button>
							</Link>
						</div>
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
					<Button color="danger" onClick={handleDeleteConfirmationModalOpen}>
						<FormattedMessage id="delete.map" />
					</Button>
					<Button color="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					<Button color="primary" onClick={handleSave} disabled={!canSave}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default EditMapModalComponent;

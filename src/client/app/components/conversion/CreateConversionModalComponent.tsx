/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { omit } from 'lodash';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { conversionsApi } from '../../redux/api/conversionsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectDefaultCreateConversionValues, selectIsValidConversion } from '../../redux/selectors/adminSelectors';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { showErrorNotification } from '../../utils/notifications';
import { useTranslate } from '../../redux/componentHooks';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import { UnitType } from '../../types/redux/units';
import { SimpleUnsavedWarningComponent } from '../SimpleUnsavedWarningComponent';

/**
 * Defines the create conversion modal form
 * @returns Conversion create element
 */
export default function CreateConversionModalComponent() {
	const translate = useTranslate();

	// boolean that updates if any change is made to any conversion modal
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
	// If user can save
	const [canSave, setCanSave] = useState(false);
	// If user has an invalid save (slope intercept is 0) with unsaved warning.
	// Stores the conversion data so that it can be used in either
	// handleSubmit() or handleWarningConfirm().
	// This addresses an issue of where the conversionState does not carry over
	// when going from unsaved warning to the invalid save modal.
	const [pendingConversion, setPendingConversion] = useState<any>(null);

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

	const [addConversionMutation] = conversionsApi.useAddConversionMutation();
	// Want units in sorted order by identifier regardless of case.

	const defaultValues = useAppSelector(selectDefaultCreateConversionValues);

	/* State */
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// State for the warning modal
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [warningMessage, setWarningMessage] = useState('');

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => setShowModal(true);

	// Handlers for each type of input change
	const [conversionState, setConversionState] = useState(defaultValues);

	// If the currently selected conversion is valid
	const [validConversion, reason] = useAppSelector(state => selectIsValidConversion(state, conversionState));

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setConversionState({ ...conversionState, [e.target.name]: e.target.value });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setConversionState({ ...conversionState, [e.target.name]: JSON.parse(e.target.value) });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// once a source or destination is selected, it will be removed from the other options.
		if (e.target.name === 'sourceId') {
			setConversionState(state => ({
				...state,
				sourceId: Number(e.target.value),
				destinationOptions: defaultValues.destinationOptions.filter(destination => destination.id !== Number(e.target.value))
			}));
		} else if (e.target.name === 'destinationId') {
			setConversionState(state => ({
				...state,
				destinationId: Number(e.target.value),
				sourceOptions: defaultValues.sourceOptions.filter(source => source.id !== Number(e.target.value))
			}));
		} else {
			setConversionState(state => ({ ...state, [e.target.name]: Number(e.target.value) }));
		}
	};
	/* End State */

	// Determines whether the selected source is of type meter
	const isMeterSource = () => {
		const source = defaultValues.sourceOptions.find(u => u.id === conversionState.sourceId);
		return source?.typeOfUnit === UnitType.meter;
	};

	// Determine whether the selected source or destination is a suffix unit
	const isSuffixUsed = () => {
		const source = defaultValues.sourceOptions.find(u => u.id === conversionState.sourceId);
		const dest = defaultValues.sourceOptions.find(u => u.id === conversionState.destinationId);
		return source?.typeOfUnit === UnitType.suffix || dest?.typeOfUnit === UnitType.suffix;
	};

	/* Warning Modal */
	const handleWarningConfirm = () => {
		//Close the warning modal
		setShowWarningModal(false);

		//Proceed with the creation of the conversion
		setShowModal(false);
		addConversionMutation(pendingConversion);
		resetState();
	};

	const handleWarningCancel = () => {
		//Close the warning modal
		setShowWarningModal(false);
	};

	// Reset the state to default values
	const resetState = () => {
		setConversionState(defaultValues);
		setPendingConversion(null);
	};
	/* End Warning Modal */

	// Submit
	const handleSubmit = () => {
		// Show warning modal if slope and intercept are both 0
		if (conversionState.slope === 0 && conversionState.intercept === 0) {
			setPendingConversion({...omit(conversionState, 'sourceOptions'),
				bidirectional: (isMeterSource() || isSuffixUsed()) ? false : conversionState.bidirectional});
			setWarningMessage(translate('conversion.slope.intercept.zero'));
			setShowWarningModal(true);
		} else if (validConversion) {
			// Close modal first to avoid repeat clicks
			setShowModal(false);
			// Add the new conversion and update the store
			// Omit the source options , do not need to send in request so remove here.
			// If source is a meter, make bidirectional false
			// If source or destination is a suffix unit, make bidirectional false
			addConversionMutation({...omit(conversionState, 'sourceOptions'),
				bidirectional: (isMeterSource() || isSuffixUsed()) ? false : conversionState.bidirectional});
			resetState();
		} else {
			showErrorNotification(reason);
		}
	};

	// Checks if valid and if edit made.
	// References the original implementation in EditUnitModalComponent.tsx
	useEffect(() => {
		// This checks if all of the required fields have been filled out.
		const validChange =
			conversionState.sourceId !== defaultValues.sourceId
			&& conversionState.destinationId !== defaultValues.destinationId;
		// Compare the local changes to the default values
		const editMade =
			conversionState.sourceId !== defaultValues.sourceId
			|| conversionState.destinationId !== defaultValues.destinationId
			|| conversionState.bidirectional !== defaultValues.bidirectional
			|| conversionState.slope !== defaultValues.slope
			|| conversionState.intercept !== defaultValues.intercept
			|| conversionState.note !== defaultValues.note;
		setCanSave(validChange && editMade && validConversion);
		// Automatically checks for unsaved changes and addresses the issue
		// of having to manually set the setHasUnsavedChanges
		// If editMade is true, then hasUnsavedChanges will be set to true.
		setHasUnsavedChanges(editMade);
	}, [conversionState, validConversion]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateConversionView: 'help.admin.conversioncreate'
	};

	return (
		<>
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
						if (conversionState.slope === 0 && conversionState.intercept === 0) {
							setPendingConversion({...omit(conversionState, 'sourceOptions'),
								bidirectional: (isMeterSource() || isSuffixUsed()) ? false : conversionState.bidirectional});
							setWarningMessage(translate('conversion.slope.intercept.zero'));
							setShowWarningModal(true);
						}
						else if (validConversion) {
							setShowModal(false);
							addConversionMutation({...omit(conversionState, 'sourceOptions'),
								bidirectional: (isMeterSource() || isSuffixUsed()) ? false : conversionState.bidirectional});
							resetState();
						}
						else {
							handleClose();
						}
					}}
					onCancel={() => setShowUnsavedWarning(false)}
					disabled={!canSave}
				/>
			)}
			<ConfirmActionModalComponent
				show={showWarningModal}
				actionConfirmMessage={warningMessage}
				handleClose={handleWarningCancel}
				actionFunction={handleWarningConfirm}
				actionConfirmText={translate('confirm.action')}
				actionRejectText={translate('cancel')}
			/>
			{/* Show modal button */}
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage id="create.conversion" />
			</Button>

			<Modal isOpen={showModal} toggle={handleToggle} size='lg'>
				<ModalHeader>
					<FormattedMessage id="create.conversion" />
					<TooltipHelpComponent page='conversions-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='conversions-create' helpTextId={tooltipStyle.tooltipCreateConversionView} />
					</div>
				</ModalHeader>
				{/* when any of the conversion are changed call one of the functions. */}
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								{/* Source unit input*/}
								<FormGroup>
									<Label for='sourceId'>{translate('conversion.source')}</Label>
									<Input
										id='sourceId'
										name='sourceId'
										type='select'
										value={conversionState.sourceId}
										onChange={e => {handleNumberChange(e);}}
										invalid={conversionState.sourceId === -999}>
										{<option
											value={-999}
											key={-999}
											hidden={conversionState.sourceId !== -999}
											disabled>
											{translate('conversion.select.source') + '...'}
										</option>}
										{Object.values(conversionState.sourceOptions).map(unitData => {
											return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>);
										})}
									</Input>
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
							<Col>
								{/* Destination unit input*/}
								<FormGroup>
									<Label for='destinationId'>{translate('conversion.destination')}</Label>
									<Input
										id='destinationId'
										name='destinationId'
										type='select'
										value={conversionState.destinationId}
										onChange={e => {handleNumberChange(e);}}
										invalid={conversionState.destinationId === -999}>
										{<option
											value={-999}
											key={-999}
											hidden={conversionState.destinationId !== -999}
											disabled>
											{translate('conversion.select.destination') + '...'}
										</option>}
										{Object.values(conversionState.destinationOptions).map(unitData => {
											return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>);
										})}
									</Input>
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						{/* Bidirectional Y/N input*/}
						<FormGroup>
							<Label for='bidirectional'>{translate('conversion.bidirectional')}</Label>
							<Input
								id='bidirectional'
								name='bidirectional'
								type='select'
								onChange={e => {handleBooleanChange(e);}}
								value={String(conversionState.bidirectional)}
								invalid={(isMeterSource() || isSuffixUsed()) && conversionState.bidirectional === true}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
							{isMeterSource() && conversionState.bidirectional === true && (
								<FormFeedback className='d-block'>
									<FormattedMessage id="conversion.bidirectional.disabled.meter"/>
								</FormFeedback>
							)}
							{isSuffixUsed() && conversionState.bidirectional === true &&  (
								<FormFeedback className='d=block'>
									<FormattedMessage id="conversion.bidirectional.disabled.suffix"/>
								</FormFeedback>
							)}
						</FormGroup>
						<Row xs='1' lg='2'>
							<Col>
								{/* Slope input*/}
								<FormGroup>
									<Label for='slope'>{translate('conversion.slope')}</Label>
									<Input
										id='slope'
										name='slope'
										type='number'
										value={conversionState.slope}
										onChange={e => {handleNumberChange(e);}}
									/>
								</FormGroup>
							</Col>
							<Col>
								{/* Intercept input*/}
								<FormGroup>
									<Label for='intercept'>{translate('conversion.intercept')}</Label>
									<Input
										id='intercept'
										name='intercept'
										type='number'
										value={conversionState.intercept}
										onChange={e => {handleNumberChange(e);}}
									/>
								</FormGroup>
							</Col>
						</Row>
						{/* Note input*/}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								onChange={e => {handleStringChange(e);}}
								value={conversionState.note}
							/>
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{
						// Todo looks kind of bad make a better visible notification
						!validConversion && <p>{reason}</p>
					}

					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} disabled={!validConversion || !canSave} >
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

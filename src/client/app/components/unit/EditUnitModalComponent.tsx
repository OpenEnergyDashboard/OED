/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
//Realize that * is already imported from react
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { selectConversionsDetails } from '../../redux/api/conversionsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { selectUnitDataById, unitsApi } from '../../redux/api/unitsApi';
import { useTranslate } from '../../redux/componentHooks';
import { useAppSelector } from '../../redux/reduxHooks';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { DisplayableType, UnitData, UnitRepresentType, UnitType } from '../../types/redux/units';
import { conversionArrow } from '../../utils/conversionArrow';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { LineGraphRates } from '../../types/redux/graph';
import { customRateValid } from '../../utils/unitInput';

interface EditUnitModalComponentProps {
	show: boolean;
	unit: UnitData;
	// passed in to handle opening the modal
	handleShow: () => void;
	// passed in to handle closing the modal
	handleClose: () => void;
}

/**
 * Defines the edit unit modal form
 * @param props props for component
 * @returns Unit edit element
 */
export default function EditUnitModalComponent(props: EditUnitModalComponentProps) {
	const translate = useTranslate();
	const [submitEditedUnit] = unitsApi.useEditUnitMutation();
	const [deleteUnit] = unitsApi.useDeleteUnitMutation();
	const CUSTOM_INPUT = '-99';

	// Set existing unit values
	const values = { ...props.unit };

	/* State */
	// Handlers for each type of input change
	const [state, setState] = useState(values);
	const [customRate, setCustomRate] = useState(1);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [rate, setRate] = useState(String(state.secInRate));
	const conversionData = useAppSelector(selectConversionsDetails);
	const meterDataByID = useAppSelector(selectMeterDataById);
	const unitDataByID = useAppSelector(selectUnitDataById);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	};

	/**
	 * Determines if the rate is custom.
	 * @param rate The rate to check
	 * @returns true if the rate is custom and false if it is a standard value.
	 */
	const isCustomRate = (rate: number) => {
		// Loop over all standard rates to see if the rate is one of these.
		// If is then return false, otherwise true.
		return !Object.entries(LineGraphRates).some(
			([, rateValue]) => {
				// Since the rateValue is a floating point number and rate is an integer,
				// round to nearest integer to avoid issues with compare.
				return Math.round(rateValue * 3600) === rate;
			});
	};

	/**
	 * Updates the rate (both custom and regular state) including setting if custom.
	 * @param newRate The new rate to set.
	 */
	const updateRates = (newRate: number) => {
		const isCustom = isCustomRate(newRate);
		setShowCustomInput(isCustom);
		if (newRate !== Number(CUSTOM_INPUT)) {
			// Should only update with the new rate if did not just select custom
			// input from the menu.
			setCustomRate(newRate);
		}
		setRate(isCustom ? CUSTOM_INPUT : newRate.toString());
	};

	// Keeps react-level state, and redux state in sync for sec. in rate.
	// Two different layers in state may differ especially when externally updated (chart link, history buttons.)
	React.useEffect(() => {
		updateRates(state.secInRate);
	}, [state.secInRate]);

	const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		// The input only allows a number so this should be safe.
		setState({ ...state, secInRate: Number(value) });
	};

	const handleCustomRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		// Don't update state here since wait for enter to allow to enter custom value
		// that starts the same as a standard value.
		setCustomRate(Number(value));
	};

	const handleEnter = (key: string) => {
		// This detects the enter key and then uses the previously entered custom
		// rate to set the rate as a new value.
		if (key === 'Enter') {
			// Form only allows integers so this should be safe.
			setState({ ...state, secInRate: Number(customRate) });
		}
	};

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('unit.delete.unit') + ' [' + values.identifier + '] ?';
	const deleteConfirmText = translate('unit.delete.unit');
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

	const handleDeleteUnit = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);

		let error_message = '';
		for (const value of Object.values(meterDataByID)) {
			// This unit is used by a meter so cannot be deleted. Note if in a group then in a meter so covers both.
			if (value.unitId === state.id) {
				// TODO see EditMeterModalComponent for issue with line breaks. Same issue in strings below.
				error_message += ` ${translate('meter')} "${value.name}" ${translate('uses')} ${translate('unit')} ` +
					`"${state.name}" ${translate('as.meter.unit')};`;
			}
			if (value.defaultGraphicUnit === state.id) {
				error_message += ` ${translate('meter')} "${value.name}" ${translate('uses')} ${translate('unit')} ` +
					`"${state.name}" ${translate('as.meter.defaultgraphicunit')};`;
			}
		}
		for (let i = 0; i < conversionData.length; i++) {
			if (conversionData[i].sourceId === state.id) {
				// This unit is the source of a conversion so cannot be deleted.
				error_message += ` ${translate('conversion')} ${unitDataByID[conversionData[i].sourceId].name}` +
					`${conversionArrow(conversionData[i].bidirectional)}` +
					`${unitDataByID[conversionData[i].destinationId].name} ${translate('uses')} ${translate('unit')}` +
					` "${state.name}" ${translate('unit.source.error')};`;
			}

			if (conversionData[i].destinationId === state.id) {
				// This unit is the destination of a conversion so cannot be deleted.
				error_message += ` ${translate('conversion')} ${unitDataByID[conversionData[i].sourceId].name}` +
					`${conversionArrow(conversionData[i].bidirectional)}` +
					`${unitDataByID[conversionData[i].destinationId].name} ${translate('uses')} ${translate('unit')}` +
					` "${state.name}" ${translate('unit.destination.error')};`;
			}
		}
		if (error_message) {
			error_message = `${translate('unit.failed.to.delete.unit')}: ${error_message}`;
			showErrorNotification(error_message);
		} else {
			// It is okay to delete this unit.
			deleteUnit(state.id)
				.unwrap()
				.then(() => { showSuccessNotification(translate('unit.delete.success')); })
				.catch(error => { showErrorNotification(translate('unit.delete.failure') + error.data); });
		}
	};

	// Stores if save should be allowed but check for use by a meter is delayed until
	// save is hit to avoid doing a lot and to give error message then.
	const [canSave, setCanSave] = useState(false);
	// Keeps canSave state up to date. Checks if valid and if edit made.
	useEffect(() => {
		// This checks:
		// - Name cannot be blank
		// - If type of unit is suffix their must be a suffix
		// - The rate is set so not the custom input value. This happens if select custom value but don't input with enter.
		// - The custom rate is a positive integer
		const validUnit = state.name !== '' &&
			(state.typeOfUnit !== UnitType.suffix || state.suffix !== '') && state.secInRate !== Number(CUSTOM_INPUT)
			&& customRateValid(Number(state.secInRate));
		// Compare original props to state to see if edit made. Check above avoids thinking edit happened if
		// custom edit started without enter hit.
		const editMade =
			props.unit.name !== state.name
			|| props.unit.identifier !== state.identifier
			|| props.unit.typeOfUnit !== state.typeOfUnit
			|| props.unit.unitRepresent !== state.unitRepresent
			|| props.unit.displayable !== state.displayable
			|| props.unit.preferredDisplay !== state.preferredDisplay
			|| props.unit.secInRate !== state.secInRate
			|| props.unit.suffix !== state.suffix
			|| props.unit.note !== state.note;
		setCanSave(validUnit && editMade);
	}, [state]);
	/* End State */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateUnitModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit units will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setState(values);
		updateRates(state.secInRate);
	};

	const handleShow = () => {
		props.handleShow();
	};

	const handleClose = () => {
		props.handleClose();
		resetState();
	};

	// Validate the changes and return true if we should update this unit.
	// Two reasons for not updating the unit:
	//	1. typeOfUnit is changed from meter to something else while some meters are still linked with this unit
	//	2. There are no changes but save button should stop this.
	const shouldUpdateUnit = (): boolean => {
		// true if inputted values are okay and there are changes.
		let inputOk = true;

		// Check for case 1
		if (props.unit.typeOfUnit === UnitType.meter && state.typeOfUnit !== UnitType.meter) {
			// Get an array of all meters
			const meters = Object.values(meterDataByID);
			const meter = meters.find(m => m.unitId === props.unit.id);
			if (meter) {
				// There exists a meter that is still linked with this unit
				showErrorNotification(`${translate('the.unit.of.meter')} ${meter.name} ${translate('meter.unit.change.requires')}`);
				inputOk = false;
			}
		}
		if (inputOk) {
			// The input passed validation so return if canSave set.
			// In principle this should always be true since hit save
			// be here to be safe and due to old logic setup.
			return canSave;
		} else {
			// Tell user that not going to update due to input issues.
			showErrorNotification(`${translate('unit.input.error')}`);
			return false;
		}
	};

	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		if (shouldUpdateUnit()) {
			// Need to redo Cik if the suffix, displayable, or type of unit changes.
			// For displayable, it only matters if it changes from/to NONE but a more general check is used here for simplification.
			const shouldRedoCik = props.unit.suffix !== state.suffix
				|| props.unit.typeOfUnit !== state.typeOfUnit
				|| props.unit.displayable !== state.displayable;
			// Need to refresh reading views if unitRepresent or secInRate (when the unit is flow or raw) changes.
			const shouldRefreshReadingViews = props.unit.unitRepresent !== state.unitRepresent
				|| (props.unit.secInRate !== state.secInRate
					&& (props.unit.unitRepresent === UnitRepresentType.flow || props.unit.unitRepresent === UnitRepresentType.raw));
			// set displayable to none if unit is meter
			if (state.typeOfUnit === UnitType.meter && state.displayable !== DisplayableType.none) {
				setState({ ...state, displayable: DisplayableType.none });
			}
			// set unit to suffix if suffix is not empty
			if (state.typeOfUnit !== UnitType.suffix && state.suffix !== '') {
				setState({ ...state, typeOfUnit: UnitType.suffix });
			}
			// Save our changes by dispatching the submitEditedUnit mutation
			submitEditedUnit({ editedUnit: state, shouldRedoCik, shouldRefreshReadingViews })
				.unwrap()
				.then(() => {
					showSuccessNotification(translate('unit.successfully.edited.unit'));
				})
				.catch(() => {
					showErrorNotification(translate('unit.failed.to.edit.unit'));
				});
			// The updated unit is not fetched to save time. However, the identifier might have been
			// automatically set if it was empty. Mimic that here.
			if (state.identifier === '') {
				setState({ ...state, identifier: state.name });
			}
		}
	};

	// Check if the unit is used in any conversion.
	// 1. If the unit is used, the Unit Represent cannot be changed.
	// 2. Otherwise, the Unit Represent can be changed.
	const inConversions = () => {
		for (const conversion of conversionData) {
			if (conversion.sourceId === state.id || conversion.destinationId === state.id) {
				return true;
			}
		}
		return false;
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditUnitView: 'help.admin.unitedit'
	};

	return (
		<>
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteUnit}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<Modal isOpen={props.show} toggle={props.handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="edit.unit" />
					<TooltipHelpComponent page='units-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='units-edit' helpTextId={tooltipStyle.tooltipEditUnitView} />
					</div>
				</ModalHeader>
				{/* when any of the unit are changed call one of the functions. */}
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							{/* Identifier input */}
							<Col>
								<FormGroup>
									<Label for='identifier'>{translate('identifier')}</Label>
									<Input
										id='identifier'
										name='identifier'
										type='text'
										autoComplete='on'
										onChange={e => handleStringChange(e)}
										value={state.identifier}
										placeholder='Identifier' />
								</FormGroup>
							</Col>
							{/* Name input */}
							<Col>
								<FormGroup>
									<Label for='name'>{translate('name')}</Label>
									<Input
										id='name'
										name='name'
										type='text'
										autoComplete='on'
										onChange={e => handleStringChange(e)}
										value={state.name}
										invalid={state.name === ''} />
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							{/* Type of unit input */}
							<Col>
								<FormGroup>
									<Label for='typeOfUnit'>{translate('unit.type.of.unit')}</Label>
									<Input
										id='typeOfUnit'
										name='typeOfUnit'
										type='select'
										onChange={e => handleStringChange(e)}
										value={state.typeOfUnit}
										invalid={state.typeOfUnit !== UnitType.suffix && state.suffix !== ''}>
										{Object.keys(UnitType).map(key => {
											return (<option value={key} key={key} disabled={state.suffix !== '' && key !== UnitType.suffix}>
												{translate(`UnitType.${key}`)}</option>);
										})}
									</Input>
									<FormFeedback>
										<FormattedMessage id="unit.type.of.unit.suffix" />
									</FormFeedback>
								</FormGroup>
							</Col>
							{/* Unit represent input */}
							<Col>
								<FormGroup>
									<Label for='unitRepresent'>{translate('unit.represent')}</Label>
									<Input
										id='unitRepresent'
										name='unitRepresent'
										type='select'
										value={state.unitRepresent}
										disabled={inConversions()}
										onChange={e => handleStringChange(e)}>
										{Object.keys(UnitRepresentType).map(key => {
											return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>);
										})}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							{/* Displayable type input */}
							<Col>
								<FormGroup>
									<Label for='displayable'>{translate('displayable')}</Label>
									<Input
										id='displayable'
										name='displayable'
										type='select'
										value={state.displayable}
										onChange={e => handleStringChange(e)}
										invalid={state.displayable !== DisplayableType.none && (state.typeOfUnit === UnitType.meter || state.suffix !== '')}>
										{Object.keys(DisplayableType).map(key => {
											return (<option value={key} key={key} disabled={(state.typeOfUnit === UnitType.meter || state.suffix !== '') && key !== DisplayableType.none}>
												{translate(`DisplayableType.${key}`)}</option>);
										})}
									</Input>
									<FormFeedback>
										{state.displayable !== DisplayableType.none && state.typeOfUnit === UnitType.meter ? (
											<FormattedMessage id="error.displayable.meter" />
										) : (
											<FormattedMessage id="error.displayable.suffix.input" />
										)}
									</FormFeedback>
								</FormGroup>
							</Col>
							{/* Preferred display input */}
							<Col>
								<FormGroup>
									<Label for='preferredDisplay'>{translate('unit.preferred.display')}</Label>
									<Input
										id='preferredDisplay'
										name='preferredDisplay'
										type='select'
										value={state.preferredDisplay.toString()}
										onChange={e => handleBooleanChange(e)}>
										{Object.keys(TrueFalseType).map(key => {
											return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
										})}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							{/* Seconds in rate input */}
							<Col>
								<FormGroup>
									<Label for='secInRate'>{translate('unit.sec.in.rate')}</Label>
									<Input
										id='secInRate'
										name='secInRate'
										type='select'
										value={rate}
										onChange={e => handleRateChange(e)}>
										{Object.entries(LineGraphRates).map(
											([rateKey, rateValue]) => (
												<option value={rateValue * 3600} key={rateKey}>
													{translate(rateKey)}
												</option>
											)
										)}
										<option value={CUSTOM_INPUT}>
											{translate('custom.value')}
										</option>
									</Input>
									{showCustomInput && (
										<>
											<Label for="customRate">
												{translate('unit.sec.in.rate.enter')}
											</Label>
											<Input
												id="customRate"
												name="customRate"
												type="number"
												value={customRate}
												min={1}
												invalid={!customRateValid(customRate)}
												onChange={e => handleCustomRateChange(e)}
												// This grabs each key hit and then finishes input when hit enter.
												onKeyDown={e => { handleEnter(e.key); }}
											/>
										</>
									)}
									<FormFeedback>
										<FormattedMessage id="error.greater" values={{ min: '0' }} />
										{translate('and')}{translate('an.integer')}
									</FormFeedback>
								</FormGroup>
							</Col>
							{/* Suffix input */}
							<Col>
								<FormGroup>
									<Label for='suffix'>{translate('unit.suffix')}</Label>
									<Input
										id='suffix'
										name='suffix'
										type='text'
										value={state.suffix}
										placeholder='Suffix'
										onChange={e => handleStringChange(e)}
										invalid={state.typeOfUnit === UnitType.suffix && state.suffix === ''} />
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						{/* Note input */}
						<FormGroup>
							<Label for='note'>{translate('unit')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={state.note}
								placeholder='Note'
								onChange={e => handleStringChange(e)} />
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button variant="warning" color='danger' onClick={handleDeleteConfirmationModalOpen}>
						<FormattedMessage id="unit.delete.unit" />
					</Button>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSaveChanges} disabled={!canSave}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

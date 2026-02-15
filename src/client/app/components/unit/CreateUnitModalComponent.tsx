/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import '../../styles/modal.css';
import { TrueFalseType } from '../../types/items';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { UnitRepresentType, DisplayableType, UnitType, DisableChecksType } from '../../types/redux/units';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { unitsApi } from '../../redux/api/unitsApi';
import { useTranslate } from '../../redux/componentHooks';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { MIN_VAL, MAX_VAL } from '../../utils/input';
import { LineGraphRates } from '../../types/redux/graph';
import { customRateValid, isCustomRate } from '../../utils/unitInput';
import { SimpleUnsavedWarningComponent } from '../SimpleUnsavedWarningComponent';

/**
 * Defines the create unit modal form
 * @returns Unit create element
 */
export default function CreateUnitModalComponent() {
	const translate = useTranslate();

	// boolean that updates if any change is made to any unit modal
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

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

	const [submitCreateUnit] = unitsApi.useAddUnitMutation();
	const CUSTOM_INPUT = '-77';

	const defaultValues = {
		name: '',
		identifier: '',
		typeOfUnit: UnitType.unit,
		unitRepresent: UnitRepresentType.quantity,
		displayable: DisplayableType.all,
		preferredDisplay: true,
		secInRate: LineGraphRates.hour * 3600,
		suffix: '',
		note: '',
		// These two values are necessary but are not used.
		// The client code makes the id for the selected unit and default graphic unit be -99
		// so it can tell it is not yet assigned and do the correct logic for that case.
		// The units API expects these values to be undefined on call so that the database can assign their values.
		id: -99,
		minVal: MIN_VAL,
		maxVal: MAX_VAL,
		disableChecks: DisableChecksType.reject_all
	};

	/* State */
	// Unlike EditUnitModalComponent, there are no props so we don't pass show and close via props.
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// Handlers for each type of input change
	// Current unit values
	const [state, setState] = useState(defaultValues);
	// If user can save
	const [canSave, setCanSave] = useState(false);
	// Sets the starting rate for secInRate box, value of 3600 is chosen as default to result in Hour as default in dropdown box.
	const [rate, setRate] = useState(String(defaultValues.secInRate));
	// Holds the value during custom value input and it is separate from standard choices.
	// Needs to be valid at start and overwritten before used.
	const [customRate, setCustomRate] = useState(1);
	// should only update customRate when save all is clicked
	// This should keep track of rate's value and set custom rate equal to it when custom rate is clicked
	// True if custom value input is active.
	const [showCustomInput, setShowCustomInput] = useState(false);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: Number(e.target.value) });
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

	/*
	UI events:
		- When the user selects a new rate from the dropdown,`rate` is updated.
		- If the user selects the custom value option, `showCustomInput` is set to true.
		- When the user enters a custom value, `customRate` is updated.
		- The initial value of `customRate` is set to the previously chosen value of `rate`
		- Make sure that when submit button is clicked, that the state.secInRate is set to the correct value.
  */
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

	// Keeps canSave state up to date. Checks if valid and if edit made.
	useEffect(() => {
		// This checks:
		// - Name cannot be blank
		// - If type of unit is suffix there must be a suffix
		// - The rate is set so not the custom input value. This happens if select custom value but don't input with enter.
		// - The custom rate is a positive integer
		const validUnit = state.name !== '' &&
			(state.typeOfUnit !== UnitType.suffix || state.suffix !== '') && state.secInRate !== Number(CUSTOM_INPUT)
			&& state?.minVal >= MIN_VAL && state?.maxVal <= MAX_VAL && state?.minVal <= state?.maxVal
			&& customRateValid(Number(state.secInRate));

		// Compare the local changes to the default values
		const editMade =
			state.name !== defaultValues.name
			|| state.identifier !== defaultValues.identifier
			|| state.typeOfUnit !== defaultValues.typeOfUnit
			|| state.unitRepresent !== defaultValues.unitRepresent
			|| state.displayable !== defaultValues.displayable
			|| state.preferredDisplay !== defaultValues.preferredDisplay
			|| state.secInRate !== defaultValues.secInRate
			|| state.suffix !== defaultValues.suffix
			|| state.note !== defaultValues.note
			|| state.minVal !== defaultValues.minVal
			|| state.maxVal !== defaultValues.maxVal
			|| state.disableChecks !== defaultValues.disableChecks;
		setCanSave(validUnit && editMade);

		// Automatically checks for unsaved changes and addresses the issue
		// of having to manually set the setHasUnsavedChanges
		// If editMade is true, then hasUnsavedChanges will be set to true.
		setHasUnsavedChanges(editMade);
	}, [state]);

	/* End State */

	// Reset the state to default values
	// To be used for the discard changes and save button
	const resetState = () => {
		setState(defaultValues);
		updateRates(state.secInRate);
	};

	const handleShow = () => {
		setShowModal(true);
	};

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};

	// Save
	const handleSaveChanges = () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);
		const submitState = {
			...state,
			// Set default identifier as name if left blank
			identifier: !state.identifier || state.identifier.length === 0 ? state.name : state.identifier,
			// set displayable to none if unit is meter
			displayable: (state.typeOfUnit == UnitType.meter && state.displayable != DisplayableType.none) ? DisplayableType.none : state.displayable,
			// set unit to suffix if suffix is not empty
			typeOfUnit: (state.typeOfUnit != UnitType.suffix && state.suffix != '') ? UnitType.suffix : state.typeOfUnit
		};
		// Add the new unit and update the store
		submitCreateUnit(submitState)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('unit.successfully.create.unit'));
			})
			.catch(() => {
				showErrorNotification(translate('unit.failed.to.create.unit'));
			});
		resetState();
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateUnitView: 'help.admin.unitcreate'
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
						handleSaveChanges();
						handleClose();
					}}
					onCancel={() => setShowUnsavedWarning(false)}
					disabled={!canSave}
				/>
			)}
			{/* Show modal button */}
			<Button color="secondary" onClick={handleShow}>
				<FormattedMessage id="create.unit" />
			</Button>
			<Modal isOpen={showModal} toggle={handleToggle} size="lg">
				<ModalHeader>
					<FormattedMessage id="create.unit" />
					<TooltipHelpComponent page="units-create" />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent
							page="units-create"
							helpTextId={tooltipStyle.tooltipCreateUnitView}
						/>
					</div>
				</ModalHeader>
				{/* when any of the unit properties are changed call one of the functions. */}
				<ModalBody>
					<Container>
						<Row xs="1" lg="2">
							{/* Identifier input */}
							<Col>
								<FormGroup>
									<Label for='identifier'>{translate('identifier')}</Label>
									<Input
										id="identifier"
										name="identifier"
										type="text"
										autoComplete="on"
										onChange={e => {handleStringChange(e);}}
										value={state.identifier}
									/>
								</FormGroup>
							</Col>
							{/* Name input */}
							<Col>
								<FormGroup>
									<Label for="name">{translate('name')}</Label>
									<Input
										id="name"
										name="name"
										type="text"
										autoComplete="on"
										onChange={e => {handleStringChange(e);}}
										value={state.name}
										invalid={state.name === ''}
									/>
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row xs="1" lg="2">
							{/* Type of unit input */}
							<Col>
								<FormGroup>
									<Label for="typeOfUnit">
										{translate('unit.type.of.unit')}
									</Label>
									<Input
										id="typeOfUnit"
										name="typeOfUnit"
										type="select"
										onChange={e => {handleStringChange(e);}}
										value={state.typeOfUnit}
										invalid={state.typeOfUnit != UnitType.suffix && state.suffix != ''}
									>
										{Object.keys(UnitType).map(key => {
											return (
												<option
													value={key}
													key={key}
													disabled={state.suffix != '' && key != UnitType.suffix}
												>
													{translate(`UnitType.${key}`)}
												</option>
											);
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
									<Label for="unitRepresent">
										{translate('unit.represent')}
									</Label>
									<Input
										id="unitRepresent"
										name="unitRepresent"
										type="select"
										onChange={e => {handleStringChange(e);}}
										value={state.unitRepresent}
									>
										{Object.keys(UnitRepresentType).map(key => {
											return (
												<option value={key} key={key}>
													{translate(`UnitRepresentType.${key}`)}
												</option>
											);
										})}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs="1" lg="2">
							{/* Displayable type input */}
							<Col>
								<FormGroup>
									<Label for="displayable">{translate('displayable')}</Label>
									<Input
										id="displayable"
										name="displayable"
										type="select"
										onChange={e => {handleStringChange(e);}}
										value={state.displayable}
										invalid={
											state.displayable != DisplayableType.none &&
											(state.typeOfUnit == UnitType.meter || state.suffix != '')
										}
									>
										{Object.keys(DisplayableType).map(key => {
											return (
												<option
													value={key}
													key={key}
													disabled={
														(state.typeOfUnit == UnitType.meter || state.suffix != '') &&
														key != DisplayableType.none
													}
												>
													{translate(`DisplayableType.${key}`)}
												</option>
											);
										})}
									</Input>
									<FormFeedback>
										{state.displayable !== DisplayableType.none && state.typeOfUnit == UnitType.meter ? (
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
									<Label for="preferredDisplay">
										{translate('unit.preferred.display')}
									</Label>
									<Input
										id="preferredDisplay"
										name="preferredDisplay"
										type="select"
										onChange={e => {handleBooleanChange(e);}}
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
							</Col>
						</Row>
						<Row xs="1" lg="2">
							{/* Seconds in rate input */}
							<Col>
								<FormGroup>
									<Label for="secInRate">{translate('unit.sec.in.rate')}</Label>
									<Input
										id="secInRate"
										name="secInRate"
										type="select"
										value={rate}
										onChange={e => {handleRateChange(e);}}
									>
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
												onChange={e => {handleCustomRateChange(e);}}
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
									<Label for="suffix">{translate('unit.suffix')}</Label>
									<Input
										id="suffix"
										name="suffix"
										type="text"
										value={state.suffix}
										onChange={e => {handleStringChange(e);}}
										invalid={state.typeOfUnit === UnitType.suffix && state.suffix === ''
										}
									/>
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							{/* minVal input */}
							<Col><FormGroup>
								<Label for='minVal'>{translate('min.value')}</Label>
								<Input id='minVal' name='minVal' type='number'
									onChange={e => {handleNumberChange(e);}}
									min={MIN_VAL}
									max={state.maxVal}
									value={state.minVal}
									invalid={state?.minVal < MIN_VAL || state?.minVal > state?.maxVal} />
								<FormFeedback>
									<FormattedMessage id="error.bounds" values={{ min: MIN_VAL, max: state.maxVal }} />
								</FormFeedback>
							</FormGroup></Col>
							{/* maxVal input */}
							<Col><FormGroup>
								<Label for='maxVal'>{translate('max.value')}</Label>
								<Input id='maxVal' name='maxVal' type='number'
									onChange={e => {handleNumberChange(e);}}
									min={state.minVal}
									max={MAX_VAL}
									value={state.maxVal}
									invalid={state?.maxVal > MAX_VAL || state?.minVal > state?.maxVal} />
								<FormFeedback>
									<FormattedMessage id="error.bounds" values={{ min: state.minVal, max: MAX_VAL }} />
								</FormFeedback>
							</FormGroup></Col>
						</Row>
						<Row xs='1' lg='2'>
							{/* DisableChecks input */}
							<Col><FormGroup>
								<Label for='disableChecks'>{translate('disable.checks')}</Label>
								<Input id='disableChecks' name='disableChecks' type='select'
									onChange={e => {handleStringChange(e);}}
									value={state.disableChecks}>
									{Object.keys(DisableChecksType).map(key => {
										return (<option value={key} key={key} >
											{translate(`DisableChecksType.${key}`)}</option>);
									})}
								</Input>
							</FormGroup></Col>
						</Row>
						{/* Note input */}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={state.note}
								onChange={e => {handleStringChange(e);}} />
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{/* Hides the modal */}
					<Button color="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color="primary" onClick={handleSaveChanges} disabled={!canSave}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

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
import { UnitRepresentType, DisplayableType, UnitType } from '../../types/redux/units';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { unitsApi } from '../../redux/api/unitsApi';
import { useTranslate } from '../../redux/componentHooks';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { LineGraphRates } from '../../types/redux/graph';
import { customRateValid } from '../../utils/unitInput';

/**
 * Defines the create unit modal form
 * @returns Unit create element
 */
export default function CreateUnitModalComponent() {
	const translate = useTranslate();
	const [submitCreateUnit] = unitsApi.useAddUnitMutation();
	const defaultValues = {
		name: '',
		identifier: '',
		typeOfUnit: UnitType.unit,
		unitRepresent: UnitRepresentType.quantity,
		displayable: DisplayableType.all,
		preferredDisplay: true,
		secInRate: 3600,
		suffix: '',
		note: '',
		// These two values are necessary but are not used.
		// The client code makes the id for the selected unit and default graphic unit be -99
		// so it can tell it is not yet assigned and do the correct logic for that case.
		// The units API expects these values to be undefined on call so that the database can assign their values.
		id: -99
	};
	/* State */
	// Unlike EditUnitModalComponent, there are no props so we don't pass show and close via props.
	// Modal show
	const CUSTOM_INPUT = '-99';
	const [showModal, setShowModal] = useState(false);
	// Handlers for each type of input change
	const [state, setState] = useState(defaultValues);
	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};
	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	};
	// Sets the starting rate for secInRate box, value of 3600 is chosen as default to result in Hour as default in dropdown box.
	const [rate, setRate] = useState(String(defaultValues.secInRate));
	// Holds the value during custom value input and it is separate from standard choices.
	// Needs to be valid at start and overwritten before used.
	const [customRate, setCustomRate] = useState(1);
	// should only update customRate when save all is clicked
	// This should keep track of rate's value and set custom rate equal to it when custom rate is clicked
	// This should set customRate's data to
	// True if custom value input is active.
	const [showCustomInput, setShowCustomInput] = useState(false);
	/*
	UI events:
		- When the user selects a new rate from the dropdown,`rate` is updated.
		- If the user selects the custom value option, `showCustomInput` is set to true.
		- When the user enters a custom value, `customRate` is updated.
		- The initial value of `customRate` is set to the previously chosen value of `rate`
		- Make sure that when submit button is clicked, that the state.secInRate is set to the correct value.
  */
	const handleStandardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		// Check if the custom value option is selected
		if (value === CUSTOM_INPUT) {
			setCustomRate(Number(rate));
			setRate(CUSTOM_INPUT);
			setShowCustomInput(true);
		} else {
			setRate(value);
			setState({ ...state, [e.target.name]: Number(value) });
			setShowCustomInput(false);
		}
	};
	const handleCustomRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		setCustomRate(Number(value));
		setState({ ...state, secInRate: Number(value) });
	};

	const handleEnter = (key: string) => {
		// This detects the enter key and then uses the previously entered custom
		// rate to set the rate as a new value.
		if (key === 'Enter') {
			// Form only allows integers so this should be safe.
			setState({ ...state, secInRate: Number(customRate) });
		}
	};
	// ?? Note this switches from custom to standard if click off modal and then return. Not a big deal
	//    but differs from edit that track specially. If make logic similar then can avoid.
	/* Create Unit Validation:
		Name cannot be blank
		Sec in Rate must be greater than zero
		If type of unit is suffix their must be a suffix
	*/
	const [validUnit, setValidUnit] = useState(false);
	useEffect(() => {
		setValidUnit(
			state.name !== '' && (state.typeOfUnit !== UnitType.suffix
				|| state.suffix !== '') && customRateValid(Number(state.secInRate))
		);
	}, [state.name, state.secInRate, state.typeOfUnit, state.suffix]);

	/* End State */

	// Reset the state to default values
	// To be used for the discard changes and save button
	const resetState = () => {
		setState(defaultValues);
		resetCustomRate();
	};

	const handleShow = () => setShowModal(true);

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};

	// ?? removed from edit but need to see if aligning logic.
	// Helper function to reset custom rate interval box.
	const resetCustomRate = () => {
		setRate(String(defaultValues.secInRate));
		setShowCustomInput(false);
	};
	// Unlike edit, we decided to discard inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Save
	const handleSave = () => {
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
			{/* Show modal button */}
			<Button color="secondary" onClick={handleShow}>
				<FormattedMessage id="create.unit" />
			</Button>
			<Modal isOpen={showModal} toggle={handleClose} size="lg">
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
									<Label for="identifier">{translate('identifier')}</Label>
									<Input
										id="identifier"
										name="identifier"
										type="text"
										autoComplete="on"
										onChange={e => handleStringChange(e)}
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
										onChange={e => handleStringChange(e)}
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
										onChange={e => handleStringChange(e)}
										value={state.typeOfUnit}
										invalid={
											state.typeOfUnit != UnitType.suffix && state.suffix != ''
										}
									>
										{Object.keys(UnitType).map(key => {
											return (
												<option
													value={key}
													key={key}
													disabled={
														state.suffix != '' && key != UnitType.suffix
													}>
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
										onChange={e => handleStringChange(e)}
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
										onChange={e => handleStringChange(e)}
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
														(state.typeOfUnit == UnitType.meter ||
															state.suffix != '') &&
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
										onChange={e => handleBooleanChange(e)}
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
							//?? 2 lines or 1?
							<Col>
								<FormGroup>
									<Label for="secInRate">{translate('unit.sec.in.rate')}</Label>
									<Input
										id="secInRate"
										name="secInRate"
										type="select"
										onChange={e => handleStandardNumberChange(e)}
										value={rate}>
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
										autoComplete="off"
										onChange={e => handleStringChange(e)}
										value={state.suffix}
										invalid={
											state.typeOfUnit === UnitType.suffix &&
											state.suffix === ''
										}
									/>
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						{/* Note input */}
						<FormGroup>
							<Label for="note">{translate('note')}</Label>
							<Input
								id="note"
								name="note"
								type="textarea"
								onChange={e => handleStringChange(e)}
								value={state.note}
							/>
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{/* Hides the modal */}
					<Button color="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color="primary" onClick={handleSave} disabled={!validUnit}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

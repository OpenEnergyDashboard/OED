/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { Button, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import '../../styles/modal.css';
import { TrueFalseType } from '../../types/items';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { UnitRepresentType, DisplayableType, UnitType } from '../../types/redux/units';
import { addUnit } from '../../actions/units';
import { tableStyle, tooltipBaseStyle } from '../../styles/modalStyle';

export default function CreateUnitModalComponent() {
	const dispatch = useDispatch();

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
		id: -99,
		unitIndex: -99
	}

	/* State */
	// Unlike EditUnitModalComponent, there are no props so we don't pass show and close via props.
	// Modal show
	const [showModal, setShowModal] = useState(false);
	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => setShowModal(true);

	// Handlers for each type of input change
	const [state, setState] = useState(defaultValues);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	}

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	}

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: Number(e.target.value) });
	}

	/* Create Unit Validation:
		Name cannot be blank
		Sec in Rate must be greater than zero
	*/
	const [validUnit, setValidUnit] = useState(false);
	useEffect(() => {
		setValidUnit(state.name !== '' && state.secInRate > 0);
	}, [state.name, state.secInRate]);
	/* End State */

	// Reset the state to default values
	const resetState = () => {
		setState(defaultValues);
	}

	// Unlike edit, we decided to discard inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Submit
	const handleSubmit = () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);
		// Set default identifier as name if left blank
		state.identifier = (!state.identifier || state.identifier.length === 0) ? state.name : state.identifier;
		// Add the new unit and update the store
		dispatch(addUnit(state));
		resetState();
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateUnitView: 'help.admin.unitcreate'
	};

	return (
		<>
			{/* Show modal button */}
			<Button onClick={handleShow}>
				<FormattedMessage id="create.unit" />
			</Button>
			<Modal isOpen={showModal} toggle={handleClose}>
				<ModalHeader>
					<FormattedMessage id="create.unit" />
					<TooltipHelpContainer page='units-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='units-create' helpTextId={tooltipStyle.tooltipCreateUnitView} />
					</div>
				</ModalHeader>
				{/* when any of the unit properties are changed call one of the functions. */}
				<ModalBody style={tableStyle}>
					{/* Identifier input */}
					<FormGroup>
						<Label for='identifier'>{translate('unit.identifier')}</Label>
						<Input
							id='identifier'
							name='identifier'
							type='text'
							autoComplete='on'
							onChange={e => handleStringChange(e)}
							value={state.identifier} />
					</FormGroup>
					{/* Name input */}
					<FormGroup>
						<Label for='name'>{translate('unit.name')}</Label>
						<Input
							id='name'
							name='name'
							type='text'
							autoComplete='on'
							onChange={e => handleStringChange(e)}
							value={state.name}
							invalid={state.name === ''}/>
						<FormFeedback>
							<FormattedMessage id="error.required" />
						</FormFeedback>
					</FormGroup>
					{/* Type of unit input */}
					<FormGroup>
						<Label for='typeOfUnit'>{translate('unit.type.of.unit')}</Label>
						<Input
							id='typeOfUnit'
							name='typeOfUnit'
							type='select'
							onChange={e => handleStringChange(e)}
							value={state.typeOfUnit}>
							{Object.keys(UnitType).map(key => {
								return (<option value={key} key={key}>{translate(`UnitType.${key}`)}</option>)
							})}
						</Input>
					</FormGroup>
					{/* Unit represent input */}
					<FormGroup>
						<Label for='unitRepresent'>{translate('unit.represent')}</Label>
						<Input
							id='unitRepresent'
							name='unitRepresent'
							type='select'
							onChange={e => handleStringChange(e)}
							value={state.unitRepresent}>
							{Object.keys(UnitRepresentType).map(key => {
								return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>)
							})}
						</Input>
					</FormGroup>
					{/* Displayable type input */}
					<FormGroup>
						<Label for='displayable'>{translate('unit.dropdown.displayable')}</Label>
						<Input
							id='displayable'
							name='displayable'
							type='select'
							onChange={e => handleStringChange(e)}
							value={state.displayable} >
							{Object.keys(DisplayableType).map(key => {
								return (<option value={key} key={key}>{translate(`DisplayableType.${key}`)}</option>)
							})}
						</Input>
					</FormGroup>
					{/* Preferred display input */}
					<FormGroup>
						<Label for='preferredDisplay'>{translate('unit.preferred.display')}</Label>
						<Input
							id='preferredDisplay'
							name='preferredDisplay'
							type='select'
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
							})}
						</Input>
					</FormGroup>
					{/* Seconds in rate input */}
					<FormGroup>
						<Label for='secInRate'>{translate('unit.sec.in.rate')}</Label>
						<Input
							id='secInRate'
							name='secInRate'
							type='number'
							onChange={e => handleNumberChange(e)}
							defaultValue={state.secInRate}
							min="1"
							invalid={state.secInRate < 1} />
						<FormFeedback>
							<FormattedMessage id="error.greater" values={{ min: '1'}}  />
						</FormFeedback>
					</FormGroup>
					{/* Suffix input */}
					<FormGroup>
						<Label for='suffix'>{translate('unit.suffix')}</Label>
						<Input
							id='suffix'
							name='suffix'
							type='text'
							autoComplete='off'
							onChange={e => handleStringChange(e)}
							value={state.suffix} />
					</FormGroup>
					{/* Note input */}
					<FormGroup>
						<Label for='note'>{translate('unit.note')}</Label>
						<Input
							id='note'
							name='note'
							type='textarea'
							onChange={e => handleStringChange(e)}
							value={state.note} />
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					{/* Hides the modal */}
					<Button onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} disabled={!validUnit}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

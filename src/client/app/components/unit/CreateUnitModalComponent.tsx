/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import '../../styles/Modal.unit.css';
import { UnitRepresentType, DisplayableType, UnitType } from '../../types/redux/units';
import { useDispatch } from 'react-redux';
import { addUnit } from '../../actions/units';
import { useState } from 'react';

export default function CreateUnitModalComponent() {

	const dispatch = useDispatch();

	const defaultValues = {
		name: '',
		identifier: '',
		typeOfUnit: UnitType.unit,
		unitRepresent: UnitRepresentType.quantity,
		displayable: DisplayableType.all,
		preferredDisplay: false,
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
	// We can definitely sacrifice readibility here (and in the render) to consolidate these into a single function if need be
	// NOTE a lot of this is copied from the UnitModalEditComponent, in the future we could make a single component to handle all edit pages if need be

	// Modal show
	const [showModal, setShowModal] = useState(false);
	const handleClose = () => setShowModal(false);
	const handleShow = () => setShowModal(true);

	// name
	const [name, setName] = useState(defaultValues.name);
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
	}

	// identifier
	const [identifier, setIdentifier] = useState(defaultValues.identifier);
	const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIdentifier(e.target.value);
	}

	// typeOfUnit
	const [typeOfUnit, setTypeOfUnit] = useState(defaultValues.typeOfUnit);
	const handleTypeOfUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTypeOfUnit(e.target.value as UnitType);
	}

	// unitRepresent
	const [unitRepresent, setUnitRepresent] = useState(defaultValues.unitRepresent);
	const handleUnitRepresentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUnitRepresent(e.target.value as UnitRepresentType)
	}

	// displayable
	const [displayable, setDisplayable] = useState(defaultValues.displayable);
	const handleDisplayableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDisplayable(e.target.value as DisplayableType);
	}

	// preferredDisplay
	const [preferredDisplay, setPreferredDisplay] = useState(defaultValues.preferredDisplay);
	const handlePreferredDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPreferredDisplay(JSON.parse(e.target.value));
	}

	// secInRate
	const [secInRate, setSecInRate] = useState(defaultValues.secInRate);
	const handleSecInRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSecInRate(Number(e.target.value));
	}

	// suffix
	const [suffix, setSuffix] = useState(defaultValues.suffix);
	const handleSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSuffix(e.target.value);
	}

	// note
	const [note, setNote] = useState(defaultValues.note);
	const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNote(e.target.value);
	}
	/* End State */

	// Reset the state to default values
	// This would also benefit from a single state changing function for all state
	const resetState = () => {
		setName(defaultValues.name);
		setIdentifier(defaultValues.identifier);
		setTypeOfUnit(defaultValues.typeOfUnit);
		setUnitRepresent(defaultValues.unitRepresent);
		setDisplayable(defaultValues.displayable);
		setPreferredDisplay(defaultValues.preferredDisplay);
		setSecInRate(defaultValues.secInRate);
		setSuffix(defaultValues.suffix);
		setNote(defaultValues.note);
	}

	// Submit
	const handleSubmit = () => {

		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// New unit object, overwrite all unchanged props with state
		const newUnit = {
			...defaultValues,
			name,
			identifier,
			typeOfUnit,
			unitRepresent,
			displayable,
			preferredDisplay,
			secInRate,
			suffix,
			note
		}

		// Add the new unit and update the store
		dispatch(addUnit(newUnit));
		resetState();
	};

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}

	const tableStyle: React.CSSProperties = {
		marginLeft: '25%',
		marginRight: '25%',
		width: '50%'
	};

	return (
		<>
			{/* Show modal button */}
			<Button variant="Secondary" onClick={handleShow}>
				<FormattedMessage id="create.unit" />
			</Button>

			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="create.unit" /></Modal.Title>
				</Modal.Header>
				{/* TODO: Styling of the form could use some work to make textboxes bigger, etc */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div style={tableStyle}>
									{/* Name input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.name" /></label><br />
										<Input type='text' onChange={e => handleNameChange(e)} required value={name} />
									</div>
									{/* Identifier input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.identifier" /></label><br />
										<Input type='text' onChange={e => handleIdentifierChange(e)} required value={identifier} />
									</div>
									{/* Type of input input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.type.of.unit" /></label><br />
										<Input type='select' onChange={e => handleTypeOfUnitChange(e)} required value={typeOfUnit}>
											{Object.keys(UnitType).map(key => {
												return (<option value={key} key={key}>{translate(`UnitType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Unit represent input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.represent" /></label><br />
										<Input type='select' onChange={e => handleUnitRepresentChange(e)} required value={unitRepresent}>
											{Object.keys(UnitRepresentType).map(key => {
												return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Displayable type input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.dropdown.displayable" /></label><br />
										<Input type='select' onChange={e => handleDisplayableChange(e)} required value={displayable} >
											{Object.keys(DisplayableType).map(key => {
												return (<option value={key} key={key}>{translate(`DisplayableType.${key}`)}</option>)
											})}
										</Input>
									</div>
									{/* Preferred display input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.preferred.display" /></label>
										<Input type='select' onChange={e => handlePreferredDisplayChange(e)}>
											<option value="true"> {translate('yes')} </option>
											<option value="false"> {translate('no')} </option>
										</Input>
									</div>
									{/* Seconds in rate input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.sec.in.rate" /></label><br />
										<Input type='number' onChange={e => handleSecInRateChange(e)} required value={secInRate} />
									</div>
									{/* Suffix input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.suffix" /></label><br />
										<Input type='text' onChange={e => handleSuffixChange(e)} required value={suffix} />
									</div>
									{/* Note input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.note.optional" /></label><br />
										<Input type='textarea' onChange={e => handleNoteChange(e)} value={note} />
									</div>
								</div>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					<Button variant="primary" onClick={handleSubmit}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

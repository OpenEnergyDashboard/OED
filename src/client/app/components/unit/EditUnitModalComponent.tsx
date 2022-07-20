/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { UnitData, DisplayableType, UnitRepresentType, UnitType } from '../../types/redux/units';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import { useDispatch } from 'react-redux';
import { submitEditedUnit } from '../../actions/units';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
// I realize that * is already imported from react
import { useState } from 'react';
import '../../styles/Modal.unit.css';
import { TrueFalseType } from '../../types/items';

interface EditUnitModalComponentProps {
	show: boolean;
	unit: UnitData;
	// passed in to handle closing the modal
	handleClose: () => void;
}

// Updated to hooks
export default function EditUnitModalComponent(props: EditUnitModalComponentProps) {

	const dispatch = useDispatch();

	const values = {
		name: props.unit.name,
		identifier: props.unit.identifier,
		typeOfUnit: props.unit.typeOfUnit,
		unitRepresent: props.unit.unitRepresent,
		displayable: props.unit.displayable,
		preferredDisplay: props.unit.preferredDisplay,
		secInRate: props.unit.secInRate,
		suffix: props.unit.suffix,
		note: props.unit.note,
		id: props.unit.id,
		unitIndex: props.unit.unitIndex
	}

	/* State */
	// We can definitely sacrifice readibility here (and in the render) to consolidate these into a single function if need be

	const [state, setState] = useState(values);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	}

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	}

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: Number(e.target.value) });
	}

	// name
	// const [name, setName] = useState(props.unit.name);
	// const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setName(e.target.value);
	// }

	// // identifier
	// const [identifier, setIdentifier] = useState(props.unit.identifier);
	// const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setIdentifier(e.target.value);
	// }

	// // typeOfUnit
	// const [typeOfUnit, setTypeOfUnit] = useState(props.unit.typeOfUnit);
	// const handleTypeOfUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setTypeOfUnit(e.target.value as UnitType);
	// }

	// // unitRepresent
	// const [unitRepresent, setUnitRepresent] = useState(props.unit.unitRepresent);
	// const handleUnitRepresentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setUnitRepresent(e.target.value as UnitRepresentType)
	// }

	// // displayable
	// const [displayable, setDisplayable] = useState(props.unit.displayable);
	// const handleDisplayableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setDisplayable(e.target.value as DisplayableType);
	// }

	// // preferredDisplay
	// const [preferredDisplay, setPreferredDisplay] = useState(props.unit.preferredDisplay);
	// const handlePreferredDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setPreferredDisplay(JSON.parse(e.target.value));
	// }

	// // secInRate
	// const [secInRate, setSecInRate] = useState(props.unit.secInRate);
	// const handleSecInRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setSecInRate(Number(e.target.value));

	// }

	// // suffix
	// const [suffix, setSuffix] = useState(props.unit.suffix);
	// const handleSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setSuffix(e.target.value);
	// }

	// // note
	// const [note, setNote] = useState(props.unit.note);
	// const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setNote(e.target.value);
	// }
	/* End State */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateUnitModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit units will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setState(values);
	}

	const handleClose = () => {
		props.handleClose();
		resetState();
	}

	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input i
	const handleSaveChanges = () => {

		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// Check for changes by comparing state to props
		const unitHasChanges =
			(
				props.unit.name != state.name ||
				props.unit.identifier != state.identifier ||
				props.unit.typeOfUnit != state.typeOfUnit ||
				props.unit.unitRepresent != state.unitRepresent ||
				props.unit.displayable != state.displayable ||
				props.unit.preferredDisplay != state.preferredDisplay ||
				props.unit.secInRate != state.secInRate ||
				props.unit.suffix != state.suffix ||
				props.unit.note != state.note);
		// Only do work if there are changes
		if (unitHasChanges) {
			// const editedUnit = {
			// 	...props.unit,
			// 	state
			// }
			// Save our changes by dispatching the submitEditedUnit action
			dispatch(submitEditedUnit(state));
			// The updated unit is not fetched to save time. However, the identifier might have been
			// automatically set if it was empty. Mimic that here.
			if (state.identifier === '') {
				state.identifier = state.name;
			}
			dispatch(removeUnsavedChanges());
		}

	}

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '60%',
		// For now, it uses the same help text from unit view page.
		tooltipEditUnitView: 'help.admin.unitview'
	};

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}

	const tableStyle: React.CSSProperties = {
		width: '100%'
	};

	return (
		<>

			<Modal show={props.show} onHide={props.handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="edit.unit" />
						<TooltipHelpContainer page='units' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='units' helpTextId={tooltipStyle.tooltipEditUnitView} />
						</div>
					</Modal.Title>
				</Modal.Header>
				{/* when any of the unit are changed call one of the functions. */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div style={tableStyle}>
									{/* Identifier input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.identifier" /></label><br />
										<Input
											name="identifier"
											type="text"
											onChange={e => handleStringChange(e)}
											defaultValue={state.identifier}
											placeholder="Identifier" />
										<div />
										{/* Name input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.name" /></label><br />
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												required value={state.name} />
										</div>
										{/* Type of input input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.type.of.unit" /></label><br />
											<Input
												name='typeOfUnit'
												type='select'
												onChange={e => handleStringChange(e)}>
												defaultValue={state.typeOfUnit}
												{Object.keys(UnitType).map(key => {
													return (<option value={key} key={key}>{translate(`UnitType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Unit represent input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.represent" /></label><br />
											<Input
												name='unitRepresent'
												type='select'
												defaultValue={state.unitRepresent}
												onChange={e => handleStringChange(e)}>
												{Object.keys(UnitRepresentType).map(key => {
													return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Displayable type input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.displayable" /></label><br />
											<Input
												name='displayable'
												type='select'
												defaultValue={state.displayable}
												onChange={e => handleStringChange(e)}>
												{Object.keys(DisplayableType).map(key => {
													return (<option value={key} key={key}>{translate(`DisplayableType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Preferred display input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.preferred.display" /></label><br />
											<Input
												name='preferredDisplay'
												type='select'
												defaultValue={state.preferredDisplay.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Seconds in rate input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.sec.in.rate" /></label><br />
											<Input
<<<<<<< Updated upstream
												type="number"												
												defaultValue={secInRate}
												onChange={e => handleSecInRateChange(e)}
												placeholder="Sec In Rate" 
												min="1"
												//TODO validate negative input for rate
												oninput="validity.valid||(value='');"/>
=======
												name='secInRate'
												type="number"
												defaultValue={state.secInRate}
												onChange={e => handleNumberChange(e)}
												placeholder="Sec In Rate" />
>>>>>>> Stashed changes
										</div>
										{/* Suffix input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.suffix" /></label><br />
											<Input
												name="suffix"
												type="text"
												defaultValue={state.suffix}
												placeholder="Suffix"
												onChange={e => handleStringChange(e)} />
										</div>
										{/* Note input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.note" /></label><br />
											<Input
												name="note"
												type="textarea"
												defaultValue={state.note}
												placeholder="Note"
												onChange={e => handleStringChange(e)} />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					{/* Hides the modal */}
					<Button variant="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button variant="primary" onClick={handleSaveChanges} disabled={!state.name}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}
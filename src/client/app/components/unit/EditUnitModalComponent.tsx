/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import store from '../../index';
//Realize that * is already imported from react
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import '../../styles/modal.css';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import { submitEditedUnit } from '../../actions/units';
import { UnitData, DisplayableType, UnitRepresentType, UnitType } from '../../types/redux/units';
import { TrueFalseType } from '../../types/items';
import { notifyUser } from '../../utils/input'
import { formInputStyle, tableStyle, requiredStyle, tooltipBaseStyle } from '../../styles/modalStyle';

interface EditUnitModalComponentProps {
	show: boolean;
	unit: UnitData;
	// passed in to handle closing the modal
	handleClose: () => void;
}

/**
 * Defines the edit unit modal form
 * @param props props for component
 * @returns Unit edit element
 */
export default function EditUnitModalComponent(props: EditUnitModalComponentProps) {
	const dispatch = useDispatch();

	// Set existing unit values
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
	// Handlers for each type of input change
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

	// Validate the changes and return true if we should update this unit.
	// Two reasons for not updating the unit:
	//  0. The rate is not greater than 0.
	//	1. typeOfUnit is changed from meter to something else while some meters are still linked with this unit
	//	2. There are no changes
	const shouldUpdateUnit = (): boolean => {
		// true if inputted values are okay and there are changes.
		let inputOk = true;

		// Check for case 0
		if (state.secInRate <= 0) {
			notifyUser(`${translate('unit.rate.error')} ${state.secInRate}.`);
			inputOk = false;
		}

		// Check for case 1
		if (props.unit.typeOfUnit === UnitType.meter && state.typeOfUnit !== UnitType.meter) {
			// Get an array of all meters
			const meters = Object.values(store.getState().meters.byMeterID);
			const meter = meters.find(m => m.unitId === props.unit.id);
			if (meter) {
				// There exists a meter that is still linked with this unit
				notifyUser(`${translate('the.unit.of.meter')} ${meter.name} ${translate('meter.unit.change.requires')}`);
				inputOk = false;
			}
		}
		if (inputOk) {
			// The input passed validation so check if changes exist.
			// Check for case 2 by comparing state to props
			return props.unit.name != state.name
				|| props.unit.identifier != state.identifier
				|| props.unit.typeOfUnit != state.typeOfUnit
				|| props.unit.unitRepresent != state.unitRepresent
				|| props.unit.displayable != state.displayable
				|| props.unit.preferredDisplay != state.preferredDisplay
				|| props.unit.secInRate != state.secInRate
				|| props.unit.suffix != state.suffix
				|| props.unit.note != state.note;
		} else {
			// Tell user that not going to update due to input issues.
			notifyUser(`${translate('unit.input.error')}`);
			return false;
		}
	}

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
			// Save our changes by dispatching the submitEditedUnit action
			dispatch(submitEditedUnit(state, shouldRedoCik, shouldRefreshReadingViews));
			// The updated unit is not fetched to save time. However, the identifier might have been
			// automatically set if it was empty. Mimic that here.
			if (state.identifier === '') {
				state.identifier = state.name;
			}
			dispatch(removeUnsavedChanges());
		}
	}

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditUnitView: 'help.admin.unitedit'
	};

	return (
		<>
			<Modal show={props.show} onHide={props.handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="edit.unit" />
						<TooltipHelpContainer page='units-edit' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='units-edit' helpTextId={tooltipStyle.tooltipEditUnitView} />
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
									{/* Identifier input */}
									<div style={formInputStyle}>
										<label><FormattedMessage id="unit.identifier" /></label><br />
										<Input
											name="identifier"
											type="text"
											onChange={e => handleStringChange(e)}
											value={state.identifier}
											placeholder="Identifier" />
										<div />
										{/* Name input */}
										<div style={formInputStyle}>
											<label>{translate('unit.name')} <label style={requiredStyle}>*</label></label>
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												value={state.name} />
										</div>
										{/* Type of unit input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.type.of.unit" /></label><br />
											<Input
												name='typeOfUnit'
												type='select'
												onChange={e => handleStringChange(e)}
												value={state.typeOfUnit}>
												{Object.keys(UnitType).map(key => {
													return (<option value={key} key={key}>{translate(`UnitType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Unit represent input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.represent" /></label><br />
											<Input
												name='unitRepresent'
												type='select'
												value={state.unitRepresent}
												onChange={e => handleStringChange(e)}>
												{Object.keys(UnitRepresentType).map(key => {
													return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Displayable type input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.displayable" /></label><br />
											<Input
												name='displayable'
												type='select'
												value={state.displayable}
												onChange={e => handleStringChange(e)}>
												{Object.keys(DisplayableType).map(key => {
													return (<option value={key} key={key}>{translate(`DisplayableType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Preferred display input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.preferred.display" /></label><br />
											<Input
												name='preferredDisplay'
												type='select'
												value={state.preferredDisplay.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Seconds in rate input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.sec.in.rate" /></label><br />
											<Input
												name='secInRate'
												type="number"
												value={state.secInRate}
												onChange={e => handleNumberChange(e)}
												placeholder="Sec In Rate"
												// TODO validate negative input by typing for rate but database stops it.
												// This stops negative input by use of arrows to change value.
												min="1" />
										</div>
										{/* Suffix input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.suffix" /></label><br />
											<Input
												name="suffix"
												type="text"
												value={state.suffix}
												placeholder="Suffix"
												onChange={e => handleStringChange(e)} />
										</div>
										{/* Note input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="unit.note" /></label><br />
											<Input
												name="note"
												type="textarea"
												value={state.note}
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
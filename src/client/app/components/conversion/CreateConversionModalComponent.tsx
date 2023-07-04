/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import '../../styles/modal.css';
import { TrueFalseType } from '../../types/items';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { addConversion } from '../../actions/conversions';
import { UnitDataById } from 'types/redux/units';
import { ConversionData } from 'types/redux/conversions';
import { UnitType } from '../../types/redux/units';
import { notifyUser } from '../../utils/input'
import * as _ from 'lodash';
import { tooltipBaseStyle } from '../../styles/modalStyle';

interface CreateConversionModalComponentProps {
	conversionsState: ConversionData[];
	unitsState: UnitDataById;
}
/**
 * Defines the create conversion modal form
 * @param props Props for the component
 * @returns Conversion create element
 */
export default function CreateConversionModalComponent(props: CreateConversionModalComponentProps) {

	const dispatch = useDispatch();

	const defaultValues = {
		// Invalid source/destination ids arbitrarily set to -999.
		sourceId: -999,
		destinationId: -999,
		bidirectional: true,
		slope: 0,
		intercept: 0,
		note: ''
	}

	/* State */
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

	// If the currently selected conversion is valid
	const [validConversion, setValidConversion] = useState(false);
	/* End State */

	//Update the valid conversion state any time the source id, destination id, or bidirectional status changes
	useEffect(() => {
		setValidConversion(isValidConversion(state.sourceId, state.destinationId, state.bidirectional));
	}, [state.sourceId, state.destinationId, state.bidirectional]);

	// Reset the state to default values
	const resetState = () => {
		setState(defaultValues);
	}

	/**
	 * Checks if conversion is valid
	 * @param sourceId New conversion sourceId
	 * @param destinationId New conversion destinationId
	 * @param bidirectional New conversion bidirectional status
	 * @returns boolean representing if new conversion is valid or not
	 */
	const isValidConversion = (sourceId: number, destinationId: number, bidirectional: boolean) => {
		/*
			Source equals destination: invalid conversion
			Conversion exists: invalid conversion
			Conversion does not exist:
				Inverse exists:
					Conversion is bidirectional: invalid conversion
			Destination cannot be a meter
			Cannot mix unit represent

			TODO Some of these can go away when we make the menus dynamic.
		*/

		// The destination cannot be a meter unit.
		if (destinationId !== -999 && props.unitsState[destinationId].typeOfUnit === UnitType.meter) {
			notifyUser(translate('conversion.create.destination.meter'));
			return false;
		}

		// Source or destination not set
		if (sourceId === -999 || destinationId === -999) {
			return false
		}

		// Source equals destination: invalid conversion
		if (sourceId === destinationId) {
			notifyUser(translate('conversion.create.source.destination.same'));
			return false
		}

		// Conversion already exists
		if ((props.conversionsState.findIndex(conversionData => ((
			conversionData.sourceId === state.sourceId) &&
			conversionData.destinationId === state.destinationId))) !== -1) {
			notifyUser(translate('conversion.create.exists'));
			return false;
		}

		// You cannot have a conversion between units that differ in unit_represent.
		// This means you cannot mix quantity, flow & raw.
		if (props.unitsState[sourceId].unitRepresent !== props.unitsState[destinationId].unitRepresent) {
			notifyUser(translate('conversion.create.mixed.represent'));
			return false;
		}


		let isValid = true;
		// Loop over conversions and check for existence of inverse of conversion passed in
		// If there exists an inverse that is bidirectional, then there is no point in making a conversion since it is essentially a duplicate.
		// If there is a non bidirectional inverse, then it is a valid conversion
		Object.values(props.conversionsState).forEach(conversion => {
			// Inverse exists
			if ((conversion.sourceId === destinationId) && (conversion.destinationId === sourceId)) {
				// Inverse is bidirectional
				if (conversion.bidirectional) {
					isValid = false;
				}
				// Inverse is not bidirectional
				else {
					// Do not allow for a bidirectional conversion with an inverse that is not bidirectional
					if (bidirectional) {
						// The new conversion is bidirectional
						isValid = false;
					}
				}
			}
		});
		if (!isValid) {
			notifyUser(translate('conversion.create.exists.inverse'));
		}
		return isValid;
	}

	// Want units in sorted order by identifier regardless of case.
	const unitsSorted = _.sortBy(Object.values(props.unitsState), unit => unit.identifier.toLowerCase(), 'asc');

	// Unlike edit, we decided to discard and inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Submit
	const handleSubmit = () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);
		// Add the new conversion and update the store
		dispatch(addConversion(state));
		resetState();
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateConversionView: 'help.admin.conversioncreate'
	};

	return (
		<>
			{/* Show modal button */}
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage id="create.conversion" />
			</Button>

			<Modal isOpen={showModal} toggle={handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="create.conversion" />
					<TooltipHelpContainer page='conversions-create' />
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
										defaultValue={-999}
										onChange={e => handleNumberChange(e)}
										invalid={state.sourceId === -999}>
										{<option
											value={-999}
											key={-999}
											hidden={state.sourceId !== -999}
											disabled>
											{translate('conversion.select.source') + '...'}
										</option>}
										{Object.values(unitsSorted).map(unitData => {
											return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>)
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
										defaultValue={-999}
										onChange={e => handleNumberChange(e)}
										invalid={state.destinationId === -999}>
										{<option
											value={-999}
											key={-999}
											hidden={state.destinationId !== -999}
											disabled>
											{translate('conversion.select.destination') + '...'}
										</option>}
										{Object.values(unitsSorted).map(unitData => {
											return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>)
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
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
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
										defaultValue={state.slope}
										onChange={e => handleNumberChange(e)}
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
										onChange={e => handleNumberChange(e)}
										required value={state.intercept} />
								</FormGroup>
							</Col>
						</Row>


						{/* Note input*/}
						<FormGroup>
							<Label for='note'>{translate('conversion.note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={state.note} />
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} disabled={!validConversion}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

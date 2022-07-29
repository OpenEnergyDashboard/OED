/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { MeterData, MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import { useDispatch } from 'react-redux';
import { submitEditedMeter } from '../../actions/meters';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import { useState } from 'react';
import '../../styles/Modal.unit.css';
import { TrueFalseType } from '../../types/items';
import TimeZoneSelect from '../TimeZoneSelect';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';

interface EditMeterModalComponentProps {
	show: boolean;
	meter: MeterData;
	// passed in to handle closing the modal
	handleClose: () => void;
}

// Updated to hooks
export default function EditMeterModalComponent(props: EditMeterModalComponentProps) {

	const dispatch = useDispatch();

	// Set existing meter values
	const values = {
		id: props.meter.id,
		identifier : props.meter.identifier,
		name : props.meter.name,
		area : props.meter.area,
		enabled : props.meter.enabled,
		displayable : props.meter.displayable,
		meterType : props.meter.meterType,
		url : props.meter.url,
		timeZone : props.meter.timeZone,
		gps : props.meter.gps,
		unitId : props.meter.unitId,
		defaultGraphicUnit : props.meter.defaultGraphicUnit,
		note : props.meter.note,
		cumulative : props.meter.cumulative,
		cumulativeReset : props.meter.cumulativeReset,
		cumulativeResetStart : props.meter.cumulativeResetStart,
		cumulativeResetEnd : props.meter.cumulativeResetEnd,
		endOnlyTime : props.meter.endOnlyTime,
		reading : props.meter.reading,
		readingGap : props.meter.readingGap,
		readingVariation : props.meter.readingVariation,
		readingDuplication : props.meter.readingDuplication,
		timeSort : props.meter.timeSort,
		startTimestamp : props.meter.startTimestamp,
		endTimestamp : props.meter.endTimestamp
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

	const handleTimeZoneChange = (timeZone : string ) => {
		setState({ ...state, ['timeZone']: timeZone });
	}

	const handleGpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const coordinates = e.target.value.split(',', 2); //arr of size 2
		coordinates[0] = coordinates[0].trim();
		coordinates[1] = coordinates[1].trim();
		const gps: GPSPoint = {latitude: Number(coordinates[0]), longitude: Number(coordinates[1])}
		setState({ ...state, gps: gps});
	}
	/* End State */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateMeterModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit meters will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
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

		if (isValidGPSInput(`${state.gps.latitude}, ${state.gps.longitude}`)) {
			// Close the modal first to avoid repeat clicks
			props.handleClose();

			// Check for changes by comparing state to props
			const meterHasChanges =
			(
				props.meter.identifier != state.identifier ||
				props.meter.name != state.name ||
				props.meter.area != state.area ||
				props.meter.enabled != state.enabled ||
				props.meter.displayable != state.displayable ||
				props.meter.meterType != state.meterType ||
				props.meter.url != state.url ||
				props.meter.timeZone != state.timeZone ||
				props.meter.gps != state.gps ||
				props.meter.unitId != state.unitId ||
				props.meter.defaultGraphicUnit != state.defaultGraphicUnit ||
				props.meter.note != state.note ||
				props.meter.cumulative != state.cumulative ||
				props.meter.cumulativeReset != state.cumulativeReset ||
				props.meter.cumulativeResetStart != state.cumulativeResetStart ||
				props.meter.cumulativeResetEnd != state.cumulativeResetEnd ||
				props.meter.endOnlyTime != state.endOnlyTime ||
				props.meter.reading != state.reading ||
				props.meter.readingGap != state.readingGap ||
				props.meter.readingVariation != state.readingVariation ||
				props.meter.readingDuplication != state.readingDuplication ||
				props.meter.timeSort != state.timeSort ||
				props.meter.startTimestamp != state.startTimestamp ||
				props.meter.endTimestamp != state.endTimestamp );

			// Only do work if there are changes
			if (meterHasChanges) {
			// Save our changes by dispatching the submitEditedMeter action
				dispatch(submitEditedMeter(state));
				// The updated meter is not fetched to save time. However, the identifier might have been
				// automatically set if it was empty. Mimic that here.
				if (state.identifier === '') {
					state.identifier = state.name;
				}
				dispatch(removeUnsavedChanges());
			}
		}
	}

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
					<Modal.Title> <FormattedMessage id="edit.meter" /></Modal.Title>
				</Modal.Header>
				{/* when any of the meter are changed call one of the functions. */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div style={tableStyle}>
									{/* Identifier input*/}
									<div style={formInputStyle}>
										<label><FormattedMessage id="meter.identifier" /></label><br />
										<Input
											name="identifier"
											type="text"
											onChange={e => handleStringChange(e)}
											defaultValue={state.identifier}
											required value={state.identifier}
											placeholder="Identifier" />
										<div />
										{/* Name input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.name" /></label><br />
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												defaultValue={state.name}
												required value={state.name}
												placeholder="Name" />
										</div>
										{/* Area input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.area" /></label><br />
											<Input
												name="area"
												type="number"
												step="0.01"
												min="0"
												defaultValue={state.area}
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* Enabled input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.enabled" /></label><br />
											<Input
												name='enabled'
												type='select'
												defaultValue={state.enabled.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Displayable input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.displayable" /></label><br />
											<Input
												name='displayable'
												type='select'
												defaultValue={state.displayable.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Meter type input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.type" /></label><br />
											<Input
												name='meterType'
												type='select'
												defaultValue={state.meterType}
												onChange={e => handleStringChange(e)}>
												{Object.keys(MeterType).map(key => {
													return (<option value={key} key={key}>{`${key}`}</option>)
												})}
											</Input>
										</div>
										{/* URL input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.url" /></label><br />
											<Input
												name='url'
												type='text'
												onChange={e => handleStringChange(e)}
												defaultValue={state.url}
												placeholder="URL" />
										</div>
										{/* Timezone input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.time.zone" /></label><br />
											<TimeZoneSelect current={state.timeZone} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
										</div>
										{/* GPS input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.gps" /></label><br />
											<Input
												name='gps'
												type='text'
												onChange={e => handleGpsChange(e)}
												defaultValue={`${state.gps?.latitude}, ${state.gps?.longitude}`} />
										</div>
										{/* UnitId input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.unitId" /></label><br />
											<Input
												name="unitId"
												type="number"
												onChange={e => handleNumberChange(e)}
												defaultValue={state.unitId}
												placeholder="unitId" />
										</div>
										{/* DefaultGraphicUnit input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.defaultGraphicUnit" /></label><br />
											<Input
												name="defaultGraphicUnit"
												type="number"
												onChange={e => handleNumberChange(e)}
												defaultValue={state.defaultGraphicUnit}
												placeholder="defaultGraphicUnit" />
										</div>
										{/* note input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.note" /></label><br />
											<Input
												name='note'
												type='textarea'
												onChange={e => handleStringChange(e)}
												defaultValue={state.note}
												placeholder='Note' />
										</div>
										{/* cumulative input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulative" /></label><br />
											<Input
												name='cumulative'
												type='select'
												defaultValue={state.cumulative.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* cumulativeReset input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeReset" /></label><br />
											<Input
												name='cumulativeReset'
												type='select'
												defaultValue={state.cumulativeReset.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* cumulativeResetStart input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetStart" /></label><br />
											<Input
												name='cumulativeResetStart'
												type='text'
												onChange={e => handleStringChange(e)}
												defaultValue={state.cumulativeResetStart}
												placeholder="HH:MM:SS" />
										</div>
										{/* cumulativeResetEnd input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetEnd" /></label><br />
											<Input
												name='cumulativeResetEnd'
												type='text'
												onChange={e => handleStringChange(e)}
												defaultValue={state.cumulativeResetEnd}
												placeholder="HH:MM:SS" />
										</div>
										{/* endOnlyTime input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endOnlyTime" /></label><br />
											<Input
												name='endOnlyTime'
												type='select'
												defaultValue={state.endOnlyTime.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
											{/* readingGap input*/}
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.readingGap" /></label><br />
												<Input
													name='readingGap'
													type='number'
													onChange={e => handleNumberChange(e)}
													step="0.01"
													min="0"
													defaultValue={state.readingGap} />
											</div>
											{/* readingVariation input*/}
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.readingVariation" /></label><br />
												<Input
													name="readingVariation"
													type="number"
													onChange={e => handleNumberChange(e)}
													step="0.01"
													min="0"
													defaultValue={state.readingVariation} />
											</div>
											{/* readingDuplication input*/}
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.readingDuplication" /></label><br />
												<Input
													name="readingDuplication"
													type="number"
													onChange={e => handleNumberChange(e)}
													step="1"
													min="1"
													max="9"
													defaultValue={state.readingDuplication} />
											</div>
											{/* timeSort input*/}
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.timeSort" /></label><br />
												<Input
													name='timeSort'
													type='select'
													defaultValue={state.timeSort.toString()}
													onChange={e => handleBooleanChange(e)}>
													{Object.keys(TrueFalseType).map(key => {
														return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
													})}
												</Input>
											</div>
										</div>
										{/* reading input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.reading" /></label><br />
											<Input
												name="reading"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="0.01"
												defaultValue={state.reading} />
										</div>
										{/* startTimestamp input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.startTimeStamp" /></label><br />
											<Input
												name='startTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												defaultValue={state.startTimestamp} />
										</div>
										{/* endTimestamp input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endTimeStamp" /></label><br />
											<Input
												name='endTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												defaultValue={state.endTimestamp} />
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
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { MeterData, MeterType } from '../../types/redux/meters';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import { useDispatch } from 'react-redux';
import { submitEditedMeter } from '../../actions/meters';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import { useState } from 'react';
import '../../styles/Modal.unit.css';
import { TrueFalseType } from '../../types/items';

interface EditMeterModalComponentProps {
	show: boolean;
	meter: MeterData;
	// passed in to handle closing the modal
	handleClose: () => void;
}

// Updated to hooks
export default function EditMeterModalComponent(props: EditMeterModalComponentProps) {

	const dispatch = useDispatch();

	/* State */

	// identifier
	const [identifier, setIdentifier] = useState(props.meter.identifier);
	const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIdentifier(e.target.value);
	}

	// name
	const [name, setName] = useState(props.meter.name);
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
	}

	// area
	const [area, setArea] = useState(props.meter.area);
	const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setArea(Number(e.target.value));
	}

	// enabled
	const [enabled, setEnabled] = useState(props.meter.enabled);
	const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEnabled(JSON.parse(e.target.value));
	}

	// displayable
	const [displayable, setDisplayable] = useState(props.meter.displayable);
	const handleDisplayableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDisplayable(JSON.parse(e.target.value));
	}

	// meterType
	const [meterType, setMeterType] = useState(props.meter.meterType? `${props.meter.meterType}` : '');
	const handleMeterTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMeterType(e.target.value);
	}

	// URL
	const [url, setUrl] = useState(props.meter.url? `${props.meter.url}` : '');
	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
	}

	// timeZone
	/*const [timeZone, setTimeZone] = useState(props.meter.timeZone? `${props.meter.timeZone.name}, 
										${props.meter.timeZone.abbrev}, ${props.meter.timeZone.offset}` : '');
	const handleTimeZoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTimeZone(e.target.value);
	}*/

	// GPS
	/*const [gps, setGps] = useState(props.meter.gps? `${props.meter.gps.latitude}, ${props.meter.gps.longitude}` : '');
	const handleGpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setGps(e.target.value);
	}*/

	// unitID
	const [unitId, setUnitID] = useState(props.meter.unitId);
	const handleUnitIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUnitID(Number(e.target.value));
	}

	// defaultGraphicUnit
	const [defaultGraphicUnit, setDefaultGraphicUnit] = useState(props.meter.defaultGraphicUnit);
	const handleDefaultGraphicUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDefaultGraphicUnit(Number(e.target.value));
	}

	// note
	const [note, setNote] = useState(props.meter.note);
	const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNote(e.target.value);
	}

	// cumulative
	const [cumulative, setCumulative] = useState(props.meter.cumulative);
	const handleCumulativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCumulative(JSON.parse(e.target.value));
	}

	// cumulativeReset
	const [cumulativeReset, setCumulativeReset] = useState(props.meter.cumulativeReset);
	const handleCumulativeResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCumulativeReset(JSON.parse(e.target.value));
	}

	// cumulativeResetStart
	const [cumulativeResetStart, setCumulativeResetStart] = useState(props.meter.cumulativeResetStart);
	const handleCumulativeResetStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCumulativeResetStart(e.target.value);
	}

	// cumulativeResetEnd
	const [cumulativeResetEnd, setCumulativeResetEnd] = useState(props.meter.cumulativeResetEnd);
	const handleCumulativeResetEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCumulativeResetEnd(e.target.value);
	}

	// endOnlyTime
	const [endOnlyTime, setEndOnlyTime] = useState(props.meter.endOnlyTime);
	const handleEndOnlyTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEndOnlyTime(JSON.parse(e.target.value));
	}

	// reading
	const [reading, setReading] = useState(props.meter.reading);
	const handleReadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReading(Number(e.target.value));
	}

	// readingGap
	const [readingGap, setReadingGap] = useState(props.meter.readingGap);
	const handleReadingGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReadingGap(e.target.value);
	}

	// readingVariation
	const [readingVariation, setReadingVariation] = useState(props.meter.readingVariation);
	const handleReadingVariationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReadingVariation(Number(e.target.value));
	}

	// readingDuplication
	const [readingDuplication, setReadingDuplication] = useState(props.meter.readingDuplication);
	const handleReadingDuplicationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReadingDuplication(Number(e.target.value));
	}

	// timeSort
	const [timeSort, setTimeSort] = useState(props.meter.timeSort);
	const handleTimeSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTimeSort(JSON.parse(e.target.value));
	}

	// startTimestamp
	const [startTimestamp, setStartTimestamp] = useState(props.meter.startTimestamp);
	const handleStartTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setStartTimestamp(e.target.value);
	}

	// endTimestamp
	const [endTimestamp, setEndTimestamp] = useState(props.meter.endTimestamp);
	const handleEndTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEndTimestamp(e.target.value);
	}


	/* End State */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateMeterModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit meters will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setIdentifier(props.meter.identifier);
		setName(props.meter.name);
		setEnabled(props.meter.enabled);
		setDisplayable(props.meter.displayable);
		setMeterType(props.meter.meterType? `${props.meter.meterType}` : '');
		setUrl(props.meter.url? `${props.meter.url}` : '');
		// setTimeZone(props.meter.timeZone? `${props.meter.timeZone.name}, ${props.meter.timeZone.abbrev}, ${props.meter.timeZone.offset}` : '');
		// setGps(props.meter.gps? `${props.meter.gps.latitude}, ${props.meter.gps.longitude}` : '');
		setUnitID(props.meter.unitId);
		setDefaultGraphicUnit(props.meter.defaultGraphicUnit);
		setNote(props.meter.note);
		setCumulative(props.meter.cumulative);
		setCumulativeReset(props.meter.cumulativeReset);
		setCumulativeResetStart(props.meter.cumulativeResetStart);
		setCumulativeResetEnd(props.meter.cumulativeResetEnd);
		setEndOnlyTime(props.meter.endOnlyTime);
		setReading(props.meter.reading);
		setReadingGap(props.meter.readingGap);
		setReadingVariation(props.meter.readingVariation);
		setReadingDuplication(props.meter.readingDuplication);
		setTimeSort(props.meter.timeSort);
		setStartTimestamp(props.meter.startTimestamp);
		setEndTimestamp(props.meter.endTimestamp);
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
		const meterHasChanges =
			(
				props.meter.identifier != identifier ||
				props.meter.name != name ||
				props.meter.area != area ||
				props.meter.enabled != enabled ||
				props.meter.displayable != displayable ||
				props.meter.meterType != meterType ||
				props.meter.url != url ||
				// props.meter.timeZone?.name  != timeZone ||
				// props.meter.gps ||
				props.meter.unitId != unitId ||
				props.meter.defaultGraphicUnit != defaultGraphicUnit ||
				props.meter.note != note ||
				props.meter.cumulative != cumulative ||
				props.meter.cumulativeReset != cumulativeReset ||
				props.meter.cumulativeResetStart != cumulativeResetStart ||
				props.meter.cumulativeResetEnd != cumulativeResetEnd ||
				props.meter.endOnlyTime != endOnlyTime ||
				props.meter.reading != reading ||
				props.meter.readingGap != readingGap ||
				props.meter.readingVariation != readingVariation ||
				props.meter.readingDuplication != readingDuplication ||
				props.meter.timeSort != timeSort ||
				props.meter.startTimestamp != startTimestamp ||
				props.meter.endTimestamp != endTimestamp );

		// Only do work if there are changes
		if (meterHasChanges) {
			const editedMeter = {
				...props.meter,
				identifier,
				name,
				area,
				enabled,
				displayable,
				meterType,
				url,
				// timeZone,
				// gps,
				unitId,
				defaultGraphicUnit,
				note,
				cumulative,
				cumulativeReset,
				cumulativeResetStart,
				cumulativeResetEnd,
				endOnlyTime,
				reading,
				readingGap,
				readingVariation,
				readingDuplication,
				timeSort,
				startTimestamp,
				endTimestamp
			}

			// Save our changes by dispatching the submitEditedMeter action
			dispatch(submitEditedMeter(editedMeter));
			// The updated meter is not fetched to save time. However, the identifier might have been
			// automatically set if it was empty. Mimic that here.
			if (editedMeter.identifier === '') {
				editedMeter.identifier = editedMeter.name;
			}
			dispatch(removeUnsavedChanges());
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
											type="text"
											onChange={e => handleIdentifierChange(e)}
											defaultValue={identifier}
											placeholder="Identifier" />
										<div />
										{/* Name input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.name" /></label><br />
											<Input
												type='text'
												onChange={e => handleNameChange(e)}
												required value={name} />
										</div>
										{/* Area input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.area" /></label><br />
											<Input
												type="number"
												defaultValue={area}
												onChange={e => handleAreaChange(e)}
												placeholder="area" />
										</div>
										{/* Enabled input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.enabled" /></label><br />
											<Input
												type='select'
												defaultValue={enabled.toString()}
												onChange={e => handleEnabledChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Displayable input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.displayable" /></label><br />
											<Input
												type='select'
												defaultValue={enabled.toString()}
												onChange={e => handleDisplayableChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* Meter type input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.type" /></label><br />
											<Input
												type='select'
												defaultValue={meterType}
												onChange={e => handleMeterTypeChange(e)}>
												{Object.keys(MeterType).map(key => {
													return (<option value={key} key={key}>{`${key}`}</option>)
												})}
											</Input>
										</div>
										{/* URL input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.url" /></label><br />
											<Input
												type='text'
												onChange={e => handleUrlChange(e)}
												required value={url} />
										</div>
										{/* Timezone input*/}
										{/*<div style={formInputStyle}>
											<label><FormattedMessage id="meter.time.zone" /></label><br />
											<Input
												type='text'
												onChange={e => handleTimeZoneChange(e)} />
											</div>*/}
										{/* GPS input*/}
										{/*<div style={formInputStyle}>
											<label><FormattedMessage id="meter.gps" /></label><br />
											<Input
												type='text'
												onChange={e => handleGpsChange(e)}
												required value={gps} />
										</div>*/}
										{/* UnitId input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.unitId" /></label><br />
											<Input
												type="number"
												defaultValue={unitId}
												onChange={e => handleUnitIDChange(e)}
												placeholder="unitId" />
										</div>
										{/* DefaultGraphicUnit input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.defaultGraphicUnit" /></label><br />
											<Input
												type="number"
												defaultValue={defaultGraphicUnit}
												onChange={e => handleDefaultGraphicUnitChange(e)}
												placeholder="defaultGraphicUnit" />
										</div>
										{/* note input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.note" /></label><br />
											<Input
												name='note'
												type='textarea'
												defaultValue={note}
												placeholder='Note'
												onChange={e => handleNoteChange(e)} />
										</div>
										{/* cumulative input*/}
										<div style={formInputStyle}>
											<Input
												type="checkbox"
												checked={cumulative}
												onChange={e => handleCumulativeChange(e)} />
											<label><FormattedMessage id="meter.cumulative" /></label>
										</div>
										{/* cumulativeReset input*/}
										<div style={formInputStyle}>
											<Input
												type="checkbox"
												checked={cumulativeReset}
												onChange={e => handleCumulativeResetChange(e)} />
											<label><FormattedMessage id="meter.cumulativeReset" /></label>
										</div>
										{/* cumulativeResetStart input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetStart" /></label><br />
											<Input
												type='text'
												onChange={e => handleCumulativeResetStartChange(e)}
												required value={cumulativeResetStart} />
										</div>
										{/* cumulativeResetEnd input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetEnd" /></label><br />
											<Input
												type='text'
												onChange={e => handleCumulativeResetEndChange(e)}
												required value={cumulativeResetEnd} />
										</div>
										{/* endOnlyTime input*/}
										<div style={formInputStyle}>
											<Input
												type="checkbox"
												checked={endOnlyTime}
												onChange={e => handleEndOnlyTimeChange(e)} />
											<label><FormattedMessage id="meter.endOnlyTime" /></label><br />
										</div>
										{/* reading input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.reading" /></label><br />
											<Input
												type="number"
												defaultValue={reading}
												onChange={e => handleReadingChange(e)}
												placeholder="reading" />
										</div>
										{/* readingGap input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingGap" /></label><br />
											<Input
												type='text'
												onChange={e => handleReadingGapChange(e)}
												required value={readingGap} />
										</div>
										{/* readingVariation input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingVariation" /></label><br />
											<Input
												type="number"
												defaultValue={readingVariation}
												onChange={e => handleReadingVariationChange(e)}
												placeholder="readingVariation" />
										</div>
										{/* readingDuplication input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingDuplication" /></label><br />
											<Input
												type="number"
												defaultValue={readingDuplication}
												onChange={e => handleReadingDuplicationChange(e)}
												placeholder="readingDuplication" />
										</div>
										{/* timeSort input*/}
										<div style={formInputStyle}>
											<Input
												type="checkbox"
												checked={timeSort}
												onChange={e => handleTimeSortChange(e)} />
											<label><FormattedMessage id="meter.timeSort" /></label><br />
										</div>
										{/* startTimestamp input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.startTimeStamp" /></label><br />
											<Input
												type='text'
												onChange={e => handleStartTimestampChange(e)}
												required value={startTimestamp} />
										</div>
										{/* endTimestamp input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endTimeStamp" /></label><br />
											<Input
												type='text'
												onChange={e => handleEndTimestampChange(e)}
												required value={endTimestamp} />
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
					<Button variant="primary" onClick={handleSaveChanges} disabled={!name}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}
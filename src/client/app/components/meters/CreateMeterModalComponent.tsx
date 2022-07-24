/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import '../../styles/Modal.unit.css';
import { MeterType } from '../../types/redux/meters';
import { useDispatch } from 'react-redux';
import { addMeter } from '../../actions/meters';
import { useState } from 'react';
import { TrueFalseType } from '../../types/items';

export default function CreateMeterModalComponent() {

	const dispatch = useDispatch();

	const defaultValues = {
		id: -99,
		identifier : '',
		name : '',
		area : 0,
		enabled : true,
		displayable : true,
		meterType : MeterType.other,
		url : '',
		timeZone : '',
		gps : 'latitude, longitude',
		unitId : -99,
		defaultGraphicUnit : -99,
		note : '',
		cumulative : false,
		cumulativeReset : false,
		cumulativeResetStart : '00:00:00',
		cumulativeResetEnd : '23:59:59.999999',
		endOnlyTime : false,
		reading : 0.0,
		readingGap : 0,
		readingVariation : 0,
		readingDuplication : 1,
		timeSort : false,
		startTimestamp : '',
		endTimestamp : ''
	}

	/* State */
	// We can definitely sacrifice readability here (and in the render) to consolidate these into a single function if need be
	// NOTE a lot of this is copied from the MeterModalEditComponent, in the future we could make a single component to handle all edit pages if need be
	// TODO Katherine with Delaney help are going to try to consolidate to create reusable functions.

	// Modal show
	const [showModal, setShowModal] = useState(false);
	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => setShowModal(true);

	// identifier
	const [identifier, setIdentifier] = useState(defaultValues.identifier);
	const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIdentifier(e.target.value);
	}

	// name
	const [name, setName] = useState(defaultValues.name);
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
	}

	// area
	const [area, setArea] = useState(defaultValues.area);
	const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setArea(Number(e.target.value));
	}

	// enabled
	const [enabled, setEnabled] = useState(defaultValues.enabled);
	const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEnabled(JSON.parse(e.target.value));
	}

	// displayable
	const [displayable, setDisplayable] = useState(defaultValues.displayable);
	const handleDisplayableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDisplayable(JSON.parse(e.target.value));
	}

	// meterType
	const [meterType, setMeterType] = useState(defaultValues.meterType? `${defaultValues.meterType}` : '');
	const handleMeterTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMeterType(e.target.value);
	}

	// URL
	const [url, setUrl] = useState(defaultValues.url);
	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
	}

	// timezone
	const [timeZone, setTimeZone] = useState(defaultValues.timeZone);
	const handleTimeZoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTimeZone(e.target.value);
	}

	// GPS
	const [gps, setGps] = useState(defaultValues.gps);
	const handleGpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setGps(e.target.value);
	}

	// unitID
	const [unitId, setUnitID] = useState(defaultValues.unitId);
	const handleUnitIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUnitID(Number(e.target.value));
	}

	// defaultGraphicUnit
	const [defaultGraphicUnit, setDefaultGraphicUnit] = useState(defaultValues.defaultGraphicUnit);
	const handleDefaultGraphicUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDefaultGraphicUnit(Number(e.target.value));
	}

	// note
	const [note, setNote] = useState(defaultValues.note);
	const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNote(e.target.value);
	}

	// cumulative
	const [cumulative, setCumulative] = useState(defaultValues.cumulative);
	const handleCumulativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCumulative(JSON.parse(e.target.value));
	}

	// cumulativeReset
	const [cumulativeReset, setCumulativeReset] = useState(defaultValues.cumulativeReset);
	const handleCumulativeResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCumulativeReset(JSON.parse(e.target.value));
	}

	// cumulativeResetStart
	const [cumulativeResetStart, setCumulativeResetStart] = useState(defaultValues.cumulativeResetStart);
	const handleCumulativeResetStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCumulativeResetStart(e.target.value);
	}

	// cumulativeResetEnd
	const [cumulativeResetEnd, setCumulativeResetEnd] = useState(defaultValues.cumulativeResetEnd);
	const handleCumulativeResetEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCumulativeResetEnd(e.target.value);
	}

	// endOnlyTime
	const [endOnlyTime, setEndOnlyTime] = useState(defaultValues.endOnlyTime);
	const handleEndOnlyTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEndOnlyTime(JSON.parse(e.target.value));
	}

	// reading
	const [reading, setReading] = useState(defaultValues.reading);
	const handleReadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReading(Number(e.target.value));
	}

	// readingGap
	const [readingGap, setReadingGap] = useState(defaultValues.readingGap);
	const handleReadingGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReadingGap(Number(e.target.value));
	}

	// readingVariation
	const [readingVariation, setReadingVariation] = useState(defaultValues.readingVariation);
	const handleReadingVariationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReadingVariation(Number(e.target.value));
	}

	// readingDuplication
	const [readingDuplication, setReadingDuplication] = useState(defaultValues.readingDuplication);
	const handleReadingDuplicationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReadingDuplication(Number(e.target.value));
	}

	// timeSort
	const [timeSort, setTimeSort] = useState(defaultValues.timeSort);
	const handleTimeSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTimeSort(JSON.parse(e.target.value));
	}

	// startTimestamp
	const [startTimestamp, setStartTimestamp] = useState(defaultValues.startTimestamp);
	const handleStartTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setStartTimestamp(e.target.value);
	}

	// endTimestamp
	const [endTimestamp, setEndTimestamp] = useState(defaultValues.endTimestamp);
	const handleEndTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEndTimestamp(e.target.value);
	}


	/* End State */

	// Reset the state to default values
	// This would also benefit from a single state changing function for all state
	const resetState = () => {
		setName(defaultValues.name);
		setIdentifier(defaultValues.identifier);
	}

	// Unlike edit, we decided to discard and inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Submit
	const handleSubmit = () => {

		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// New Meter object, overwrite all unchanged props with state
		const newMeter = {
			...defaultValues,
			id : undefined,
			identifier,
			name,
			area,
			enabled,
			displayable,
			meterType,
			url,
			timeZone,
			gps,
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

		// Set default identifier as name if left blank
		newMeter.identifier = (!newMeter.identifier || newMeter.identifier.length === 0) ? newMeter.name : newMeter.identifier;


		// Add the new Meter and update the store
		dispatch(addMeter(newMeter));

		resetState();
	};

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}

	const tableStyle: React.CSSProperties = {
		width: '100%'
	};


	return (
		<>
			{/* Show modal button */}
			<Button variant="Secondary" onClick={handleShow}>
				<FormattedMessage id="meter.create" />
			</Button>

			<Modal show={showModal} onHide={handleClose}>
				<Modal.Header>
					<Modal.Title> <FormattedMessage id="meter.create" /></Modal.Title>
				</Modal.Header>
				{/* when any of the Meter are changed call one of the functions. */}
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
											required value={identifier}
											placeholder="Identifier" />
										<div />
										{/* Name input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.name" /></label><br />
											<Input
												type='text'
												onChange={e => handleNameChange(e)}
												defaultValue={name}
												required value={name}
												placeholder="Name" />
										</div>
										{/* Area input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.area" /></label><br />
											<Input
												type="number"
												defaultValue={area}
												onChange={e => handleAreaChange(e)} />
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
												defaultValue={url}
												placeholder="URL" />
										</div>
										{/* Timezone input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.time.zone" /></label><br />
											<Input
												type='text'
												onChange={e => handleTimeZoneChange(e)}
												defaultValue={timeZone}
												placeholder="Time Zone" />
										</div>
										{/* GPS input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.gps" /></label><br />
											<Input
												type='text'
												onChange={e => handleGpsChange(e)}
												defaultValue={gps}
												placeholder="latitude, longitude" />
										</div>
										{/* UnitId input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.unitId" /></label><br />
											<Input
												type="number"
												onChange={e => handleUnitIDChange(e)}
												defaultValue={unitId}
												placeholder="unitId" />
										</div>
										{/* DefaultGraphicUnit input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.defaultGraphicUnit" /></label><br />
											<Input
												type="number"
												onChange={e => handleDefaultGraphicUnitChange(e)}
												defaultValue={defaultGraphicUnit}
												placeholder="defaultGraphicUnit" />
										</div>
										{/* note input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.note" /></label><br />
											<Input
												type='textarea'
												onChange={e => handleNoteChange(e)}
												defaultValue={note}
												placeholder='Note' />
										</div>
										{/* cumulative input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulative" /></label><br />
											<Input
												type='select'
												defaultValue={cumulative.toString()}
												onChange={e => handleCumulativeChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* cumulativeReset input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeReset" /></label><br />
											<Input
												type='select'
												defaultValue={cumulativeReset.toString()}
												onChange={e => handleCumulativeResetChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* cumulativeResetStart input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetStart" /></label><br />
											<Input
												type='text'
												onChange={e => handleCumulativeResetStartChange(e)}
												defaultValue={cumulativeResetStart}
												placeholder="HH:MM:SS" />
										</div>
										{/* cumulativeResetEnd input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetEnd" /></label><br />
											<Input
												type='text'
												onChange={e => handleCumulativeResetEndChange(e)}
												defaultValue={cumulativeResetEnd}
												placeholder="HH:MM:SS" />
										</div>
										{/* endOnlyTime input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endOnlyTime" /></label><br />
											<Input
												type='select'
												defaultValue={endOnlyTime.toString()}
												onChange={e => handleEndOnlyTimeChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* reading input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.reading" /></label><br />
											<Input
												type="number"
												onChange={e => handleReadingChange(e)}
												step="0.01"
												defaultValue={reading} />
										</div>
										{/* readingGap input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingGap" /></label><br />
											<Input
												type='number'
												onChange={e => handleReadingGapChange(e)}
												step="0.01"
												min="0"
												defaultValue={readingGap} />
										</div>
										{/* readingVariation input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingVariation" /></label><br />
											<Input
												type="number"
												onChange={e => handleReadingVariationChange(e)}
												step="0.01"
												min="0"
												defaultValue={readingVariation} />
										</div>
										{/* readingDuplication input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingDuplication" /></label><br />
											<Input
												type="number"
												onChange={e => handleReadingDuplicationChange(e)}
												step="1"
												min="1"
												max="9"
												defaultValue={readingDuplication} />
										</div>
										{/* timeSort input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.timeSort" /></label><br />
											<Input
												type='select'
												defaultValue={timeSort.toString()}
												onChange={e => handleTimeSortChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div>
										{/* startTimestamp input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.startTimeStamp" /></label><br />
											<Input
												type='text'
												onChange={e => handleStartTimestampChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												defaultValue={startTimestamp} />
										</div>
										{/* endTimestamp input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endTimeStamp" /></label><br />
											<Input
												type='text'
												onChange={e => handleEndTimestampChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												defaultValue={endTimestamp} />
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
					<Button variant="primary" onClick={handleSubmit} disabled={!name || !enabled || !displayable}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}
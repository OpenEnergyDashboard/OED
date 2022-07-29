/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import translate from '../../utils/translate';
import '../../styles/Modal.unit.css';
import { MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { useDispatch, useSelector } from 'react-redux';
import { addMeter } from '../../actions/meters';
import { useState } from 'react';
import { TrueFalseType } from '../../types/items';
import TimeZoneSelect from '../TimeZoneSelect';
import { GPSPoint } from 'utils/calibration';
import { CurrentUserState } from 'types/redux/currentUser';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { State } from 'types/redux/state';

interface CreateMeterModalComponentProps {
	currentUser: CurrentUserState;
}

export default function CreateMeterModalComponent(props: CreateMeterModalComponentProps) {

	const dispatch = useDispatch();

	const gpsDefault: GPSPoint = {
		longitude: 0,
		latitude: 0
	};

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
		gps : gpsDefault,
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
		timeSort : '',
		startTimestamp : '',
		endTimestamp : ''
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

	const handleTimeZoneChange = (timeZone : string ) => {
		setState({ ...state, ['timeZone']: timeZone });
	}

	const handleReadingDuplicationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if(Number(e.target.value) > 9) {
			e.target.value = '9'
		}
		if(Number(e.target.value) < 1) {
			e.target.value = '1'
		}
		setState({ ...state, [e.target.name]: Number(e.target.value) });
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
	// This would also benefit from a single state changing function for all state
	const resetState = () => {
		setState(defaultValues);
	}

	// Unlike edit, we decided to discard and inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Submit
	const handleSubmit = () => {

		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// Set default identifier as name if left blank
		state.identifier = (!state.identifier || state.identifier.length === 0) ? state.name : state.identifier;

		// Add the new Meter and update the store
		dispatch(addMeter(state));

		resetState();
	};

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

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
											name="identifier"
											type="text"
											onChange={e => handleStringChange(e)}
											defaultValue={state.identifier}
											required value={state.identifier}
											placeholder="Identifier" />
										<div />
										{/* Name input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.name" /></label><br />
											<Input
												name='name'
												type='text'
												onChange={e => handleStringChange(e)}
												defaultValue={state?.name}
												required value={state?.name}
												placeholder="Name" />
										</div> }
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
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.type" /></label><br />
											<Input
												name='meterType'
												type='select'
												defaultValue={state?.meterType}
												onChange={e => handleStringChange(e)}>
												{Object.keys(MeterType).map(key => {
													return (<option value={key} key={key}>{`${key}`}</option>)
												})}
											</Input>
										</div> }
										{/* URL input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.url" /></label><br />
											<Input
												name='url'
												type='text'
												onChange={e => handleStringChange(e)}
												defaultValue={state?.url}
												placeholder="URL" />
										</div> }
										{/* Timezone input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.time.zone" /></label><br />
											<TimeZoneSelect current={state?.timeZone} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
										</div> }
										{/* GPS input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.gps" /></label><br />
											<Input
												name='gps'
												type='text'
												onChange={e => handleGpsChange(e)}
												defaultValue={`${state.gps?.latitude}, ${state.gps?.longitude}`} />
										</div> }
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
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.note" /></label><br />
											<Input
												name='note'
												type='textarea'
												onChange={e => handleStringChange(e)}
												defaultValue={state?.note}
												placeholder='Note' />
										</div> }
										{/* cumulative input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulative" /></label><br />
											<Input
												name='cumulative'
												type='select'
												defaultValue={state?.cumulative.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div> }
										{/* cumulativeReset input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeReset" /></label><br />
											<Input
												name='cumulativeReset'
												type='select'
												defaultValue={state?.cumulativeReset.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div> }
										{/* cumulativeResetStart input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetStart" /></label><br />
											<Input
												name='cumulativeResetStart'
												type='text'
												onChange={e => handleStringChange(e)}
												defaultValue={state?.cumulativeResetStart}
												placeholder="HH:MM:SS" />
										</div> }
										{/* cumulativeResetEnd input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.cumulativeResetEnd" /></label><br />
											<Input
												name='cumulativeResetEnd'
												type='text'
												onChange={e => handleStringChange(e)}
												defaultValue={state?.cumulativeResetEnd}
												placeholder="HH:MM:SS" />
										</div> }
										{/* endOnlyTime input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endOnlyTime" /></label><br />
											<Input
												name='endOnlyTime'
												type='select'
												defaultValue={state?.endOnlyTime.toString()}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
												})}
											</Input>
										</div> }
										{/* readingGap input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingGap" /></label><br />
											<Input
												name='readingGap'
												type='number'
												onChange={e => handleNumberChange(e)}
												step="0.01"
												min="0"
												defaultValue={state?.readingGap} />
										</div> }
										{/* readingVariation input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingVariation" /></label><br />
											<Input
												name="readingVariation"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="0.01"
												min="0"
												defaultValue={state?.readingVariation} />
										</div> }
										{/* readingDuplication input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.readingDuplication" /></label><br />
											<Input
												name="readingDuplication"
												type="number"
												onChange={e => handleReadingDuplicationChange(e)}
												step="1"
												min="1"
												max="9"
												defaultValue={state?.readingDuplication} />
										</div> }
										{/* timeSort input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.timeSort" /></label><br />
											<Input
												name='timeSort'
												type='select'
												defaultValue={state?.timeSort}
												onChange={e => handleBooleanChange(e)}>
												{Object.keys(MeterTimeSortType).map(key => {
													return (<option value={key} key={key}>{translate(`${key}`)}</option>)
												})}
											</Input>
										</div> }
										{/* reading input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.reading" /></label><br />
											<Input
												name="reading"
												type="number"
												onChange={e => handleNumberChange(e)}
												step="0.01"
												defaultValue={state?.reading} />
										</div> }
										{/* startTimestamp input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.startTimeStamp" /></label><br />
											<Input
												name='startTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												defaultValue={state?.startTimestamp} />
										</div> }
										{/* endTimestamp input*/}
										{loggedInAsAdmin &&
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.endTimeStamp" /></label><br />
											<Input
												name='endTimestamp'
												type='text'
												onChange={e => handleStringChange(e)}
												placeholder="YYYY-MM-DD HH:MM:SS"
												defaultValue={state?.endTimestamp} />
										</div> }
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
					<Button variant="primary" onClick={handleSubmit} disabled={!state.name}>
						<FormattedMessage id="save.all" />
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}
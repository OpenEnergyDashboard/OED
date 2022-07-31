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
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { useState } from 'react';
import { TrueFalseType } from '../../types/items';
import TimeZoneSelect from '../TimeZoneSelect';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { CurrentUserState } from 'types/redux/currentUser';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { State } from 'types/redux/state';
import { UnitData, DisplayableType, UnitRepresentType, UnitType } from '../../types/redux/units';
import * as _ from 'lodash';

interface CreateMeterModalComponentProps {
	currentUser: CurrentUserState;
}

// Notifies user of msg.
// TODO isValidGPSInput uses alert so continue that. Maybe all should be changed but this impacts other parts of the code.
// Note this causes the modal to close but the state is not reset.
// Use a function so can easily change how it works.
function notifyUser(msg: string) {
	window.alert(msg);
}

// TODO props not used in this file??
export default function CreateMeterModalComponent(props: CreateMeterModalComponentProps) {

	const dispatch = useDispatch();

	const defaultValues = {
		id: -99,
		identifier: '',
		name: '',
		area: 0,
		enabled: false,
		displayable: false,
		meterType: MeterType.OTHER,
		url: '',
		// TODO The default may need changing to match none if we want that but uncertain for create.
		// translate() returns a TranslatedString of type Never so manually force to String.
		// timeZone: String(translate('timezone.no')),
		timeZone: '',
		gps: '',
		unitId: -99,
		defaultGraphicUnit: -99,
		note: '',
		cumulative: false,
		cumulativeReset: false,
		cumulativeResetStart: '',
		cumulativeResetEnd: '',
		endOnlyTime: false,
		readingGap: 0,
		readingVariation: 0,
		readingDuplication: 1,
		timeSort: MeterTimeSortType.increasing,
		reading: 0.0,
		startTimestamp: '',
		endTimestamp: ''
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

	const handleTimeZoneChange = (timeZone: string) => {
		setState({ ...state, ['timeZone']: timeZone });
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
		let submitState;
		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// Set default identifier as name if left blank
		state.identifier = (!state.identifier || state.identifier.length === 0) ? state.name : state.identifier;

		// Check area is positive.
		// TODO For now allow zero so works with default value and DB. We should probably
		// make this better default than 0 (DB set to not null now).
		// if (state.area <= 0) {
		if (state.area < 0) {
			notifyUser(translate('area.invalid') + state.area + '.');
			inputOk = false;
		}

		// Check reading duplication is between 1 and 9.
		if (state.readingDuplication < 1 || state.readingDuplication > 9) {
			notifyUser(translate('duplication.invalid') + state.area + '.');
			inputOk = false;
		}

		// Check GPS entered.
		// Validate GPS is okay and take from string to GPSPoint to submit.
		const gpsInput: string = state.gps;
		let gps: GPSPoint | null;
		const latitudeIndex = 0;
		const longitudeIndex = 1;
		if (gpsInput.length === 0) {
			// This is the value to route on an empty value which is stored as null in the DB.
			gps = null;
		} else if (isValidGPSInput(gpsInput)) {
			const array = gpsInput.split(',').map((value: string) => parseFloat(value));
			// It is valid and needs to be in this format for routing.
			gps = {
				longitude: array[longitudeIndex],
				latitude: array[latitudeIndex]
			};
		} else {
			// GPS not okay.
			// TODO isValidGPSInput currently tops up an alert so not doing it here, may change
			// so leaving code commented out.
			// notifyUser(translate('input.gps.range') + state.gps + '.');
			inputOk = false;
			// TypeScript does not figure out that gps is not used in this case so reports
			// an error. Set value to avoid.
			gps = null;
		}

		if (inputOk) {
			// GPS was updated so create updated state to submit.
			// TODO need to type submitState?
			submitState = { ...state, gps: gps };
			// Submit new meter if checks where ok.
			dispatch(addMeter(submitState));
			resetState();
		} else {
			// Tell user that not going to update due to input issues.
			notifyUser(translate('meter.input.error'));
		}
	};

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// Deal with units.
	// Get the units in state
	const units = useSelector((state: State) => state.units.units);
	// A non-unit
	const noUnit: UnitData = {
		// Only needs the id and identifier, others are dummy values.
		id: -99,
		name: '',
		identifier: 'no unit',
		unitRepresent: UnitRepresentType.unused,
		secInRate: 99,
		typeOfUnit: UnitType.unit,
		unitIndex: -99,
		suffix: '',
		displayable: DisplayableType.none,
		preferredDisplay: false,
		note: ''
	}

	// The meter unit can be any unit of type meter.
	const possibleMeterUnits = _.filter(units, function (o: UnitData) {
		return o.typeOfUnit == UnitType.meter;
	});
	// Put in alphabetical order.
	const sortedPossibleMeterUnits = _.sortBy(possibleMeterUnits, unit => unit.identifier.toLowerCase(), 'asc');
	// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
	sortedPossibleMeterUnits.push(noUnit);

	// The default graphic unit can be any unit of type unit or suffix.
	const possibleGraphicUnits = _.filter(units, function (o: UnitData) {
		return o.typeOfUnit == UnitType.unit || o.typeOfUnit == UnitType.suffix;
	});
	// Put in alphabetical order.
	const sortedPossibleGraphicUnits = _.sortBy(possibleGraphicUnits, unit => unit.identifier.toLowerCase(), 'asc');
	// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
	sortedPossibleGraphicUnits.push(noUnit);

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '60%',
		// Only and admin can edit a meter.
		tooltipCreateMeterView: 'help.admin.metercreate'
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
					<Modal.Title> <FormattedMessage id="meter.create" />
						<TooltipHelpContainer page='meters' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='meters' helpTextId={tooltipStyle.tooltipCreateMeterView} />
						</div>
					</Modal.Title>
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
											value={state.identifier} />
										<div />
										{/* Name input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.name" /></label><br />
												<Input
													name='name'
													type='text'
													onChange={e => handleStringChange(e)}
													required value={state.name} />
											</div>}
										{/* Area input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.area" /></label><br />
											<Input
												name="area"
												type="number"
												step="0.01"
												min="0"
												value={state.area}
												onChange={e => handleNumberChange(e)} />
										</div>
										{/* Enabled input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.enabled" /></label><br />
											<Input
												name='enabled'
												type='select'
												value={state.enabled.toString()}
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
												value={state.displayable.toString()}
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
													value={state.meterType}
													onChange={e => handleStringChange(e)}>
													{/* TODO Want to not do a specific selection but request user to do one but this causes an error. Also want it required.
													 Possible way is how done in src/client/app/components/TimeZoneSelect.tsx. */}
													{/* Want to do also for unit id and default graphic unit */}
													{/* <option disabled selected value> -- select an option -- </option> */}
													// The dB expects lowercase.
													{Object.keys(MeterType).map(key => {
														return (<option value={key.toLowerCase()} key={key.toLowerCase()}>{`${key}`}</option>)
													})}
												</Input>
											</div>}
										{/* URL input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.url" /></label><br />
												<Input
													name='url'
													type='text'
													onChange={e => handleStringChange(e)}
													value={state.url} />
											</div>}
										{/* Timezone input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.time.zone" /></label><br />
												{/* TODO This is not correctly choosing the default not timezone choice */}
												<TimeZoneSelect current={state.timeZone} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
											</div>}
										{/* GPS input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.gps" /></label><br />
												<Input
													name='gps'
													type='text'
													// likley remove
													// onChange={e => handleGpsChange(e)}
													onChange={e => handleStringChange(e)}
													value={state.gps} />
											</div>}
										{/* UnitId input*/}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.unitName" /></label><br />
											<Input
												name="unitId"
												type='select'
												onChange={e => handleStringChange(e)}>
												{sortedPossibleMeterUnits.map(unit => {
													return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
												})}
											</Input>
										</div>
										{/* default graphic unit input */}
										<div style={formInputStyle}>
											<label><FormattedMessage id="meter.defaultGraphicUnit" /></label><br />
											<Input
												name='defaultGraphicUnit'
												type='select'
												onChange={e => handleStringChange(e)}>
												{sortedPossibleGraphicUnits.map(unit => {
													return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
												})}
											</Input>
										</div>
										{/* note input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.note" /></label><br />
												<Input
													name='note'
													type='textarea'
													onChange={e => handleStringChange(e)}
													value={state?.note}
													placeholder='Note' />
											</div>}
										{/* cumulative input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.cumulative" /></label><br />
												<Input
													name='cumulative'
													type='select'
													value={state.cumulative.toString()}
													onChange={e => handleBooleanChange(e)}>
													{Object.keys(TrueFalseType).map(key => {
														return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
													})}
												</Input>
											</div>}
										{/* cumulativeReset input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.cumulativeReset" /></label><br />
												<Input
													name='cumulativeReset'
													type='select'
													value={state.cumulativeReset.toString()}
													onChange={e => handleBooleanChange(e)}>
													{Object.keys(TrueFalseType).map(key => {
														return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
													})}
												</Input>
											</div>}
										{/* cumulativeResetStart input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.cumulativeResetStart" /></label><br />
												<Input
													name='cumulativeResetStart'
													type='text'
													onChange={e => handleStringChange(e)}
													value={state.cumulativeResetStart}
													placeholder="HH:MM:SS" />
											</div>}
										{/* cumulativeResetEnd input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.cumulativeResetEnd" /></label><br />
												<Input
													name='cumulativeResetEnd'
													type='text'
													onChange={e => handleStringChange(e)}
													value={state?.cumulativeResetEnd}
													placeholder="HH:MM:SS" />
											</div>}
										{/* endOnlyTime input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.endOnlyTime" /></label><br />
												<Input
													name='endOnlyTime'
													type='select'
													value={state?.endOnlyTime.toString()}
													onChange={e => handleBooleanChange(e)}>
													{Object.keys(TrueFalseType).map(key => {
														return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
													})}
												</Input>
											</div>}
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
													value={state?.readingGap} />
											</div>}
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
													value={state?.readingVariation} />
											</div>}
										{/* readingDuplication input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.readingDuplication" /></label><br />
												<Input
													name="readingDuplication"
													type="number"
													onChange={e => handleNumberChange(e)}
													step="1"
													min="1"
													max="9"
													value={state?.readingDuplication} />
											</div>}
										{/* timeSort input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.timeSort" /></label><br />
												<Input
													name='timeSort'
													type='select'
													value={state?.timeSort}
													onChange={e => handleStringChange(e)}>
													{Object.keys(MeterTimeSortType).map(key => {
														// This is a bit of a hack but it should work fine. The TypeSortTypes and MeterTimeSortType should be in sync.
														// The translation is on the former so we use that enum name there but loop on the other to get the value desired.
														return (<option value={key} key={key}>{translate(`TimeSortTypes.${key}`)}</option>)
													})}
												</Input>
											</div>}
										{/* reading input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.reading" /></label><br />
												<Input
													name="reading"
													type="number"
													onChange={e => handleNumberChange(e)}
													step="0.01"
													value={state?.reading} />
											</div>}
										{/* startTimestamp input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.startTimeStamp" /></label><br />
												<Input
													name='startTimestamp'
													type='text'
													onChange={e => handleStringChange(e)}
													placeholder="YYYY-MM-DD HH:MM:SS"
													value={state?.startTimestamp} />
											</div>}
										{/* endTimestamp input*/}
										{loggedInAsAdmin &&
											<div style={formInputStyle}>
												<label><FormattedMessage id="meter.endTimeStamp" /></label><br />
												<Input
													name='endTimestamp'
													type='text'
													onChange={e => handleStringChange(e)}
													placeholder="YYYY-MM-DD HH:MM:SS"
													value={state?.endTimestamp} />
											</div>}
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

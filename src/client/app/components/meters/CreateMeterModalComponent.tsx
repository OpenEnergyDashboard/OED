/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { metersApi } from '../../redux/api/metersApi';
import { useAppSelector } from '../../redux/reduxHooks';
import {
	MAX_DATE, MAX_DATE_MOMENT,
	MAX_ERRORS, MAX_VAL, MIN_DATE,
	MIN_DATE_MOMENT, MIN_VAL,
	isValidCreateMeter,
	selectDefaultCreateMeterValues, selectCreateMeterUnitCompatibility
} from '../../redux/selectors/adminSelectors';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { MeterData, MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import TimeZoneSelect from '../TimeZoneSelect';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

/**
 * Defines the create meter modal form
 * @returns Meter create element
 */
export default function CreateMeterModalComponent() {
	// Tracks whether a unit/ default unit has been selected.
	// RTKQ Mutation to submit add meter
	const [submitAddMeter] = metersApi.endpoints.addMeter.useMutation();
	// Memo'd memoized selector
	const defaultValues = useAppSelector(selectDefaultCreateMeterValues);

	/* State */
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// Handlers for each type of input change
	const [meterDetails, setMeterDetails] = useState(defaultValues);
	const unitIsSelected = meterDetails.unitId !== -999;
	const defaultGaphicUnitIsSelected = meterDetails.defaultGraphicUnit !== -999;

	const { compatibleGraphicUnits, incompatibleGraphicUnits, compatibleUnits } = useAppSelector(state =>
		// Type assertion due to conflicting GPS Property
		selectCreateMeterUnitCompatibility(state, meterDetails as unknown as MeterData)
	);
	const { meterIsValid, defaultGraphicUnitIsValid } = useAppSelector(state => isValidCreateMeter(state, meterDetails as unknown as MeterData));

	// Reset default graphingUnit when selected is invalid with updated unitId.
	React.useEffect(() => {
		if (!defaultGraphicUnitIsValid) {
			setMeterDetails(details => ({ ...details, defaultGraphicUnit: -999 }));
		}
	}, [meterDetails.unitId]);

	React.useEffect(() => {
		if (meterDetails.cumulative === false) {
			setMeterDetails(details => ({ ...details, cumulativeReset: false }));
		}
	}, [meterDetails.cumulative]);

	const handleShow = () => setShowModal(true);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMeterDetails({ ...meterDetails, [e.target.name]: e.target.value });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMeterDetails({ ...meterDetails, [e.target.name]: JSON.parse(e.target.value) });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMeterDetails({ ...meterDetails, [e.target.name]: Number(e.target.value) });
	};

	const handleTimeZoneChange = (timeZone: string) => {
		setMeterDetails({ ...meterDetails, ['timeZone']: timeZone });
	};
	// Reset the state to default values
	const resetState = () => {
		setMeterDetails(defaultValues);
	};

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};

	// Unlike edit, we decided to discard and inputs when you choose to leave the page. The reasoning is
	// that create starts from an empty template.

	// Submit
	const handleSubmit = async () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// TODO Maybe should do as a single popup?

		// Check GPS entered.
		// Validate GPS is okay and take from string to GPSPoint to submit.
		const gpsInput = meterDetails.gps;
		let gps: GPSPoint | null = null;
		const latitudeIndex = 0;
		const longitudeIndex = 1;
		// If the user input a value then gpsInput should be a string.
		// null came from the DB and it is okay to just leave it - Not a string.
		if (typeof gpsInput === 'string') {
			if (isValidGPSInput(gpsInput)) {
				const gpsValues = gpsInput.split(',').map(value => parseFloat(value));
				// It is valid and needs to be in this format for routing.
				gps = {
					longitude: gpsValues[longitudeIndex],
					latitude: gpsValues[latitudeIndex]
				};
			} else if (gpsInput.length !== 0) {
				// GPS not okay. Only true if some input.
				// TODO isValidGPSInput currently pops up an alert so not doing it here, may change
				// so leaving code commented out.
				// showErrorNotification(translate('input.gps.range') + state.gps + '.');
				inputOk = false;
			}
		}

		if (inputOk) {
			// The input passed validation.
			const submitState = {
				...meterDetails,
				// GPS may have been updated so create updated state to submit.
				gps: gps,
				// Set default identifier as name if left blank
				identifier: !meterDetails.identifier || meterDetails.identifier.length === 0 ? meterDetails.name : meterDetails.identifier,
				// The default value for timeZone is an empty string but that should be null for DB.
				// See below for usage of timeZoneValue.
				timeZone: (meterDetails.timeZone == '' ? null : meterDetails.timeZone)
			};
			// Submit new meter if checks where ok.
			// Attempt to add meter to database
			submitAddMeter(submitState)
				.unwrap()
				.then(() => {
					// if successful, the mutation will invalidate existing cache causing all meter details to be retrieved
					showSuccessNotification(translate('meter.successfully.create.meter'));
					resetState();
				})
				.catch(err => {
					showErrorNotification(translate('meter.failed.to.create.meter') + '"' + err.data + '"');
				});
		} else {
			// Tell user that not going to update due to input issues.
			showErrorNotification(translate('meter.input.error'));
		}
	};


	const tooltipStyle = {
		...tooltipBaseStyle,
		// Only an admin can create a meter.
		tooltipCreateMeterView: 'help.admin.metercreate'
	};

	// This is a bit of a hack. The defaultValues set the time zone to the empty string.
	// This makes the type a string and no easy way was found to allow null too.
	// The DB stores null for no choice and TimeZoneSelect expects null for no choice.
	// To get around this, a new variable is used for the menu options so it can have
	// both values where the empty string is converted to null.
	const timeZoneValue: string | null = (meterDetails.timeZone === '' ? null : meterDetails.timeZone);

	return (
		<>
			{/* Show modal button */}
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage id="meter.create" />
			</Button>
			<Modal isOpen={showModal} toggle={handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="meter.create" />
					<TooltipHelpComponent page='meters-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='meters-create'
							helpTextId={tooltipStyle.tooltipCreateMeterView}
						/>
					</div>
				</ModalHeader>
				{/* when any of the Meter values are changed call one of the functions. */}
				<ModalBody><Container>
					<Row xs='1' lg='2'>
						{/* Identifier input */}
						<Col><FormGroup>
							<Label for='identifier'>
								{translate('identifier')}
							</Label>
							<Input id='identifier' name='identifier' type='text' autoComplete='on'
								value={meterDetails.identifier}
								onChange={e => handleStringChange(e)}
							/>
						</FormGroup></Col>
						{/* Name input */}
						<Col><FormGroup>
							<Label for='name'>
								{translate('name')}
							</Label>
							<Input id='name' name='name' type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								required value={meterDetails.name}
								invalid={meterDetails.name === ''}
							/>
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* meter unit input */}
						<Col><FormGroup>
							<Label for='unitId'>
								{translate('meter.unitName')}
							</Label>
							<Input id='unitId' name='unitId' type='select'
								value={meterDetails.unitId}
								onChange={e => {
									handleNumberChange(e);
								}}
								invalid={!unitIsSelected}>
								{
									<option value={-999} key={-999} hidden disabled>
										{translate('select.unit')}
									</option>
								}
								{
									Array.from(compatibleUnits).map(unit =>
										<option key={unit.id} value={unit.id}>
											{unit.identifier}
										</option>
									)
								}
							</Input>
							<FormFeedback><FormattedMessage id="error.required" /></FormFeedback>
						</FormGroup></Col>
						{/* default graphic unit input */}
						<Col><FormGroup>
							<Label for='defaultGraphicUnit'>
								{translate('defaultGraphicUnit')}
							</Label>
							<Input id='defaultGraphicUnit' name='defaultGraphicUnit' type='select'
								value={meterDetails.defaultGraphicUnit}
								// Invalid when unitId is selected and no graphic selected or invalid choice.
								invalid={unitIsSelected && (!defaultGaphicUnitIsSelected || !defaultGraphicUnitIsValid)}
								disabled={!unitIsSelected}
								onChange={e => {
									handleNumberChange(e);
								}}
							>
								<option value={-999} key={-999} hidden disabled>
									{translate('select.unit')}
								</option>
								{
									Array.from(compatibleGraphicUnits).map(unit =>
										<option value={unit.id} key={unit.id}>
											{unit.identifier}
										</option>
									)
								}
								{
									Array.from(incompatibleGraphicUnits).map(unit =>
										<option value={unit.id} key={unit.id} disabled>
											{unit.identifier}
										</option>

									)
								}
							</Input>
							<FormFeedback><FormattedMessage id="error.required" /></FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Enabled input */}
						<Col><FormGroup>
							<Label for='enabled'>{translate('meter.enabled')}</Label>
							<Input id='enabled' name='enabled' type='select'
								value={meterDetails.enabled.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
						</FormGroup></Col>
						{/* Displayable input */}
						<Col><FormGroup>
							<Label for='displayable'>{translate('displayable')}</Label>
							<Input id='displayable' name='displayable' type='select'
								value={meterDetails.displayable.toString()}
								onChange={e => handleBooleanChange(e)}
								invalid={meterDetails.displayable && meterDetails.unitId === -99}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
							<FormFeedback>
								<FormattedMessage id="error.displayable" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Meter type input */}
						<Col><FormGroup>
							<Label for='meterType'>{translate('meter.type')}</Label>
							<Input id='meterType' name='meterType' type='select'
								value={meterDetails.meterType}
								onChange={e => handleStringChange(e)}
								invalid={meterDetails.meterType === ''}>
								{/* The default value is a blank string so then tell user to select one. */}
								{<option
									value={''}
									key={''}
									hidden={meterDetails.meterType !== ''}
									disabled>
									{translate('select.meter.type')}
								</option>}
								{/* The dB expects lowercase. */}
								{Object.keys(MeterType).map(key => {
									return (<option value={key.toLowerCase()} key={key.toLowerCase()}>{`${key}`}</option>);
								})}
							</Input>
							<FormFeedback><FormattedMessage id="error.required" /></FormFeedback>
						</FormGroup></Col>
						{/* Meter reading frequency */}
						<Col><FormGroup>
							<Label for='readingFrequency'>{translate('meter.readingFrequency')}</Label>
							<Input id='readingFrequency' name='readingFrequency' type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={meterDetails.readingFrequency}
								invalid={meterDetails.readingFrequency === ''} />
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* URL input */}
						<Col><FormGroup>
							<Label for='url'>{translate('meter.url')}</Label>
							<Input id='url' name='url' type='text'
								autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={meterDetails.url} />
						</FormGroup></Col>
						{/* GPS input */}
						<Col><FormGroup>
							<Label for='gps'>{translate('gps')}</Label>
							<Input id='gps' name='gps' type='text'
								onChange={e => handleStringChange(e)}
								value={meterDetails.gps} />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Area input */}
						<Col><FormGroup>
							<Label for='area'>{translate('area')}</Label>
							<Input id='area' name='area' type='number'
								min='0'
								defaultValue={meterDetails.area}
								onChange={e => handleNumberChange(e)}
								invalid={meterDetails.area < 0} />
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
						{/* meter area unit input */}
						<Col><FormGroup>
							<Label for='areaUnit'>{translate('area.unit')}</Label>
							<Input id='areaUnit' name='areaUnit' type='select'
								value={meterDetails.areaUnit}
								onChange={e => handleStringChange(e)}
								invalid={meterDetails.area > 0 && meterDetails.areaUnit === AreaUnitType.none}>
								{Object.keys(AreaUnitType).map(key => {
									return (<option value={key} key={key}>{translate(`AreaUnitType.${key}`)}</option>);
								})}
							</Input>
							<FormFeedback>
								<FormattedMessage id="area.but.no.unit" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					{/* note input */}
					<FormGroup>
						<Label for='note'>{translate('note')}</Label>
						<Input id='note' name='note' type='textarea'
							onChange={e => handleStringChange(e)}
							value={meterDetails.note}
							placeholder='Note' />
					</FormGroup>
					<Row xs='1' lg='2'>
						{/* cumulative input */}
						<Col><FormGroup>
							<Label for='cumulative'>{translate('meter.cumulative')}</Label>
							<Input id='cumulative' name='cumulative' type='select'
								value={meterDetails.cumulative.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
						</FormGroup></Col>
						{/* cumulativeReset input */}
						<Col><FormGroup>
							<Label for='cumulativeReset'>{translate('meter.cumulativeReset')}</Label>
							{meterDetails.cumulative === true ? (
								<Input id='cumulativeReset' name='cumulativeReset' type='select'
									value={meterDetails.cumulativeReset.toString()}
									onChange={e => handleBooleanChange(e)}>
									{Object.keys(TrueFalseType).map(key => {
										return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
									})}
								</Input>
							) : (
								<Input id='cumulativeReset' name='cumulativeReset' type='select' disabled>
									<option value='no'>Unavailable</option>
								</Input>
							)}
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* cumulativeResetStart input */}
						<Col><FormGroup>
							<Label for='cumulativeResetStart'>{translate('meter.cumulativeResetStart')}</Label>
							<Input id='cumulativeResetStart' name='cumulativeResetStart' type='text' autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={meterDetails.cumulativeResetStart}
								placeholder='HH:MM:SS'
								disabled={meterDetails.cumulativeReset === false || meterDetails.cumulative === false}
							/>
						</FormGroup></Col>
						{/* cumulativeResetEnd input */}
						<Col><FormGroup>
							<Label for='cumulativeResetEnd'>{translate('meter.cumulativeResetEnd')}</Label>
							<Input id='cumulativeResetEnd' name='cumulativeResetEnd' type='text'
								autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={meterDetails.cumulativeResetEnd}
								placeholder='HH:MM:SS'
								disabled={meterDetails.cumulativeReset === false || meterDetails.cumulative === false}
							/>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* endOnlyTime input */}
						<Col><FormGroup>
							<Label for='endOnlyTime'>{translate('meter.endOnlyTime')}</Label>
							<Input id='endOnlyTime' name='endOnlyTime' type='select' value={meterDetails.endOnlyTime.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
						</FormGroup></Col>
						{/* readingGap input */}
						<Col><FormGroup>
							<Label for='readingGap'>{translate('meter.readingGap')}</Label>
							<Input id='readingGap' name='readingGap' type='number'
								onChange={e => handleNumberChange(e)}
								min='0'
								defaultValue={meterDetails.readingGap}
								invalid={meterDetails?.readingGap < 0} />
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* readingVariation input */}
						<Col><FormGroup>
							<Label for='readingVariation'>{translate('meter.readingVariation')}</Label>
							<Input id='readingVariation' name='readingVariation' type='number'
								onChange={e => handleNumberChange(e)}
								min='0'
								defaultValue={meterDetails.readingVariation}
								invalid={meterDetails?.readingVariation < 0} />
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
						{/* readingDuplication input */}
						<Col><FormGroup>
							<Label for='readingDuplication'>{translate('meter.readingDuplication')}</Label>
							<Input id='readingDuplication' name='readingDuplication' type='number'
								onChange={e => handleNumberChange(e)}
								step='1'
								min='1'
								max='9'
								defaultValue={meterDetails.readingDuplication}
								invalid={meterDetails?.readingDuplication < 1 || meterDetails?.readingDuplication > 9} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: '1', max: '9' }} />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* timeSort input */}
						<Col><FormGroup>
							<Label for='timeSort'>{translate('meter.timeSort')}</Label>
							<Input id='timeSort' name='timeSort' type='select'
								value={meterDetails.timeSort}
								onChange={e => handleStringChange(e)}>
								{Object.keys(MeterTimeSortType).map(key => {
									// This is a bit of a hack but it should work fine. The TypeSortTypes and MeterTimeSortType should be in sync.
									// The translation is on the former so we use that enum name there but loop on the other to get the value desired.
									return (<option value={key} key={key}>{translate(`TimeSortTypes.${key}`)}</option>);
								})}
							</Input>
						</FormGroup></Col>
						{/* Timezone input */}
						<Col><FormGroup>
							<Label>{translate('meter.time.zone')}</Label>
							<TimeZoneSelect current={timeZoneValue} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* minVal input */}
						<Col><FormGroup>
							<Label for='minVal'>{translate('meter.minVal')}</Label>
							<Input id='minVal' name='minVal' type='number'
								onChange={e => handleNumberChange(e)}
								min={MIN_VAL}
								max={meterDetails.maxVal}
								defaultValue={meterDetails.minVal}
								invalid={meterDetails?.minVal < MIN_VAL || meterDetails?.minVal > meterDetails?.maxVal} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: MIN_VAL, max: meterDetails.maxVal }} />
							</FormFeedback>
						</FormGroup></Col>
						{/* maxVal input */}
						<Col><FormGroup>
							<Label for='maxVal'>{translate('meter.maxVal')}</Label>
							<Input id='maxVal' name='maxVal' type='number'
								onChange={e => handleNumberChange(e)}
								min={meterDetails.minVal}
								max={MAX_VAL}
								defaultValue={meterDetails.maxVal}
								invalid={meterDetails?.maxVal > MAX_VAL || meterDetails?.minVal > meterDetails?.maxVal} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: meterDetails.minVal, max: MAX_VAL }} />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* minDate input */}
						<Col><FormGroup>
							<Label for='minDate'>{translate('meter.minDate')}</Label>
							<Input id='minDate' name='minDate' type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								required value={meterDetails.minDate}
								invalid={!moment(meterDetails.minDate).isValid()
									|| !moment(meterDetails.minDate).isSameOrAfter(MIN_DATE_MOMENT)
									|| !moment(meterDetails.minDate).isSameOrBefore(moment(meterDetails.maxDate))} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: MIN_DATE, max: moment(meterDetails.maxDate).utc().format() }} />
							</FormFeedback>
						</FormGroup></Col>
						{/* maxDate input */}
						<Col><FormGroup>
							<Label for='maxDate'>{translate('meter.maxDate')}</Label>
							<Input id='maxDate' name='maxDate' type='text'
								autoComplete='on'
								placeholder='YYYY-MM-DD HH:MM:SS'
								onChange={e => handleStringChange(e)}
								required value={meterDetails.maxDate}
								invalid={!moment(meterDetails.maxDate).isValid()
									|| !moment(meterDetails.maxDate).isSameOrBefore(MAX_DATE_MOMENT)
									|| !moment(meterDetails.maxDate).isSameOrAfter(moment(meterDetails.minDate))} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: moment(meterDetails.minDate).utc().format(), max: MAX_DATE }} />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* DisableChecks input */}
						{/* maxError input */}
						<Col><FormGroup>
							<Label for='maxError'>{translate('meter.maxError')}</Label>
							<Input id='maxError' name='maxError' type='number'
								onChange={e => handleNumberChange(e)}
								min='0'
								max={MAX_ERRORS}
								defaultValue={meterDetails.maxError}
								invalid={meterDetails?.maxError > MAX_ERRORS || meterDetails?.maxError < 0} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: 0, max: MAX_ERRORS }} />
							</FormFeedback>
						</FormGroup></Col>
						<Col><FormGroup>
							<Label for='disableChecks'>{translate('meter.disableChecks')}</Label>
							<Input id='disableChecks' name='disableChecks' type='select'
								defaultValue={meterDetails.disableChecks?.toString()}
								onChange={e => handleBooleanChange(e)}>
								{
									Object.keys(TrueFalseType).map(key =>
										<option value={key} key={key}>
											{translate(`TrueFalseType.${key}`)}
										</option>
									)
								}
							</Input>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* reading input */}
						<Col><FormGroup>
							<Label for='reading'>{translate('meter.reading')}</Label>
							<Input id='reading' name='reading' type='number'
								onChange={e => handleNumberChange(e)}
								defaultValue={meterDetails.reading} />
						</FormGroup></Col>
						{/* startTimestamp input */}
						<Col><FormGroup>
							<Label for='startTimestamp'>{translate('meter.startTimeStamp')}</Label>
							<Input id='startTimestamp' name='startTimestamp' type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={meterDetails.startTimestamp} />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* endTimestamp input */}
						<Col><FormGroup>
							<Label for='endTimestamp'>{translate('meter.endTimeStamp')}</Label>
							<Input id='endTimestamp' name='endTimestamp' type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={meterDetails.endTimestamp} />
						</FormGroup></Col>
						{/* previousEnd input */}
						<Col><FormGroup>
							<Label for='previousEnd'>{translate('meter.previousEnd')}</Label>
							<Input id='previousEnd' name='previousEnd' type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={meterDetails.previousEnd} />
						</FormGroup></Col>
					</Row>
				</Container></ModalBody >
				<ModalFooter>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} disabled={!meterIsValid}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal >
		</>
	);
}
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { range } from 'lodash';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Col, Container, Form, FormFeedback, FormGroup, Input, Label, Row } from 'reactstrap';
import { authApi, authPollInterval } from '../../redux/api/authApi';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import { BooleanTypes, ReadingsCSVUploadPreferencesItem } from '../../types/csvUploadForm';
import { MeterData, MeterTimeSortType } from '../../types/redux/meters';
import { submitReadings } from '../../utils/api/UploadCSVApi';
import { ReadingsCSVUploadDefaults, convertBoolean } from '../../utils/csvUploadDefaults';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateMeterModalComponent from '../meters/CreateMeterModalComponent';

/**
 * Defines the CSV Readings page
 * @returns CSV Readings page element
 */
export default function ReadingsCSVUploadComponent() {

	const dispatch = useAppDispatch();
	// Check for admin status
	const isAdmin = useAppSelector(selectIsAdmin);
	// page may contain admin info so verify admin status while admin is authenticated.
	authApi.useTokenPollQuery(undefined, { skip: !isAdmin, pollingInterval: authPollInterval });
	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	const { visibleMeters } = useAppSelector(selectVisibleMeterAndGroupData);
	// This is the state for the form data for readings
	const [readingsData, setReadingsData] = useState<ReadingsCSVUploadPreferencesItem>(ReadingsCSVUploadDefaults);
	// This is the state for the file to be uploaded
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	// tracks whether or not a meter has been selected
	const meterIsSelected = readingsData.meterIdentifier !== '';
	// tracks if a new meter was created
	const [newMeterIdentifier, setNewMeterIdentifier] = useState<string>('');
	// tracks if file has .gzip or .csv extension
	const [isValidFileType, setIsValidFileType] = React.useState<boolean>(false);

	/* Handlers for each type of input change */
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setReadingsData(prevData => ({
			...prevData,
			[name]: value
		}));
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setReadingsData(prevData => ({
			...prevData,
			[name]: Number(value)
		}));
	};

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setReadingsData(prevData => ({
			...prevData,
			[name]: checked
		}));
	};

	const handleTimeSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTimeSort = MeterTimeSortType[e.target.value as keyof typeof MeterTimeSortType];
		setReadingsData(prevData => ({
			...prevData,
			timeSort: newTimeSort
		}));
	};

	const handleFileChange = (file: File) => {
		if (file) {
			setSelectedFile(file);
			if (file.name.slice(-4) === '.csv' || file.name.slice(-3) === '.gz') {
				setIsValidFileType(true);
			} else {
				setIsValidFileType(false);
				setSelectedFile(null);
				showErrorNotification(translate('csv.file.error') + file.name);
			}
		}
	};
	/* END of Handlers for each type of input change */

	useEffect(() => {
		if (newMeterIdentifier) {
			const foundMeter = visibleMeters.find(meter => meter.identifier === newMeterIdentifier);
			if (foundMeter) {
				updateReadingsData(newMeterIdentifier);
			}
		}
	}, [visibleMeters, newMeterIdentifier]);

	// This gets the meter identifier from a newly created meter and updates the readingsData settings
	// with the meterData settings, although the settings only update if user is an admin because a
	// CSV user doesn't have access to this data
	const handleCreateMeter = async (meterIdentifier: string) => {
		setNewMeterIdentifier(meterIdentifier);
	};

	const handleSelectedMeterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateReadingsData(e.target.value);
	};

	// method to update readingData state
	const updateReadingsData = (meterIdentifier: string) => {
		const selectedMeter = visibleMeters.find(meter => meter.identifier === meterIdentifier) as MeterData;
		setReadingsData(prevData => ({
			...prevData,
			meterIdentifier: selectedMeter.identifier,
			cumulative: convertBoolean(selectedMeter.cumulative),
			cumulativeReset: convertBoolean(selectedMeter.cumulativeReset),
			cumulativeResetStart: selectedMeter.cumulativeResetStart,
			cumulativeResetEnd: selectedMeter.cumulativeResetEnd,
			duplications: Number(selectedMeter.readingDuplication),
			lengthGap: selectedMeter.readingGap,
			lengthVariation: selectedMeter.readingVariation,
			endOnly: convertBoolean(selectedMeter.endOnlyTime),
			timeSort: MeterTimeSortType[selectedMeter.timeSort as keyof typeof MeterTimeSortType],
			useMeterZone: false
		}));
	};

	const handleClear = () => {
		setReadingsData(ReadingsCSVUploadDefaults);
		setIsValidFileType(false);
	};

	const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (selectedFile) {
			const { status, message } = await submitReadings(readingsData, selectedFile, dispatch);
			if (status) {
				showSuccessNotification(message);
			} else {
				showErrorNotification(message);
			}
		}
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		tooltipReadings: 'help.csv.readings'
	};

	const checkBox = {
		display: 'flex'
	};

	return (
		<Container>
			<TooltipHelpComponent page='help.csv.readings' />
			<Form onSubmit={handleSubmit}>
				<Row className="justify-content-md-center">
					<Col md='auto'>
						<div className="text-center">
							<h2>
								{translate('csv.upload.readings')}
								<div style={tooltipStyle}>
									<TooltipMarkerComponent page='help.csv.readings' helpTextId={tooltipStyle.tooltipReadings} />
								</div>
							</h2>
						</div>
						<Label for='meterIdentifier'>
							<div className='pb-1'>
								{translate('csv.readings.param.meter.identifier')}
							</div>
						</Label>
						<Input
							id='meterIdentifier'
							name='meterIdentifier'
							type='select'
							value={readingsData.meterIdentifier || ''}
							onChange={handleSelectedMeterChange}
							invalid={!meterIsSelected}
						>
							{
								<option value={''} key={-999} hidden disabled>
									{translate('select.meter')}
								</option>
							}
							{
								Array.from(visibleMeters).map(meter => {
									return (<option value={meter.identifier} key={meter.id}>{meter.identifier}</option>);
								})
							}
						</Input>
						<div className='py-3'>
							{isAdmin && <><CreateMeterModalComponent onCreateMeter={handleCreateMeter} /></>}
						</div>
						<FormGroup className='py-2'>
							<FormFileUploaderComponent
								onFileChange={handleFileChange}
								isInvalid={!!selectedFile}
							/>
						</FormGroup>
						<Row xs='1' lg='2'>
							<Col>
								<div style={checkBox}>
									<Input
										type='checkbox'
										id='gzip'
										name='gzip'
										onChange={handleCheckboxChange}
									/>
									<Label for='gzip'>
										<div className='ps-2'>
											{translate('csv.common.param.gzip')}
										</div>
									</Label>
								</div>
							</Col>
							<Col>
								<div style={checkBox}>
									<Input
										type='checkbox'
										id='headerRow'
										name='headerRow'
										onChange={handleCheckboxChange}
									/>
									<Label for='headerRow'>
										<div className='ps-2'>
											{translate('csv.common.param.header.row')}
										</div>
									</Label>
								</div>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<div style={checkBox}>
									<Input
										type='checkbox'
										id='update'
										name='update'
										onChange={handleCheckboxChange}
									/>
									<Label for='update'>
										<div className='ps-2'>
											{translate('csv.common.param.update')}
										</div>
									</Label>
								</div>
							</Col>
							<Col>
								<div style={checkBox}>
									<Input
										type='checkbox'
										id='relaxedParsing'
										name='relaxedParsing'
										onChange={handleCheckboxChange}
									/>
									<Label for='relaxedParsing'>
										<div className='ps-2'>
											{translate('csv.readings.param.relaxed.parsing')}
										</div>
									</Label>
								</div>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<div style={checkBox}>
									<Input
										type='checkbox'
										id='honorDst'
										name='honorDst'
										onChange={handleCheckboxChange}
									/>
									<Label for='honorDst'>
										<div className='ps-2'>
											{translate('csv.readings.param.honor.dst')}
										</div>
									</Label>
								</div>
							</Col>
							<Col>
								<div style={checkBox}>
									<Input
										type='checkbox'
										id='refreshReadings'
										name='refreshReadings'
										onChange={handleCheckboxChange}
									/>
									<Label for='refreshReadings'>
										<div className='ps-2'>
											{translate('csv.readings.param.refresh.readings')}
										</div>
									</Label>
								</div>
							</Col>
						</Row>
						<div className='pb-3'></div>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for='cumulative'>
										<div className='pb-1'>
											{translate('csv.readings.param.cumulative')}
										</div>
									</Label>
									<Input
										type='select'
										id='cumulative'
										name='cumulative'
										value={readingsData.cumulative}
										onChange={handleChange}
									>
										<option value={BooleanTypes.true}> {translate('BooleanMeterTypes.true')} </option>
										<option value={BooleanTypes.false}> {translate('BooleanMeterTypes.false')} </option>
									</Input>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for='cumulativeReset'>
										<div className='pb-1'>
											{translate('csv.readings.param.cumulative.reset')}
										</div>
									</Label>
									<Input
										type='select'
										id='cumulativeReset'
										name='cumulativeReset'
										value={readingsData.cumulativeReset}
										onChange={handleChange}
									>
										<option value={BooleanTypes.true}> {translate('BooleanMeterTypes.true')} </option>
										<option value={BooleanTypes.false}> {translate('BooleanMeterTypes.false')} </option>
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for='cumulativeResetStart'>
										<div className='pb-1'>
											{translate('csv.readings.param.cumulative.reset.start')}
										</div>
									</Label>
									<Input
										type="text"
										id='cumulativeResetStart'
										name='cumulativeResetStart'
										onChange={handleChange}
										value={readingsData.cumulativeResetStart}
										placeholder='HH:MM:SS'
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for='cumulativeResetEnd'>
										<div className='pb-1'>
											{translate('csv.readings.param.cumulative.reset.end')}
										</div>
									</Label>
									<Input
										type="text"
										id='cumulativeResetEnd'
										name='cumulativeResetEnd'
										onChange={handleChange}
										value={readingsData.cumulativeResetEnd}
										placeholder='HH:MM:SS'
									/>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for='endOnly'>
										<div className='pb-1'>
											{translate('csv.readings.param.endOnly')}
										</div>
									</Label>
									<Input
										type='select'
										id='endOnly'
										name='endOnly'
										value={readingsData.endOnly}
										onChange={handleChange}
									>
										<option value={BooleanTypes.true}> {translate('BooleanMeterTypes.true')} </option>
										<option value={BooleanTypes.false}> {translate('BooleanMeterTypes.false')} </option>
									</Input>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for='lengthGap'>
										<div className='pb-1'>
											{translate('csv.readings.param.length.gap')}
										</div>
									</Label>
									<Input
										type="number"
										id='lengthGap'
										name='lengthGap'
										min='0'
										value={readingsData.lengthGap}
										onChange={handleNumberChange}
										invalid={readingsData.lengthGap < 0}
									/>
									<FormFeedback>
										{translate('error.negative')}
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for='lengthVariation'>
										<div className='pb-1'>
											{translate('csv.readings.param.length.variation')}
										</div>
									</Label>
									<Input
										type="number"
										id='lengthVariation'
										name='lengthVariation'
										min='0'
										value={readingsData.lengthVariation}
										onChange={handleNumberChange}
										invalid={readingsData.lengthVariation < 0}
									/>
									<FormFeedback>
										{translate('error.negative')}
									</FormFeedback>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for='duplications'>
										<div className='pb-1'>
											{translate('meter.readingDuplication')}
										</div>
									</Label>
									<Input
										type='select'
										id='duplications'
										name='duplications'
										value={readingsData.duplications || ''}
										onChange={handleChange}
									>
										{range(1, 10).map(i => (
											<option key={i} value={i}> {i} </option>
										))}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for='timeSort'>
										<div className='pb-1'>
											{translate('meter.timeSort')}
										</div>
									</Label>
									<Input
										type='select'
										id='timeSort'
										name='timeSort'
										value={readingsData.timeSort}
										onChange={handleTimeSortChange}
									>
										<option value='increasing'> {translate('TimeSortTypes.increasing')} </option>
										<option value='decreasing'> {translate('TimeSortTypes.decreasing')} </option>
									</Input>
								</FormGroup>
							</Col>
						</Row>
						{/* TODO This feature is not working perfectly so disabling from web page but allowing in curl.
							Rest of changes left so easy to add back in. */}
						{/*
							<Label check>
								<Input
									checked={useMeterZone}
									type='checkbox'
									name='useMeterZone'
									onChange={handleCheckboxChange}
								/>
								<div className='ps-2'>
									{translate('csv.readings.param.use.meter.zone' />
								</div>
							</Label>
						*/}
						<div className='d-flex flex-row-reverse'>
							<div className='p-3'>
								<Button color='primary' type='submit' disabled={!isValidFileType || !meterIsSelected}>
									{translate('csv.submit.button')}
								</Button>
							</div>
							<div className='p-3'>
								<Button color='secondary' type='reset' onClick={handleClear}>
									{translate('csv.clear.button')}
								</Button>
							</div>
						</div>
						<div className='pb-5'>
						</div>
					</Col>
				</Row>
			</Form>
		</Container>
	);
}
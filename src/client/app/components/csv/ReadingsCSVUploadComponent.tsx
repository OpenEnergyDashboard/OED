/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { range } from 'lodash';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Col, Container, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { authApi, authPollInterval } from '../../redux/api/authApi';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import { ReadingsCSVUploadPreferences } from '../../types/csvUploadForm';
import { TrueFalseType } from '../../types/items';
import { MeterData, MeterTimeSortType } from '../../types/redux/meters';
import { submitReadings } from '../../utils/api/UploadCSVApi';
import { ReadingsCSVUploadDefaults } from '../../utils/csvUploadDefaults';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { useTranslate } from '../../redux/componentHooks';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateMeterModalComponent from '../meters/CreateMeterModalComponent';
import SpinnerComponent from '../SpinnerComponent';

/**
 * Defines the CSV Readings page
 * @returns CSV Readings page element
 */
export default function ReadingsCSVUploadComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	// Check for admin status
	const isAdmin = useAppSelector(selectIsAdmin);
	// page may contain admin info so verify admin status while admin is authenticated.
	authApi.useTokenPollQuery(undefined, { skip: !isAdmin, pollingInterval: authPollInterval });
	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	const { visibleMeters } = useAppSelector(selectVisibleMeterAndGroupData);
	// This is the state for the form data for readings
	const [readingsData, setReadingsData] = useState<ReadingsCSVUploadPreferences>(ReadingsCSVUploadDefaults);
	// This is the state for the file to be uploaded
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	// tracks whether or not a meter has been selected
	const meterIsSelected = readingsData.meterIdentifier !== '';
	// tracks if a new meter was created
	const [newMeterIdentifier, setNewMeterIdentifier] = useState<string>('');
	// tracks if file has .gzip or .csv extension
	const [isValidFileType, setIsValidFileType] = React.useState<boolean>(false);
	// tracks if should show spinner (true while loading data, false otherwise)
	const [showSpinner, setShowSpinner] = React.useState<boolean>(false);

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

	// need this change function because input type select expects a string as value
	const handleTrueFalseSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setReadingsData(prevData => ({
			...prevData,
			[name]: value === 'true'
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

	useEffect(() => {
		if (readingsData.cumulative === false) {
			setReadingsData(prevData => ({
				...prevData,
				cumulativeReset: false
			}));
		}
	}, [readingsData.cumulative]);

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
			cumulative: selectedMeter.cumulative,
			cumulativeReset: selectedMeter.cumulativeReset,
			cumulativeResetStart: selectedMeter.cumulativeResetStart,
			cumulativeResetEnd: selectedMeter.cumulativeResetEnd,
			duplications: Number(selectedMeter.readingDuplication),
			lengthGap: selectedMeter.readingGap,
			lengthVariation: selectedMeter.readingVariation,
			endOnly: selectedMeter.endOnlyTime,
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
			// show spinner before calling api, then stop it immediately after
			setShowSpinner(true);
			const { success, message } = await submitReadings(readingsData, selectedFile, dispatch);
			setShowSpinner(false);
			if (success) {
				showSuccessNotification(message);
			} else {
				showErrorNotification(message);
			}
		}
	};

	const spinContainerStyle = {
		display: 'flex',
		justifyContent: 'center'
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
			{showSpinner ? (
				<div style={spinContainerStyle}>
					<SpinnerComponent loading width={50} height={50} />
				</div>
			) : (<>
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
												{translate('meter.cumulative')}
											</div>
										</Label>
										<Input
											id='cumulative'
											name='cumulative'
											type='select'
											value={readingsData.cumulative ? 'true' : 'false'}
											onChange={handleTrueFalseSelectChange}
										>
											{Object.keys(TrueFalseType).map(key => {
												return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
											})}
										</Input>
									</FormGroup>
								</Col>
								<Col>
									<FormGroup>
										<Label for='cumulativeReset'>
											<div className='pb-1'>
												{translate('meter.cumulativeReset')}
											</div>
										</Label>
										{readingsData.cumulative === true ? (
											<Input
												type='select'
												id='cumulativeReset'
												name='cumulativeReset'
												value={readingsData.cumulativeReset ? 'true' : 'false'}
												onChange={handleTrueFalseSelectChange}
											>
												{Object.keys(TrueFalseType).map(key => {
													return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
												})}
											</Input>
										) : (
											<Input
												id='cumulativeReset'
												name='cumulativeReset'
												type='select'
												disabled
											>
												<option value='no'>Unavailable</option>
											</Input>
										)}
									</FormGroup>
								</Col>
							</Row>
							<Row xs='1' lg='2'>
								<Col>
									<FormGroup>
										<Label for='cumulativeResetStart'>
											<div className='pb-1'>
												{translate('meter.cumulativeResetStart')}
											</div>
										</Label>
										<Input
											type="text"
											id='cumulativeResetStart'
											name='cumulativeResetStart'
											onChange={handleChange}
											value={readingsData.cumulativeResetStart}
											placeholder='HH:MM:SS'
											disabled={readingsData.cumulativeReset === false || readingsData.cumulative === false}
										/>
									</FormGroup>
								</Col>
								<Col>
									<FormGroup>
										<Label for='cumulativeResetEnd'>
											<div className='pb-1'>
												{translate('meter.cumulativeResetEnd')}
											</div>
										</Label>
										<Input
											type="text"
											id='cumulativeResetEnd'
											name='cumulativeResetEnd'
											onChange={handleChange}
											value={readingsData.cumulativeResetEnd}
											placeholder='HH:MM:SS'
											disabled={readingsData.cumulativeReset === false || readingsData.cumulative === false}
										/>
									</FormGroup>
								</Col>
							</Row>
							<Row xs='1' lg='2'>
								<Col>
									<FormGroup>
										<Label for='endOnly'>
											<div className='pb-1'>
												{translate('meter.endOnlyTime')}
											</div>
										</Label>
										<Input
											type='select'
											id='endOnly'
											name='endOnly'
											value={readingsData.endOnly ? 'true' : 'false'}
											onChange={handleTrueFalseSelectChange}
										>
											{Object.keys(TrueFalseType).map(key => {
												return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
											})}
										</Input>
									</FormGroup>
								</Col>
								<Col>
									<FormGroup>
										<Label for='lengthGap'>
											<div className='pb-1'>
												{translate('meter.readingGap')}
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
									</FormGroup>
								</Col>
							</Row>
							<Row xs='1' lg='2'>
								<Col>
									<FormGroup>
										<Label for='lengthVariation'>
											<div className='pb-1'>
												{translate('meter.readingVariation')}
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
											{Object.keys(MeterTimeSortType).map(key => {
												return (<option value={key} key={key}>{translate(`TimeSortTypes.${key}`)}</option>);
											})}
										</Input>
									</FormGroup>
								</Col>
							</Row>
							{/* TODO This feature is not working perfectly so disabling from web page but allowing in curl.
								Rest of changes left so easy to add back in.
								This feature was added to help a site import data. It works but can have issues.
								Thus, it is only allowed for script uploading since that was the need. It was
								originally added to the web page input of import but decided to not allow
								it at this time. Thus, the code was commented out. As of now
								there is no plan to make this generally available due to its limitations.*/}
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
			</>)}
		</Container>
	);
}

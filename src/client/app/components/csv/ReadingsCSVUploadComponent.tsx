/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { range } from 'lodash';
import * as React from 'react';
import { Button, Col, Container, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { authApi, authPollInterval } from '../../redux/api/authApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectDefaultCreateMeterValues, selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import { BooleanMeterTypes, ReadingsCSVUploadPreferencesItem, TimeSortTypes } from '../../types/csvUploadForm';
import { MeterData } from '../../types/redux/meters';
import { submitReadings } from '../../utils/api/UploadCSVApi';
import { ReadingsCSVUploadDefaults } from '../../utils/csvUploadDefaults';
import { showErrorNotification, showInfoNotification } from '../../utils/notifications';
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

	// Check for admin status
	const isAdmin = useAppSelector(selectIsAdmin);
	// Memo'd memoized selector
	const defaultValues = { ...useAppSelector(selectDefaultCreateMeterValues), gps: null };
	// page may contain admin info so verify admin status while admin is authenticated.
	authApi.useTokenPollQuery(undefined, { skip: !isAdmin, pollingInterval: authPollInterval });
	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	const { visibleMeters } = useAppSelector(selectVisibleMeterAndGroupData);
	// This is the state for the form data for readings
	const [readingsData, setReadingsData] = React.useState<ReadingsCSVUploadPreferencesItem>(ReadingsCSVUploadDefaults);
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	// This is the state for the chosen meter to upload readings for
	const [selectedMeter, setSelectedMeter] = React.useState<MeterData>(defaultValues);
	// This is the state to track whether a new meter was created
	const [createdMeterIdentifier, setCreatedMeterIdentifier] = React.useState<string | null>(null);
	// tracks whether or not a meter has been selected
	const meterIsSelected = selectedMeter.identifier !== '';
	// tracks if file has .gzip or .csv extension
	const [isValidCSV, setIsValidCSV] = React.useState<boolean>(false);

	// gets the meter identifier and updates the created meter identifier to signal a new meter was created
	const handleCreateMeter = async (meterIdentifier: string) => {
		// Handle the returned meter data here in the parent component
		setCreatedMeterIdentifier(meterIdentifier);
	};

	// If a new meter was created then select it as the meter to be used
	React.useEffect(() => {
		if (createdMeterIdentifier) {
			const createdMeter = visibleMeters.find(meter => meter.identifier === createdMeterIdentifier) || null;
			if (createdMeter) {
				setSelectedMeter(createdMeter);
				setReadingsData(prevState => ({
					...prevState,
					meterIdentifier: createdMeter.identifier
				}));
			}
		}
	}, [createdMeterIdentifier, visibleMeters]);

	const handleFileChange = (file: File | null) => {
		setSelectedFile(file);
		if (!file) {
			//do nothing
		} else {
			if (file.name.slice(-4) === '.csv' || file.name.slice(-3) === '.gz') {
				setIsValidCSV(true);
			} else {
				setIsValidCSV(false);
				showErrorNotification(translate('csv.file.error') + file.name);
			}
		}
	};

	const handleSelectedMeterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedMeterIdentifier = e.target.value;
		const foundMeter = visibleMeters.find(meter => meter.identifier === selectedMeterIdentifier) || null;
		if (foundMeter) {
			setSelectedMeter(foundMeter);
			setReadingsData(prevState => ({
				...prevState,
				meterIdentifier: foundMeter.identifier
			}));
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setReadingsData(prevState => ({
			...prevState,
			[name]: value
		}));
	};

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setReadingsData(prevState => ({
			...prevState,
			[name]: checked
		}));
	};

	const getBooleanMeterType = (value: boolean | undefined) => {
		switch (value) {
			case true:
				return BooleanMeterTypes.true;
			case false:
				return BooleanMeterTypes.false;
			default:
				return '';
		}
	};

	const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (selectedFile) {
			try {
				const msg = await submitReadings(readingsData, selectedFile);
				showInfoNotification(msg as unknown as string);
			} catch (error) {
				// A failed axios request should result in an error.
				showErrorNotification(error.response.data as string);
			}
		}
	};

	const handleClear = () => {
		setSelectedMeter(defaultValues);
		setIsValidCSV(false);
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
						<h2>
							{translate('csv.upload.readings')}
							<div style={tooltipStyle}>
								<TooltipMarkerComponent page='help.csv.readings' helpTextId={tooltipStyle.tooltipReadings} />
							</div>
						</h2>
					</Col>
				</Row>
				<Row className='justify-content-md-center'>
					<Col md='auto'>
						<Label for='meterIdentifier'>
							<div className='pb-1'>
								{translate('csv.readings.param.meter.identifier')}
							</div>
							<Input
								id='meterIdentifier'
								name='meterIdentifier'
								type='select'
								required
								value={selectedMeter?.identifier || ''}
								onChange={handleSelectedMeterChange}
								invalid={!meterIsSelected}>
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
						</Label>
						<br />
						{isAdmin && <><CreateMeterModalComponent onCreateMeter={handleCreateMeter} /><br /><br /></>}
						<FormGroup>
							<Label for='timeSort'>
								<div className='pb-1'>
									{translate('meter.timeSort')}
								</div>
								<Input
									type='select'
									id='timeSort'
									name='timeSort'
									value={selectedMeter?.timeSort || ''}
									onChange={handleChange}
								>
									<option value={TimeSortTypes.meter}> {translate('TimeSortTypes.meter')} </option>
									<option value={TimeSortTypes.increasing}> {translate('TimeSortTypes.increasing')} </option>
									<option value={TimeSortTypes.decreasing}> {translate('TimeSortTypes.decreasing')} </option>
								</Input>
							</Label>
						</FormGroup>
						<FormGroup>
							<Label for='duplications'>
								<div className='pb-1'>
									{translate('meter.readingDuplication')}
								</div>
								<Input type='select' id='duplications' name='duplications' value={selectedMeter?.readingDuplication || ''} onChange={handleChange}>
									{range(1, 10).map(i => (
										<option key={i} value={i}> {i} </option>
									))}
								</Input>
							</Label>
						</FormGroup>
						<FormFileUploaderComponent
							formText='csv.upload.readings'
							onFileChange={handleFileChange}
							required
						/>
						<FormGroup>
							<div className='text-center pb-3'>
								<strong>
									Cumulative Data
								</strong>
							</div>
							<Row>
								<Col>
									<FormGroup>
										<Label for='cumulative'>
											<div className='pb-1'>
												{translate('csv.readings.param.cumulative')}
											</div>
											<Input
												type='select'
												id='cumulative'
												name='cumulative'
												value={getBooleanMeterType(selectedMeter?.cumulative)}
												onChange={handleChange}
											>
												<option value={BooleanMeterTypes.meter}> {translate('BooleanMeterTypes.meter')} </option>
												<option value={BooleanMeterTypes.true}> {translate('BooleanMeterTypes.true')} </option>
												<option value={BooleanMeterTypes.false}> {translate('BooleanMeterTypes.false')} </option>
											</Input>
										</Label>
									</FormGroup>
								</Col>
								<Col>
									<FormGroup>
										<Label for='cumulativeReset'>
											<div className='pb-1'>
												{translate('csv.readings.param.cumulative.reset')}
											</div>
											<Input
												type='select'
												id='cumulativeReset'
												name='cumulativeReset'
												value={getBooleanMeterType(selectedMeter?.cumulativeReset)}
												onChange={handleChange}
											>
												<option value={BooleanMeterTypes.meter}> {translate('BooleanMeterTypes.meter')} </option>
												<option value={BooleanMeterTypes.true}> {translate('BooleanMeterTypes.true')} </option>
												<option value={BooleanMeterTypes.false}> {translate('BooleanMeterTypes.false')} </option>
											</Input>
										</Label>
									</FormGroup>
								</Col>
							</Row>
							<Row>
								<Col>
									<FormGroup>
										<Label for='cumulativeResetStart'>
											<div className='pb-1'>
												{translate('csv.readings.param.cumulative.reset.start')}
											</div>
											<Input
												id='cumulativeResetStart'
												name='cumulativeResetStart'
												onChange={handleChange}
												value={selectedMeter?.cumulativeResetStart || ''}
												placeholder={ReadingsCSVUploadDefaults.cumulativeResetStart}
											/>
										</Label>
									</FormGroup>
								</Col>
								<Col>
									<FormGroup>
										<Label for='cumulativeResetEnd'>
											<div className='pb-1'>
												{translate('csv.readings.param.cumulative.reset.end')}
											</div>
											<Input
												id='cumulativeResetEnd'
												name='cumulativeResetEnd'
												onChange={handleChange}
												value={selectedMeter?.cumulativeResetEnd || ''}
												placeholder={ReadingsCSVUploadDefaults.cumulativeResetEnd}
											/>
										</Label>
									</FormGroup>
								</Col>
							</Row>
						</FormGroup>
						<FormGroup>
							<div className='text-center pb-3'>
								<strong>
									Time Gaps
								</strong>
							</div>
							<Row>
								<Col>
									<FormGroup>
										<Label for='lengthGap'>
											<div className='pb-1'>
												{translate('csv.readings.param.length.gap')}
											</div>
											<Input
												id='lengthGap'
												name='lengthGap'
												value={selectedMeter?.readingGap || ''}
												onChange={handleChange}
											/>
										</Label>
									</FormGroup>
								</Col>
								<Col>
									<FormGroup>
										<Label for='lengthVariation'>
											<div className='pb-1'>
												{translate('csv.readings.param.length.variation')}
											</div>
											<Input
												id='lengthVariation'
												name='lengthVariation'
												value={selectedMeter?.readingVariation || ''}
												onChange={handleChange}
											/>
										</Label>
									</FormGroup>
								</Col>
							</Row>
						</FormGroup>
						<FormGroup>
							<Label>
								<div className='pb-1'>
									{translate('csv.readings.param.endOnly')}
								</div>
								<Input
									type='select'
									id='endOnly'
									name='endOnly'
									value={getBooleanMeterType(selectedMeter?.cumulative)}
									onChange={handleChange}
								>
									<option value={BooleanMeterTypes.meter}> {translate('BooleanMeterTypes.meter')} </option>
									<option value={BooleanMeterTypes.true}> {translate('BooleanMeterTypes.true')} </option>
									<option value={BooleanMeterTypes.false}> {translate('BooleanMeterTypes.false')} </option>
								</Input>
							</Label>
						</FormGroup>
						<FormGroup>
							<Container>
								<Row>
									<Col>
										<Label for='gzip'>
											<div style={checkBox}>
												<Input
													type='checkbox'
													id='gzip'
													name='gzip'
													onChange={handleCheckboxChange}
												/>
												<div className='ps-2'>
													{translate('csv.common.param.gzip')}
												</div>
											</div>
										</Label>
									</Col>
									<Col>
										<Label for='headerRow'>
											<div style={checkBox}>
												<Input
													type='checkbox'
													id='headerRow'
													name='headerRow'
													onChange={handleCheckboxChange}
												/>
												<div className='ps-2'>
													{translate('csv.common.param.header.row')}
												</div>
											</div>
										</Label>
									</Col>
								</Row>
								<Row>
									<Col>
										<Label for='update'>
											<div style={checkBox}>
												<Input
													type='checkbox'
													id='update'
													name='update'
													onChange={handleCheckboxChange}
												/>
												<div className='ps-2'>
													{translate('csv.common.param.update')}
												</div>
											</div>
										</Label>
									</Col>
									<Col>
										<Label for='relaxedParsing'>
											<div style={checkBox}>
												<Input
													type='checkbox'
													id='relaxedParsing'
													name='relaxedParsing'
													onChange={handleCheckboxChange}
												/>
												<div className='ps-2'>
													{translate('csv.readings.param.relaxed.parsing')}
												</div>
											</div>
										</Label>
									</Col>
								</Row>
								<Row>
									<Col>
										<Label for='honorDst'>
											<div style={checkBox}>
												<Input
													type='checkbox'
													id='honorDst'
													name='honorDst'
													onChange={handleCheckboxChange}
												/>
												<div className='ps-2'>
													{translate('csv.readings.param.honor.dst')}
												</div>
											</div>
										</Label>
									</Col>
									<Col>
										<Label for='refreshReadings'>
											<div style={checkBox}>
												<Input
													type='checkbox'
													id='refreshReadings'
													name='refreshReadings'
													onChange={handleCheckboxChange}
												/>
												<div className='ps-2'>
													{translate('csv.readings.param.refresh.readings')}
												</div>
											</div>
										</Label>
									</Col>
								</Row>
							</Container>
						</FormGroup>
						{/* TODO This feature is not working perfectly so disabling from web page but allowing in curl.
							Rest of changes left so easy to add back in. */}
						{/*
						<FormGroup check style={checkboxStyle}>
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
						</FormGroup>
						*/}
						<div className='d-flex flex-row-reverse'>
							<div className='p-3'>
								<Button color='primary' type='submit' disabled={!isValidCSV || !meterIsSelected}>
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
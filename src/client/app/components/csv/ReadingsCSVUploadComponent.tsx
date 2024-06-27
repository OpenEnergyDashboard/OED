/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Col, Container, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { authApi, authPollInterval } from '../../redux/api/authApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import { BooleanMeterTypes, ReadingsCSVUploadPreferencesItem, TimeSortTypes } from '../../types/csvUploadForm';
import { MeterData } from '../../types/redux/meters';
import { uploadCSVApi } from '../../utils/api';
import { ReadingsCSVUploadDefaults } from '../../utils/csvUploadDefaults';
import { showErrorNotification, showInfoNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateMeterModalComponent from '../meters/CreateMeterModalComponent';

/**
 * Returns a range of values between the specified lower and upper bounds.
 * @param lower The lower bound, which will be included in the range.
 * @param upper The upper bound, which will be excluded from the range.
 * @returns An array of values between starting from the lower bound and up to and excluding the upper bound.
 */
function range(lower: number, upper: number): number[] {
	const arr = [];
	for (let i = lower; i < upper; i++) {
		arr.push(i);
	}
	return arr;
}

/**
 * Defines the CSV Readings page
 * @returns CSV Readings page element
 */
export default function ReadingsCSVUploadComponent() {

	// Check for admin status
	const isAdmin = useAppSelector(selectIsAdmin);
	// page may contain admin info so verify admin status while admin is authenticated.
	authApi.useTokenPollQuery(undefined, { skip: !isAdmin, pollingInterval: authPollInterval });
	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	const { visibleMeters } = useAppSelector(selectVisibleMeterAndGroupData);
	const [readingsData, setReadingsData] = React.useState<ReadingsCSVUploadPreferencesItem>(ReadingsCSVUploadDefaults);
	const fileInputReference = React.useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [selectedMeter, setSelectedMeter] = React.useState<MeterData | null>(null);
	const [createdMeterIdentifier, setCreatedMeterIdentifier] = React.useState<string | null>(null);

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
			}
		}
	}, [createdMeterIdentifier, visibleMeters]);

	const handleFileChange = (file: File | null) => {
		setSelectedFile(file);
	};

	const handleSelectedMeterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedMeterName = e.target.value;
		const foundMeter = visibleMeters.find(meter => meter.name === selectedMeterName) || null;
		setSelectedMeter(foundMeter);
		setReadingsData(prevState => ({
			...prevState,
			meterName: selectedMeterName
		}));
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

	const submitReadings = async (file: File) => {
		return await uploadCSVApi.submitReadings(readingsData, file);
	};

	// dispatch(fetchMetersDetails());
	// TODO Using an alert is not the best. At some point this should be integrated
	// with react.
	// There should be a message (not void) but that is not the type so overriding.
	const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (selectedFile) {
			try {
				const msg = await submitReadings(selectedFile);
				showInfoNotification(msg as unknown as string);
				window.location.reload();
			} catch (error) {
				// A failed axios request should result in an error.
				showErrorNotification(error.response.data as string);
			}
		}
	};

	const handleClear = () => {
		setSelectedMeter(null);
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
						<Label for='meterName'>
							<div className='pb-1'>
								{translate('name')}
							</div>
							<Input
								id='meterName'
								name='meterName'
								type='select'
								value={selectedMeter?.name || ''}
								onChange={handleSelectedMeterChange}>
								<option value='default' key='-1'>Select a Meter</option>
								{Array.from(visibleMeters).map(meter => {
									return (<option value={meter.name} key={meter.id}>{meter.name}</option>);
								})}
							</Input>
						</Label>
						<br />
						<CreateMeterModalComponent onCreateMeter={handleCreateMeter} />
						<br /><br />
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
										<option key={i} value={`${i}`}> {i} </option>
									))}
								</Input>
							</Label>
						</FormGroup>
						<FormFileUploaderComponent
							formText='csv.upload.readings'
							onFileChange={handleFileChange}
							reference={fileInputReference}
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
												<div>
													<Input
														type='checkbox'
														id='gzip'
														name='gzip'
														onChange={handleCheckboxChange}
													/>
												</div>
												<div className='ps-2'>
													{translate('csv.common.param.gzip')}
												</div>
											</div>
										</Label>
									</Col>
									<Col>
										<Label for='headerRow'>
											<div style={checkBox}>
												<div>
													<Input
														type='checkbox'
														id='headerRow'
														name='headerRow'
														onChange={handleCheckboxChange}
													/>
												</div>
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
												<div>
													<Input
														type='checkbox'
														id='update'
														name='update'
														onChange={handleCheckboxChange}
													/>
												</div>
												<div className='ps-2'>
													{translate('csv.common.param.update')}
												</div>
											</div>
										</Label>
									</Col>
									<Col>
										<Label for='relaxedParsing'>
											<div style={checkBox}>
												<div>
													<Input
														type='checkbox'
														id='relaxedParsing'
														name='relaxedParsing'
														onChange={handleCheckboxChange}
													/>
												</div>
												<div className='ps-2'>
													{translate('csv.readings.param.relaxed.parsing')}
												</div>
											</div>
										</Label>
									</Col>
								</Row>
								<Row>
									<Col>
										<Label for='refreshHourlyReadings'>
											<div style={checkBox}>
												<div>
													<Input
														type='checkbox'
														id='refreshHourlyReadings'
														name='refreshHourlyReadings'
														onChange={handleCheckboxChange}
													/>
												</div>
												<div className='ps-2'>
													{translate('csv.readings.param.refresh.hourly.readings')}
												</div>
											</div>
										</Label>
									</Col>
									<Col>
										<Label for='refreshReadings'>
											<div style={checkBox}>
												<div>
													<Input
														type='checkbox'
														id='refreshReadings'
														name='refreshReadings'
														onChange={handleCheckboxChange}
													/>
												</div>
												<div className='ps-2'>
													{translate('csv.readings.param.refresh.readings')}
												</div>
											</div>
										</Label>
									</Col>
								</Row>
								<Row>
									<Col>
										<Label for='honorDst'>
											<div style={checkBox}>
												<div>
													<Input
														type='checkbox'
														id='honorDst'
														name='honorDst'
														onChange={handleCheckboxChange}
													/>
												</div>
												<div className='ps-2'>
													{translate('csv.readings.param.honor.dst')}
												</div>
											</div>
										</Label>
									</Col>
								</Row>
							</Container>
						</FormGroup>
						<div className='d-flex flex-row-reverse'>
							<div className='p-3'>
								<Button color='primary' type='submit'>
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
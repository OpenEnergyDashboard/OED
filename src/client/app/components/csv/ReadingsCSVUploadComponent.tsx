/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Form, FormGroup, Input, Label } from 'reactstrap';
import { BooleanMeterTypes, TimeSortTypes, ReadingsCSVUploadPreferencesItem } from '../../types/csvUploadForm';
import { ReadingsCSVUploadDefaults } from '../../utils/csvUploadDefaults';
import { showErrorNotification, showInfoNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import { uploadCSVApi } from '../../utils/api';
import CreateMeterModalComponent from '../meters/CreateMeterModalComponent';
import { useAppSelector } from '../../redux/reduxHooks';
import { authApi, authPollInterval } from '../../redux/api/authApi';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import { selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import { MeterData } from '../../types/redux/meters';

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
 * Defines the CSV Readings page card view
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
	}, [createdMeterIdentifier,visibleMeters]);

	const handleFileChange = (file: File | null) => {
		setSelectedFile(file);
	};

	const handleSelectedMeterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedMeterId = parseInt(e.target.value, 10);
		const foundMeter = visibleMeters.find(meter => meter.id === selectedMeterId) || null;
		setSelectedMeter(foundMeter);
	};

	const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

	return (
		<div style={formStyle}>
			<Form onSubmit={handleSubmit}>
				<FormGroup>
					<Label style={titleStyle}>
						<FormattedMessage id='csv.readings.param.meter.name' />
					</Label>
					<Col sm={8}>
						<Input
							id='meterId'
							name='meterId'
							type='select'
							value={selectedMeter?.id || ''}
							onChange={handleSelectedMeterChange}>
							<option value='default' key='-1'>Select a Meter</option>
							{Array.from(visibleMeters).map(meter => {
								return (<option value={meter.id} key={meter.id}>{meter.identifier}</option>);
							})}
						</Input>
					</Col>
					<br></br>
					<Col sm={8}>
						<CreateMeterModalComponent onCreateMeter={handleCreateMeter}/>
					</Col>
				</FormGroup>
				<FormGroup>
					<Label style={titleStyle}>
						<FormattedMessage id='csv.readings.param.time.sort' />
					</Label>
					<Col sm={8}>
						<Input type='select' name='timeSort' value={selectedMeter?.timeSort || ''} onChange={handleChange}>
							<option value={TimeSortTypes.meter}> {translate('TimeSortTypes.meter')} </option>
							<option value={TimeSortTypes.increasing}> {translate('TimeSortTypes.increasing')} </option>
							<option value={TimeSortTypes.decreasing}> {translate('TimeSortTypes.decreasing')} </option>
						</Input>
					</Col>
				</FormGroup>
				<FormGroup>
					<Label style={titleStyle}>
						<FormattedMessage id='csv.readings.param.duplications' />
					</Label>
					<Col sm={8}>
						<Input type='select' name='duplications' value={selectedMeter?.readingDuplication || ''} onChange={handleChange}>
							{range(1, 10).map(i => (
								<option key={i} value={`${i}`}> {i} </option>
							))}
						</Input>
					</Col>
				</FormGroup>
				<FormFileUploaderComponent
					formText='csv.upload.readings'
					onFileChange={handleFileChange}
					reference={fileInputReference}
					required labelStyle={titleStyle}
				/>
				<FormGroup>
					<Label style={titleStyle}>
						<FormattedMessage id='csv.readings.section.cumulative.data' />
						<Col sm={8}>
							<FormGroup>
								<Label style={titleStyle}>
									<FormattedMessage id='csv.readings.param.cumulative' />
									<Col sm={12}>
										<Input
											type='select'
											name='cumulative'
											value={getBooleanMeterType(selectedMeter?.cumulative)}
											onChange={handleChange}
										>
											<option value={BooleanMeterTypes.meter}> {translate('BooleanMeterTypes.meter')} </option>
											<option value={BooleanMeterTypes.true}> {translate('BooleanMeterTypes.true')} </option>
											<option value={BooleanMeterTypes.false}> {translate('BooleanMeterTypes.false')} </option>
										</Input>
									</Col>
								</Label>
							</FormGroup>
							<FormGroup>
								<Label style={titleStyle}>
									<FormattedMessage id='csv.readings.param.cumulative.reset' />
								</Label>
								<Col sm={12}>
									<Input
										type='select'
										name='cumulativeReset'
										value={getBooleanMeterType(selectedMeter?.cumulative)}
										onChange={handleChange}
									>
										<option value={BooleanMeterTypes.meter}> {translate('BooleanMeterTypes.meter')} </option>
										<option value={BooleanMeterTypes.true}> {translate('BooleanMeterTypes.true')} </option>
										<option value={BooleanMeterTypes.false}> {translate('BooleanMeterTypes.false')} </option>
									</Input>
								</Col>
							</FormGroup>
							<FormGroup>
								<Label style={titleStyle}>
									<FormattedMessage id='csv.readings.param.cumulative.reset.start' />
								</Label>
								<Col sm={12}>
									<Input
										name='cumulativeResetStart'
										onChange={handleChange}
										value={selectedMeter?.cumulativeResetStart || ''}
										placeholder={ReadingsCSVUploadDefaults.cumulativeResetStart}
									/>
								</Col>
							</FormGroup>
							<FormGroup>
								<Label style={titleStyle}>
									<FormattedMessage id='csv.readings.param.cumulative.reset.end' />
								</Label>
								<Col sm={12}>
									<Input
										name='cumulativeResetEnd'
										onChange={handleChange}
										value={selectedMeter?.cumulativeResetEnd || ''}
										placeholder={ReadingsCSVUploadDefaults.cumulativeResetEnd}
									/>
								</Col>
							</FormGroup>
						</Col>
					</Label>
				</FormGroup>
				<FormGroup>
					<Label style={titleStyle}>
						<FormattedMessage id='csv.readings.section.time.gaps' />
					</Label>
					<Col sm={8}>
						<FormGroup>
							<Label style={titleStyle}>
								<FormattedMessage id='csv.readings.param.lengthGap' />
							</Label>
							<Col sm={12}>
								<Input name='lengthGap' value={selectedMeter?.readingGap || ''} onChange={handleChange} />
							</Col>
						</FormGroup>
						<FormGroup>
							<Label style={titleStyle}>
								<FormattedMessage id='csv.readings.param.length.variation' />
							</Label>
							<Col sm={12}>
								<Input name='lengthVariation' value={selectedMeter?.readingVariation || ''} onChange={handleChange} />
							</Col>
						</FormGroup>
					</Col>
				</FormGroup>
				<FormGroup>
					<Label style={titleStyle}>
						<FormattedMessage id='csv.readings.param.endOnly' />
					</Label>
					<Col sm={8}>
						<Input type='select' name='endOnly' value={getBooleanMeterType(selectedMeter?.cumulative)} onChange={handleChange}>
							<option value={BooleanMeterTypes.meter}> {translate('BooleanMeterTypes.meter')} </option>
							<option value={BooleanMeterTypes.true}> {translate('BooleanMeterTypes.true')} </option>
							<option value={BooleanMeterTypes.false}> {translate('BooleanMeterTypes.false')} </option>
						</Input>
					</Col>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input type='checkbox' name='gzip' onChange={handleCheckboxChange} />
						<FormattedMessage id='csv.common.param.gzip' />
					</Label>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input type='checkbox' name='headerRow' onChange={handleCheckboxChange} />
						<FormattedMessage id='csv.common.param.header.row' />
					</Label>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input type='checkbox' name='update' onChange={handleCheckboxChange} />
						<FormattedMessage id='csv.common.param.update' />
					</Label>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input type='checkbox' name='refreshReadings' onChange={handleCheckboxChange} />
						<FormattedMessage id='csv.readings.param.refresh.readings' />
					</Label>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input type='checkbox' name='refreshHourlyReadings' onChange={handleCheckboxChange} />
						<FormattedMessage id='csv.readings.param.refresh.hourlyReadings' />
					</Label>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input type='checkbox' name='honorDst' onChange={handleCheckboxChange} />
						<FormattedMessage id='csv.readings.param.honor.dst' />
					</Label>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input type='checkbox' name='relaxedParsing' onChange={handleCheckboxChange} />
						<FormattedMessage id='csv.readings.param.relaxed.parsing' />
					</Label>
				</FormGroup>
				<Button color='secondary' type='submit'>
					<FormattedMessage id='csv.submit.button' />
				</Button>
			</Form>
		</div>
	);
}

const titleStyle: React.CSSProperties = {
	fontWeight: 'bold',
	paddingBottom: '5px'
};

const checkboxStyle: React.CSSProperties = {
	paddingBottom: '15px'
};

const formStyle: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'center',
	padding: '20px'
};
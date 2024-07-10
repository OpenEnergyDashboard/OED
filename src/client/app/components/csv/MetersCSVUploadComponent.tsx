/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { baseApi } from '../../redux/api/baseApi';
import { useAppDispatch } from '../../redux/reduxHooks';
import { MetersCSVUploadPreferencesItem } from '../../types/csvUploadForm';
import { uploadCSVApi } from '../../utils/api';
import { MetersCSVUploadDefaults } from '../../utils/csvUploadDefaults';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

/**
 * Defines the CSV Meters page
 * @returns CSV Meters page element
 */
export default function MetersCSVUploadComponent() {
	const dispatch = useAppDispatch();
	const [meterData, setMeterData] = React.useState<MetersCSVUploadPreferencesItem>(MetersCSVUploadDefaults);
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [isValidCSV, setIsValidCSV] = React.useState<boolean>(false);

	// This is needed until a React CSV API is created or integrated with the Redux meter API
	const resetApiCache = () => {
		dispatch(baseApi.util.invalidateTags(['MeterData']));
	};

	const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (selectedFile) {
			try {
				await submitMeters(selectedFile);
				showSuccessNotification('<h1> SUCCESS </h1>The meter was uploaded successfully.');
			} catch (error) {
				// A failed axios request should result in an error.
				showErrorNotification(error.response.data as string);
			}
		}
		resetApiCache();
	};

	const handleFileChange = (file: File | null) => {
		setSelectedFile(file);
		if (!file) return;
		if (file.name.slice(-4) === '.csv' || file.name.slice(-3) === '.gz') {
			setIsValidCSV(true);
		} else {
			setIsValidCSV(false);
			showErrorNotification(translate('csv.file.error') + file.name);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setMeterData(prevState => ({
			...prevState,
			[name]: value
		}));
	};

	const submitMeters = async (file: File) => {
		return await uploadCSVApi.submitMeters(meterData, file);
	};

	const handleClear = () => {
		setMeterData({
			meterIdentifier: '',
			gzip: false,
			headerRow: false,
			update: false
		});
		setIsValidCSV(false);
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		tooltipReadings: 'help.csv.meters'
	};

	const checkBox = {
		display: 'flex'
	};

	return (
		<Container className="min-vh-100">
			<TooltipHelpComponent page='help.csv.meters' />
			<Form onSubmit={handleSubmit}>
				<Row className="justify-content-md-center">
					<Col md='auto'>
						<h2>
							{translate('csv.upload.meters')}
							<div style={tooltipStyle}>
								<TooltipMarkerComponent page='help.csv.meters' helpTextId={tooltipStyle.tooltipReadings} />
							</div>
						</h2>
					</Col>
				</Row>
				<Row className='justify-content-md-center'>
					<Col md='auto'>
						<FormFileUploaderComponent
							formText='csv.upload.meters'
							onFileChange={handleFileChange}
							required
						/>
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
													onChange={handleChange}
												/>
												<div className='ps-2'>
													{translate('csv.common.param.gzip')}
												</div>
											</div>
										</Label>
									</Col>
								</Row>
								<Row>
									<Col>
										<Label for='headerRow'>
											<div style={checkBox}>
												<Input
													type='checkbox'
													id='headerRow'
													name='headerRow'
													onChange={handleChange}
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
													onChange={handleChange}
												/>
												<div className='ps-2'>
													{translate('csv.common.param.update')}
												</div>
											</div>
										</Label>
									</Col>
								</Row>
							</Container>
						</FormGroup>
						<FormGroup>
							<Label for='meterIdentifier'>
								<FormattedMessage id='csv.readings.param.meter.identifier' />
								<Input
									value={meterData.meterIdentifier}
									id='meterIdentifier'
									name='meterIdentifier'
									onChange={handleChange}
								/>
							</Label>
						</FormGroup>
						<div className='d-flex flex-row-reverse'>
							<div className='p-3'>
								<Button color='primary' type='submit' disabled={!isValidCSV}>
									{translate('csv.submit.button')}
								</Button>
							</div>
							<div className='p-3'>
								<Button color='secondary' type='reset' onClick={handleClear}>
									{translate('csv.clear.button')}
								</Button>
							</div>
						</div>
					</Col>
				</Row>
			</Form>
		</Container>
	);
}
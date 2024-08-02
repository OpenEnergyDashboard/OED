/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { useAppDispatch } from '../../redux/reduxHooks';
import { MetersCSVUploadPreferencesItem } from '../../types/csvUploadForm';
import { submitMeters } from '../../utils/api/UploadCSVApi';
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
	const [meterData, setMeterData] = React.useState<MetersCSVUploadPreferencesItem>(MetersCSVUploadDefaults);
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [isValidFileType, setIsValidFileType] = React.useState<boolean>(false);
	const dispatch = useAppDispatch();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setMeterData(prevData => ({
			...prevData,
			[name]: value
		}));
	};

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setMeterData(prevData => ({
			...prevData,
			[name]: checked
		}));
	};

	const handleFileChange = (file: File) => {
		setSelectedFile(file);
		if (file.name.slice(-4) === '.csv' || file.name.slice(-3) === '.gz') {
			setIsValidFileType(true);
		} else {
			setIsValidFileType(false);
			setSelectedFile(null);
			showErrorNotification(translate('csv.file.error') + file.name);
		}
	};

	const handleClear = () => {
		setMeterData(MetersCSVUploadDefaults);
		setIsValidFileType(false);
	};

	const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (selectedFile) {
			const { status, message } = await submitMeters(meterData, selectedFile, dispatch);
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
						<div className="text-center">
							<h2>
								{translate('csv.upload.meters')}
								<div style={tooltipStyle}>
									<TooltipMarkerComponent page='help.csv.meters' helpTextId={tooltipStyle.tooltipReadings} />
								</div>
							</h2>
						</div>
						<FormFileUploaderComponent
							onFileChange={handleFileChange}
							isInvalid={!!selectedFile}
						/>
						<FormGroup>
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
							</Row>
							<Row>
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
							</Row>
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
								<Button color='primary' type='submit' disabled={!isValidFileType}>
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
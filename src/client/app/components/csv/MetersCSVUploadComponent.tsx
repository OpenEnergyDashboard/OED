/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import { baseApi } from '../../redux/api/baseApi';
import { useDispatch } from 'react-redux';
import { uploadCSVApi } from '../../utils/api';

interface MetersCSVUploadComponentProps {}

const MetersCSVUploadComponent: React.FC<MetersCSVUploadComponentProps> = () => {
	const dispatch = useDispatch();
	const[ meterData, setMeterData] = React.useState({
		meterName: '',
		gzip: false,
		headerRow: false,
		update: false
	});
	const [ file, setFile ] = React.useState<File | null>(null);
	const fileInput = React.useRef<HTMLInputElement>(null);
	const resetApiCache = () => {
		dispatch(baseApi.util.invalidateTags(['MeterData']));
	};

	const handleSubmit = async(e: React.MouseEvent<HTMLFormElement>) => {
		e.preventDefault();
		if(file) {
			try {
				await submitMeters(file);
				showSuccessNotification('<h1> SUCCESS </h1>The meter was uploaded successfully.');
			} catch (error) {
				// A failed axios request should result in an error.
				showErrorNotification(error.response.data as string);
			}
		}
		resetApiCache();
	};

	const handleFileChange = (file : File | null) => {
		setFile(file);
	};

	const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setMeterData(prevState => ({
			...prevState,
			[name]: value
		}));
	};

	const submitMeters = async (file : File) => {
		return await uploadCSVApi.submitMeters(meterData, file);
	};

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

	return (
		<div style={formStyle}>
			<Form onSubmit={handleSubmit}>
				<FormFileUploaderComponent formText='csv.upload.meters' reference={fileInput} required labelStyle={titleStyle} onFileChange={handleFileChange} />
				<FormGroup check style={checkboxStyle}>
					<Label>
						<Input checked={meterData.gzip} type='checkbox' name='gzip' onChange={handleChange} />
						<FormattedMessage id='csv.common.param.gzip' />
					</Label>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input checked={meterData.headerRow} type='checkbox' name='headerRow' onChange={handleChange} />
						<FormattedMessage id='csv.common.param.header.row' />
					</Label>
				</FormGroup>
				<FormGroup check style={checkboxStyle}>
					<Label check>
						<Input checked={meterData.update} type='checkbox' name='update' onChange={handleChange} />
						<FormattedMessage id='csv.common.param.update' />
					</Label>
				</FormGroup>
				<FormGroup>
					<Label style={titleStyle}>
						<FormattedMessage id='csv.readings.param.meter.name' />
					</Label>
					<Input value={meterData.meterName} name='meterName' onChange={handleChange} />
				</FormGroup>
				<Button color='secondary' type='submit'>
					<FormattedMessage id='csv.submit.button' />
				</Button>
			</Form>
		</div>
	);
};

export default MetersCSVUploadComponent;
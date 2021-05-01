/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Col, Input, Form, FormGroup, Label } from 'reactstrap';
import { ReadingsCSVUploadProps, TimeSortTypes } from 'types/csvUploadForm';
import { showErrorNotification } from '../../utils/notifications';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import translate from '../../utils/translate';

/** A range of values, inclusive lower bound and exclusive upper bound. */
function range(lower: number, upper: number): number[] {
	const arr = [];
	for (let i = lower; i < upper; i++) {
		arr.push(i);
	}
	return arr;
}

export default class ReadingsCSVUploadComponent extends React.Component<ReadingsCSVUploadProps> {
	private fileInput: React.RefObject<HTMLInputElement>;
	constructor(props: ReadingsCSVUploadProps) {
		super(props);
		this.handleSelectDuplications = this.handleSelectDuplications.bind(this);
		this.handleSelectTimeSort = this.handleSelectTimeSort.bind(this);
		this.handleSetMeterName = this.handleSetMeterName.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.fileInput = React.createRef();
	}

	private async handleSubmit(e: React.MouseEvent<HTMLFormElement>) {
		try {
			e.preventDefault();
			const current = this.fileInput.current as HTMLInputElement;
			const { files } = current;
			if (files && (files as FileList).length !== 0) {
				await this.props.submitCSV(files[0]);
			} else {
				showErrorNotification(translate('No Meters CSV File was uploaded!'), undefined, 10);
			}
			// Respond to success.
		} catch (error) {
			// A failed axios request should result in an error.
			showErrorNotification(translate(error.response.data as string), undefined, 10);
		}
	}

	private handleSelectDuplications(e: React.ChangeEvent<HTMLInputElement>) {
		const target = e.target;
		this.props.selectDuplications(target.value);
	}

	private handleSelectTimeSort(e: React.ChangeEvent<HTMLInputElement>) {
		const target = e.target;
		this.props.selectTimeSort(target.value as TimeSortTypes);
	}

	private handleSetMeterName(e: React.ChangeEvent<HTMLInputElement>) {
		const target = e.target;
		this.props.setMeterName(target.value);
	}

	public render() {
		const titleStyle: React.CSSProperties = {
			fontWeight: 'bold',
			paddingBottom: '5px'
		};

		const checkboxStyle: React.CSSProperties = {
			paddingBottom: '15px'
		}

		const formStyle: React.CSSProperties = {
			display: 'flex',
			justifyContent: 'center',
			padding: '20px'
		}

		return (
			<div style={formStyle}>
				<Form onSubmit={this.handleSubmit}>
					<FormGroup>
						<Label style={titleStyle}>
							Meter name
						</Label>
						<Col sm={8}>
							<Input required value={this.props.meterName} name='meterName' onChange={this.handleSetMeterName} />
						</Col>
					</FormGroup>
					<FormGroup>
						<Label style={titleStyle}>
							Time Sort
						</Label>
						<Col sm={8}>
							<Input type='select' name='timeSort' onChange={this.handleSelectTimeSort}>
								<option value={TimeSortTypes.increasing}> {TimeSortTypes.increasing} </option>
							</Input>
						</Col>
					</FormGroup>
					<FormGroup>
						<Label style={titleStyle}>
							Duplications
						</Label>
						<Col sm={8}>
							<Input value={this.props.duplications} type='select' name='duplications' onChange={this.handleSelectDuplications}>
								{range(1, 10).map(i => (
									<option key={i} value={`${i}`}> {i} </option>
								))}
							</Input>
						</Col>
					</FormGroup>
					<FormFileUploaderComponent buttonText='Upload Readings CSV' reference={this.fileInput} required labelStyle={titleStyle} />
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.createMeter} type='checkbox' name='createMeter' onChange={this.props.toggleCreateMeter} />
							Create Meter
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.cumulative} type='checkbox' name='cumulative' onChange={this.props.toggleCumulative} />
							Cumulative
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.cumulativeReset} type='checkbox' name='cumulativeReset' onChange={this.props.toggleCumulativeReset} />
							Cumulative Reset
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.gzip} type='checkbox' name='gzip' onChange={this.props.toggleGzip} />
							Gzip
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.headerRow} type='checkbox' name='headerRow' onChange={this.props.toggleHeaderRow} />
							Header Row
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.update} type='checkbox' name='update' onChange={this.props.toggleUpdate} />
							Update
						</Label>
					</FormGroup>
					<Button type='submit'> Submit CSV Data </Button>
				</Form>
			</div>
		)
	}
}

/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Col, Input, Form, FormGroup, Label } from 'reactstrap';
import { ReadingsCSVUploadProps, TimeSortTypes } from '../../types/csvUploadForm';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import translate from '../../utils/translate';
import { FormattedMessage } from 'react-intl';

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
				showSuccessNotification(translate('csv.success.upload.readings'));
			}
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

	private handleSetCumulativeResetStart(e: React.ChangeEvent<HTMLInputElement>) {
		const target = e.target;
		this.props.setCumulativeResetStart(target.value);
	}

	private handleSetCumulativeResetEnd(e: React.ChangeEvent<HTMLInputElement>) {
		const target = e.target;
		this.props.setCumulativeResetEnd(target.value);
	}

	private handleSetLength(e: React.ChangeEvent<HTMLInputElement>) {
		const target = e.target;
		this.props.setLength(target.value);
	}

	private handleSetLengthVariation(e: React.ChangeEvent<HTMLInputElement>) {
		const target = e.target;
		this.props.setLengthVariation(target.value);
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
							<FormattedMessage id='csv.readings.param.meter.name' />
						</Label>
						<Col sm={8}>
							<Input required value={this.props.meterName} name='meterName' onChange={this.handleSetMeterName} />
						</Col>
					</FormGroup>
					<FormGroup>
						<Label style={titleStyle}>
							<FormattedMessage id='csv.readings.param.time.sort' />
						</Label>
						<Col sm={8}>
							<Input type='select' name='timeSort' onChange={this.handleSelectTimeSort}>
								<option value={TimeSortTypes.increasing}> {TimeSortTypes.increasing} </option>
							</Input>
						</Col>
					</FormGroup>
					<FormGroup>
						<Label style={titleStyle}>
							<FormattedMessage id='csv.readings.param.duplications' />
						</Label>
						<Col sm={8}>
							<Input value={this.props.duplications} type='select' name='duplications' onChange={this.handleSelectDuplications}>
								{range(1, 10).map(i => (
									<option key={i} value={`${i}`}> {i} </option>
								))}
							</Input>
						</Col>
					</FormGroup>
					<FormFileUploaderComponent formText='csv.upload.readings' reference={this.fileInput} required labelStyle={titleStyle} />
					<FormGroup>
						<Label style={titleStyle}>
							<FormattedMessage id='csv.readings.section.cumulative.data' />
						</Label>
						<Col sm={8}>
							<FormGroup check style={checkboxStyle}>
								<Label check>
									<Input checked={this.props.cumulative} type='checkbox' name='cumulative' onChange={this.props.toggleCumulative} />
									<FormattedMessage id='csv.readings.param.cumulative' />
								</Label>
							</FormGroup>
							<FormGroup check style={checkboxStyle}>
								<Label check>
									<Input checked={this.props.cumulativeReset} type='checkbox' name='cumulativeReset' onChange={this.props.toggleCumulativeReset} />
									<FormattedMessage id='csv.readings.param.cumulative.reset' />
								</Label>
							</FormGroup>
							<FormGroup>
								<Label style={titleStyle}>
									<FormattedMessage id='csv.readings.param.cumulative.reset.start' />
								</Label>
								<Col sm={8}>
									<Input value={this.props.cumulativeResetStart} name='cumulativeResetStart' onChange={this.handleSetCumulativeResetStart} />
								</Col>
							</FormGroup>
							<FormGroup>
								<Label style={titleStyle}>
									<FormattedMessage id='csv.readings.param.cumulative.reset.end' />
								</Label>
								<Col sm={8}>
									<Input value={this.props.cumulativeResetEnd} name='cumulativeResetEnd' onChange={this.handleSetCumulativeResetEnd} />
								</Col>
							</FormGroup>
						</Col>
					</FormGroup>
					<FormGroup>
						<Label style={titleStyle}>
							<FormattedMessage id='csv.readings.section.time.gaps' />
						</Label>
						<Col sm={8}>
							<FormGroup>
								<Label style={titleStyle}>
									<FormattedMessage id='csv.readings.param.length' />
								</Label>
								<Col sm={8}>
									<Input value={this.props.length} name='length' onChange={this.handleSetLength} />
								</Col>
							</FormGroup>
							<FormGroup>
								<Label style={titleStyle}>
									<FormattedMessage id='csv.readings.param.length.variation' />
								</Label>
								<Col sm={8}>
									<Input value={this.props.cumulativeResetEnd} name='lengthVariation' onChange={this.handleSetLengthVariation} />
								</Col>
							</FormGroup>
						</Col>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.createMeter} type='checkbox' name='createMeter' onChange={this.props.toggleCreateMeter} />
							<FormattedMessage id='csv.readings.param.create.meter' />
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.gzip} type='checkbox' name='gzip' onChange={this.props.toggleGzip} />
							<FormattedMessage id='csv.common.param.gzip' />
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.headerRow} type='checkbox' name='headerRow' onChange={this.props.toggleHeaderRow} />
							<FormattedMessage id='csv.common.param.header.row' />
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.refreshReadings} type='checkbox' name='refreshReadings' onChange={this.props.toggleRefreshReadings} />
							<FormattedMessage id='csv.readings.param.refresh.readings' />
						</Label>
					</FormGroup>
					<FormGroup check style={checkboxStyle}>
						<Label check>
							<Input checked={this.props.update} type='checkbox' name='update' onChange={this.props.toggleUpdate} />
							<FormattedMessage id='csv.common.param.update' />
						</Label>
					</FormGroup>
					<Button type='submit'>
						<FormattedMessage id='csv.submit.button' />
					</Button>
				</Form>
			</div>
		)
	}
}

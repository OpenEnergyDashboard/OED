/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Input, Form, FormGroup, FormText, Label } from 'reactstrap';
import { ReadingsCSVUploadProps, TimeSortTypes } from 'types/csvUploadForm';

function SubmitButton() {
	return (<Button type='submit'> Submit CSV Data </Button>)
}

interface FileUploader {
	reference: React.RefObject<HTMLInputElement>;
	required: boolean;
}

function FileUploaderComponent(props: FileUploader) {
	return (
		<FormGroup>
			<Label for='fileUploader'>CSV File</Label>
			<Input innerRef={props.reference} type='file' name='csvfile' id='fileUploader' required={props.required} />
			<FormText color='muted'>
				Upload your CSV file here.
        	</FormText>
		</FormGroup>
	)

}

class ReadingsCSVUploadComponent extends React.Component<ReadingsCSVUploadProps> {
	private fileInput: React.RefObject<HTMLInputElement>;
	constructor(props: ReadingsCSVUploadProps) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.fileInput = React.createRef();
	}

	handleSubmit = async (e) => {
		try {
			e.preventDefault();
			await this.props.submitCSV(this.fileInput.current.files[0]); // Not sure how to respond to this typescript error.
			// Respond to success.
		} catch (error) {
			// A failed axios request should result in an error.
			console.log(error);
		}
	}

	public render() {
		return (
			<Form onSubmit={this.handleSubmit}>
				<FormGroup>
					<Input checked={this.props.gzip} type='checkbox' name='gzip' id='gzip' onChange={this.props.toggleGzip} />
					<Label for='gzip'> Gzip </Label>
				</FormGroup>
				<FormGroup>
					<Input checked={this.props.headerRow} type='checkbox' name='headerRow' id='headerRow' onChange={this.props.toggleHeaderRow} />
					<Label for='headerRow'> Header Row </Label>
				</FormGroup>
				<FormGroup>
					<Input checked={this.props.update} type='checkbox' name='update' id='update' onChange={this.props.toggleUpdate} />
					<Label for='update'> Update </Label>
				</FormGroup>
				<FormGroup>
					<Input checked={this.props.createMeter} type='checkbox' name='createMeter' id='createMeter' onChange={this.props.toggleCreateMeter} />
					<Label for='createMeter'> Create Meter </Label>
				</FormGroup>
				<FormGroup>
					<Input checked={this.props.cumulative} type='checkbox' name='cumulative' id='cumulative' onChange={this.props.toggleCumulative} />
					<Label for='cumulative'> Cumulative </Label>
				</FormGroup>
				<FormGroup>
					<Input checked={this.props.cumulativeReset} type='checkbox' name='cumulativeReset' id='cumulativeReset' onChange={this.props.toggleCumulativeReset} />
					<Label for='cumulativeReset'> Cumulative Reset </Label>
				</FormGroup>
				<FormGroup>
					<Label for='duplications'> Duplications </Label>
					<Input value={this.props.duplications} type='select' name='duplications' id='duplications' onChange={({ target }) => this.props.selectDuplications(target.value)} >
						{range(1, 10).map(number => (
							<option value={`${number}`}> {number} </option>
						))}
					</Input>
				</FormGroup>
				<FormGroup>
					<Label for='timeSort'> Time Sort </Label>
					<Input type='select' name='duplications' id='duplications' onChange={({ target }) => this.props.selectTimeSort(target.value as TimeSortTypes)}>
						<option value={TimeSortTypes.increasing}> {TimeSortTypes.increasing} </option>
					</Input>
				</FormGroup>
				<FormGroup>
					<Label for='meterName'> Meter Name </Label>
					<Input required value={this.props.meterName} name='meterName' id='meterName' onChange={({target}) => this.props.setMeterName(target.value)} />
				</FormGroup>
				<FileUploaderComponent required reference={this.fileInput} />
				{console.log(8)}
				<SubmitButton />
			</Form>
		)
	}
}

/** A range of values, inclusive lower bound and exclusive upper bound. */
function range(lower: number, upper: number): number[] {
	const arr = [];
	for (let i = lower; i < upper; i++) {
		arr.push(i);
	}
	return arr;
}

export default ReadingsCSVUploadComponent;
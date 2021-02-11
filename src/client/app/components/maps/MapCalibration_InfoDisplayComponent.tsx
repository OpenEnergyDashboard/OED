/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {GPSPoint, isValidGPSInput} from '../../utils/calibration';
import {ChangeEvent, FormEvent} from 'react';
import {FormattedMessage} from 'react-intl';

interface InfoDisplayProps {
	showGrid: boolean;
	currentCartesianDisplay: string;
	resultDisplay: string;
	changeGridDisplay(): any;
	updateGPSCoordinates(gpsCoordinate: GPSPoint): any;
	submitCalibratingMap(): any;
	dropCurrentCalibration(): any;
	log(level: string, message: string): any;
}

interface InfoDisplayState {
	value: string;
}

export default class MapCalibration_InfoDisplayComponent extends React.Component<InfoDisplayProps, InfoDisplayState> {
	constructor(props: InfoDisplayProps) {
		super(props);
		this.state = {
			value: ''
		};
		this.handleGridDisplay = this.handleGridDisplay.bind(this);
		this.handleGPSInput = this.handleGPSInput.bind(this);
		this.resetInputField = this.resetInputField.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleChanges = this.handleChanges.bind(this);
		this.dropCurrentCalibration = this.dropCurrentCalibration.bind(this);
	}
	public render() {
		const calibrationDisplay = `result: ${this.props.resultDisplay}`;
		return (
			<div>
				<div className='checkbox'>
					<label><input type='checkbox' onChange={this.handleGridDisplay} checked={this.props.showGrid} />
						<FormattedMessage id='show.grid' />
					</label>
				</div>
				<div id='UserInput'>
					<form onSubmit={this.handleSubmit}>
						<label>
							input GPS coordinate that corresponds to the point: {this.props.currentCartesianDisplay}
							<br/>
							in this format -> latitude,longitude
							<br/>
							<textarea id={'text'} cols={50} value={this.state.value} onChange={this.handleGPSInput.bind(this)}/>
						</label>
						<br/>
						<input type={'submit'} value={'Submit'}/>
					</form>
					<button onClick={this.dropCurrentCalibration}>Reset</button>
					<button onClick={this.handleChanges.bind(this)}>Save changes to database</button>
					<p>{calibrationDisplay}</p>
				</div>
			</div>
		);
	}

	private handleGridDisplay() {
		this.props.changeGridDisplay();
	}

	private resetInputField() {
		this.setState({
			value: ''
		});
	}

	private handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		const latitudeIndex = 0;
		const longitudeIndex = 1;
		if (this.props.currentCartesianDisplay === 'x: undefined, y: undefined') { return; }
		const input = this.state.value;
		if (isValidGPSInput(input)) {
			const array = input.split(',').map((value: string) => parseFloat(value));
			const gps: GPSPoint = {
				longitude: array[longitudeIndex],
				latitude: array[latitudeIndex]
			};
			this.props.updateGPSCoordinates(gps);
			this.resetInputField();
		} else {
			this.props.log('info', `refused data point with invalid input: ${input}`);
		}
	}

	private handleGPSInput(event: ChangeEvent<HTMLTextAreaElement>) {
		this.setState({
			value: event.target.value
		});
	}

	private dropCurrentCalibration() {
		this.props.dropCurrentCalibration();
	}

	private handleChanges() {
		this.props.submitCalibratingMap();
	}
}


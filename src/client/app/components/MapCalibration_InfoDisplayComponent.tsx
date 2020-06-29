/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {GPSPoint} from '../utils/calibration';
import {ChangeEvent, FormEvent} from 'react';

interface InfoDisplayProps {
	currentCartesianDisplay: string;
	resultDisplay: string;
	onReset(): any;
	updateGPSCoordinates(gpsCoordinate: GPSPoint): any;
	uploadMap(): any;
}

interface InfoDisplayState {
	value: string;
}

export default class MapCalibration_InfoDisplayComponent extends React.Component<InfoDisplayProps, InfoDisplayState> {
	constructor(props: InfoDisplayProps) {
		super(props);
		this.state = {
			value: "latitude,longitude"
		}
		this.handleGPSInput.bind(this);
		this.resetInputField.bind(this);
		this.handleSubmit.bind(this);
	}
	render() {
		const calibrationDisplay = `result: ${this.props.resultDisplay}`;
		return (
			<div id='UserInput'>
				<form onSubmit={this.handleSubmit}>
					<label>
						input GPS coordinate that corresponds to the point: {this.props.currentCartesianDisplay}
						<br/>
						<textarea id={'text'} cols={50} value={this.state.value} onChange={this.handleGPSInput.bind(this)}/>
					</label>
					<br/>
					<input type={"submit"} value={"Submit"}/>
					<button onClick={this.resetInputField.bind(this)}>Cancel</button>
					<button onClick={this.props.uploadMap}>Save</button>
				</form>
				<p>{calibrationDisplay}</p>
			</div>
		);
	}

	private resetInputField() {
		this.setState({
			value: "latitude,longitude"
		});
		this.props.onReset();
	}

	private handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		const input = this.state.value;
		const array = input.split(',').map((value:string) => parseFloat(value));
		let gps: GPSPoint = {
			longitude: array[1],
			latitude: array[0]
		}
		this.props.updateGPSCoordinates(gps);
		this.resetInputField();
	}

	private handleGPSInput(event: ChangeEvent<HTMLTextAreaElement>) {
		this.setState({
			value: event.target.value
		});
	}
}


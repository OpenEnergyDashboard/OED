/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {CalibratedPoint, GPSPoint} from '../utils/calibration';
import {ChangeEvent, FormEvent} from 'react';

interface InfoDisplayProps {
	onReset: any;
	currentPoint: CalibratedPoint;
	calibrationResults: number[][];
	updateGPSCoordinates(gpsCoordinate: GPSPoint): any;
}

export default class MapCalibration_InfoDisplayComponent extends React.Component<InfoDisplayProps, any> {
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
		const calibrationDisplay = `res: ${this.props.calibrationResults}`;
		const currentData = this.props.currentPoint.hasCartesian()? this.props.currentPoint.getCartesianString():'null';
		return (
			<div id='UserInput'>
				<form onSubmit={this.handleSubmit}>
					<label>
						input GPS coordinate that corresponds to the point: {currentData}
						<br/>
						<textarea cols={50} value={this.state.value} onChange={this.handleGPSInput.bind(this)}/>
					</label>
					<br/>
					<input type={"submit"} value={"Submit"}/>
					<button onClick={this.resetInputField.bind(this)}>Cancel</button>
				</form>
				<p>{calibrationDisplay}</p>
			</div>
		);
	}

	private resetInputField() {
		let textarea = document.querySelector('textarea');
		textarea!.value = '';
		this.props.onReset();
	}

	private handleSubmit(event: FormEvent) {
		event.preventDefault();
		const input = this.state.value;
		const array = input.split(',').map((value:string) => parseFloat(value));
		let gps: GPSPoint = {
			longitude: array[1],
			latitude: array[0]
		}
		this.props.updateGPSCoordinates(gps);
	}

	private handleGPSInput(event: ChangeEvent<HTMLTextAreaElement>) {
		this.setState({
			value: event.target.value
		});
	}
}


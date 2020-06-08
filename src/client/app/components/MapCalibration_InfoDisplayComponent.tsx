/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {MapModeTypes} from '../types/redux/map';
import {MapCalibrationData} from './MapChartComponent';

export default class MapCalibration_InfoDisplayComponent extends React.Component<MapCalibrationData, any> {
	constructor(props: MapCalibrationData) {
		super(props);
	}
	render() {
		return (
			<div id='UserInput'>
				<div id='inputField' className="input"> {/*Todo: find new place to store css properties: display = none*/}
					<p id='inputDescription'/>
					<label>
						<textarea cols={50}/>
					</label>
					<button id='acceptInput'>Ok</button>
					<button id='cancelInput' onClick={this.resetInputField}>Cancel</button>
				</div>
				<button id="calibrateTrigger" onClick={this.calibrate}>calibrate</button>
			</div>
		);
	}

	private resetInputField() {

	}

	private calibrate() {

	}
}


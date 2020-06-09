/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {MapModeTypes} from '../types/redux/map';
import {MapCalibrationData} from './MapChartComponent';

interface InfoDisplayProps {
	onReset: any;
	calibrate: any;
	inputDisplay: boolean;
	calibrationReady: boolean;
}

export default class MapCalibration_InfoDisplayComponent extends React.Component<InfoDisplayProps, {}> {
	constructor(props: InfoDisplayProps) {
		super(props);
	}
	render() {
		return (
			<div id='UserInput'>
				{this.props.inputDisplay &&
					<div id='inputField' className="input"> {/*Todo: find new place to store css properties: display = none*/}
						<p id='inputDescription'/>
						<label>
							<textarea cols={50}/>
						</label>
						<button id='acceptInput'>Ok</button>
						<button id='cancelInput' onClick={this.resetInputField}>Cancel</button>
					</div>
				}
				{this.props.calibrationReady &&
					<button id="calibrateTrigger" onClick={this.props.calibrate}>calibrate</button>
				}
			</div>
		);
	}

	private resetInputField() {
		let textarea = document.querySelector('textarea');
		textarea!.value = '';
		this.props.onReset();
	}
}


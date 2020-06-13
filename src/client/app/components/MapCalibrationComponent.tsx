/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { CalibrationModeTypes } from '../types/redux/map';
import calibrate, {CartesianPoint, GPSPoint, CalibratedPoint, Dimensions} from '../utils/calibration';
import MapCalibration_InitiateContainer from "../containers/MapCalibration_InitiateContainer";
import MapCalibration_ChartDisplayContainer from "../containers/MapCalibration_ChartDisplayContainer";
import MapCalibration_InfoDisplayContainer from "../containers/MapCalibration_InfoDisplayContainer";

interface MapChartProps {
	mode: CalibrationModeTypes;
	isLoading: boolean;
}

export default class MapCalibrationComponent extends React.Component<MapChartProps, {}> {
	constructor(props: MapChartProps) {
		super(props);
	}

	public render() {
		if (this.props.mode === CalibrationModeTypes.initiate) {
			return (
				<MapCalibration_InitiateContainer/>
			);
		} else if (this.props.mode === CalibrationModeTypes.calibrate) {
			return (
				<div id={'MapCalibrationContainer'}>
					<MapCalibration_ChartDisplayContainer/>
					<MapCalibration_InfoDisplayContainer/>
				</div>
			);
		} else { // display-mode containers
			return (
				<p>Coming soon...</p>
			);
		}
	}
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { CalibrationModeTypes } from '../types/redux/map';
import MapCalibration_InitiateContainer from "../containers/maps/MapCalibration_InitiateContainer";
import MapCalibration_ChartDisplayContainer from "../containers/maps/MapCalibration_ChartDisplayContainer";
import MapCalibration_InfoDisplayContainer from "../containers/maps/MapCalibration_InfoDisplayContainer";
import HeaderContainer from "../containers/HeaderContainer";

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
				<div>
					<HeaderContainer />
					<MapCalibration_InitiateContainer/>
				</div>
			);
		} else if (this.props.mode === CalibrationModeTypes.calibrate) {
			return (
				<div>
					<HeaderContainer />
					<div id={'MapCalibrationContainer'}>
						<MapCalibration_ChartDisplayContainer/>
						<MapCalibration_InfoDisplayContainer/>
					</div>
				</div>
			);
		} else { // display-mode containers
			return (
				<div>
					<HeaderContainer />
					<p>Coming soon...</p>
				</div>
			);
		}
	}
}

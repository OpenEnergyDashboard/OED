/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { MapModeTypes } from '../types/redux/map';
import MapInitiateComponent from './MapInitiateComponent';
import MapCalibration_InfoDisplayComponent from './MapCalibration_InfoDisplayComponent';
import MapCalibration_ChartDisplayComponent from './MapCalibration_ChartDisplayComponent';

interface MapChartProps {
	mode: MapModeTypes;
	isLoading: boolean;
	uploadMapImage(imageURI: string): any;
	updateMapMode(nextMode: MapModeTypes): any;
}

export interface MapChartState {
	source: string;
	calibration: MapCalibrationData;
}

export interface MapCalibrationData {
	numDataPoint: number;
	graphCoordinates: number[];
	gpsCoordinates: number[]; // Todo: check gps storing object and refactor data structure to store gps coordinates;
}

export default class MapChartComponent extends React.Component<MapChartProps, MapChartState> {
	constructor(props: MapChartProps) {
		super(props);
		this.state = {
			source: '',
			calibration: {
				numDataPoint: 0,
				graphCoordinates: [],
				gpsCoordinates: [],
			},
		};
		this.handleImageSourceChange.bind(this);
	}

	public render() {
		if (this.props.mode === MapModeTypes.initiate) {
			return (
				<MapInitiateComponent updateMapMode={this.props.updateMapMode} onSourceChange={this.handleImageSourceChange.bind(this)}/>
			);
		} else if (this.props.mode === MapModeTypes.calibrate) {
			return (
				<div id={'MapCalibrationContainer'}>
					<MapCalibration_ChartDisplayComponent data={[]} source={this.state.source}/>
					<MapCalibration_InfoDisplayComponent
						numDataPoint={this.state.calibration.numDataPoint}
						graphCoordinates={this.state.calibration.gpsCoordinates}
						gpsCoordinates={this.state.calibration.gpsCoordinates}
					/>
				</div>
			);
		} else { // display-mode containers
			return (
				<p>Coming soon...</p>
			);
		}
	}

	public handleImageSourceChange(dataURL: string) {
		this.setState({
			source: dataURL
		});
	}
}

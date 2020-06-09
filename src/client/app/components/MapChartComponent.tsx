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
	mapImage: HTMLImageElement;
	calibration: MapCalibrationData;
}

export interface MapCalibrationData {
	numDataPoint: number;
	graphCoordinates: [];
	gpsCoordinates: []; // Todo: check gps storing object and refactor data structure to store gps coordinates;
}

export default class MapChartComponent extends React.Component<MapChartProps, MapChartState> {
	constructor(props: MapChartProps) {
		super(props);
		this.state = {
			mapImage: new Image(),
			calibration: {
				numDataPoint: 0,
				graphCoordinates: [],
				gpsCoordinates: [],
			},
		};
	}

	public render() {
		const graphCoordinates = this.state.calibration.graphCoordinates;
		const gpsCoordinates = this.state.calibration.gpsCoordinates;
		if (this.props.mode === MapModeTypes.initiate) {
			return (
				<MapInitiateComponent
					updateMapMode={this.props.updateMapMode}
					onSourceChange={this.handleImageSourceChange.bind(this)}
				/>
			);
		} else if (this.props.mode === MapModeTypes.calibrate) {
			return (
				<div id={'MapCalibrationContainer'}>
					<MapCalibration_ChartDisplayComponent
						mapImage={this.state.mapImage}
						graphCoordinates={graphCoordinates}
						gpsCoordinates={gpsCoordinates}
					 	updateGraphCoordinate={this.setCurrentGraphCoordinates}
					/>
					<MapCalibration_InfoDisplayComponent
						calibrate={this.calibrate.bind(this)}
						onReset={this.resetCurrent.bind(this)}
						inputDisplay={this.checkCurrent()}
						calibrationReady={this.checkIfReady()}
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
		let image = this.state.mapImage;
		image.src = dataURL;
		this.setState({
			mapImage: image,
		});
	}

	setCurrentGraphCoordinates() {

	}

	resetCurrent() {

	}

	private checkIfReady() {
		const calibrationThreshold = 3;
		return this.state.calibration.numDataPoint >= calibrationThreshold;
	}

	private checkCurrent() {
		return false;
	}

	calibrate() {

	}
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { MapModeTypes } from '../types/redux/map';
import MapInitiateComponent from './MapInitiateComponent';
import MapCalibration_InfoDisplayComponent from './MapCalibration_InfoDisplayComponent';
import MapCalibration_ChartDisplayComponent from './MapCalibration_ChartDisplayComponent';
import calibrate, {CartesianPoint, GPSPoint, CalibratedPoint} from '../utils/calibration';

interface MapChartProps {
	mode: MapModeTypes;
	isLoading: boolean;
	uploadMapImage(imageURI: string): any;
	updateMapMode(nextMode: MapModeTypes): any;
}

interface MapChartState {
	mapImage: HTMLImageElement;
	calibrationSet: CalibratedPoint[];
	currentPoint: CalibratedPoint;
}

export default class MapChartComponent extends React.Component<MapChartProps, MapChartState> {
	constructor(props: MapChartProps) {
		super(props);
		this.state = {
			mapImage: new Image(),
			calibrationSet: [],
			currentPoint: new CalibratedPoint(),
		};
	}

	public render() {
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
						acceptedPoints={this.state.calibrationSet}
					 	updateGraphCoordinates={this.setCurrentGraphCoordinates.bind(this)}
					/>
					<MapCalibration_InfoDisplayComponent
						calibrate={this.prepareDataToCalibration.bind(this)}
						onReset={this.resetCurrent.bind(this)}
						inputDisplay={this.checkCurrent()}
						calibrationReady={this.checkIfReady()}
						updateGPSCoordinates={this.setCurrentGPSCoordinates.bind(this)}
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

	setCurrentGraphCoordinates(currentCartesian: CartesianPoint) {
		let current = this.state.currentPoint;
		current.setCartesian(currentCartesian);
		this.setState({
			currentPoint: current
		});
	}

	setCurrentGPSCoordinates(currentGPS: GPSPoint) {
		let current = this.state.currentPoint;
		current.setGPS(currentGPS);
		this.setState({
			currentPoint: current
		})
	}

	/**
	 *  when user wants to cancel a selected point, clear current point's data,
	 */
	resetCurrent() {
		this.setState({
			currentPoint: new CalibratedPoint()
		})
	}

	private checkIfReady() {
		const calibrationThreshold = 3;
		return this.state.calibrationSet.length >= calibrationThreshold;
	}

	/**
	 * check if it's necessary to get gps data for current point
	 */
	private checkCurrent() {
		return this.state.currentPoint.hasCartesian();
	}

	/**
	 *  prepare data to required formats to pass it to function calculating mapScales
	 */
	prepareDataToCalibration() {
		const imageDimensions = [this.state.mapImage.width, this.state.mapImage.height];
		calibrate(
			this.state.calibrationSet,
			imageDimensions);
	}
}

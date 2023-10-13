/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { CalibrationModeTypes } from '../../types/redux/map';
import MapCalibrationInitiateContainer from '../../containers/maps/MapCalibrationInitiateContainer';
import MapCalibrationChartDisplayContainer from '../../containers/maps/MapCalibrationChartDisplayContainer';
import MapCalibrationInfoDisplayContainer from '../../containers/maps/MapCalibrationInfoDisplayContainer';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import HeaderComponent from '../../components/HeaderComponent';
import MapsDetailContainer from '../../containers/maps/MapsDetailContainer';

interface MapCalibrationProps {
	mode: CalibrationModeTypes;
	isLoading: boolean;
	mapID: number;
}

export default class MapCalibrationComponent extends React.Component<MapCalibrationProps> {
	constructor(props: any) {
		super(props);
	}

	public render() {
		if (this.props.mode === CalibrationModeTypes.initiate) {
			return (
				<div className='container-fluid'>
					<UnsavedWarningContainer />
					<HeaderComponent />
					<MapCalibrationInitiateContainer />
				</div>
			);
		} else if (this.props.mode === CalibrationModeTypes.calibrate) {
			return (
				<div className='container-fluid'>
					<UnsavedWarningContainer />
					<HeaderComponent />
					<div id={'MapCalibrationContainer'}>
						{/* TODO These types of plotly containers expect a lot of passed
						values and it gives a TS error. Given we plan to  replace this
						with the react hooks version and it does not seem to cause any
						issues, this TS error is being suppressed for now.
						eslint-disable-next-line @typescript-eslint/ban-ts-comment
						@ts-ignore */}
						<MapCalibrationChartDisplayContainer />
						<MapCalibrationInfoDisplayContainer />
					</div>
				</div>
			);
		} else { // preview mode containers
			return (
				<div className='container-fluid'>
					<MapsDetailContainer />
				</div>
			);
		}
	}
}

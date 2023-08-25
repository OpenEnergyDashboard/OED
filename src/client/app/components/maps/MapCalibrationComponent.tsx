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
					<HeaderComponent/>
					<MapCalibrationInitiateContainer />
				</div>
			);
		} else if (this.props.mode === CalibrationModeTypes.calibrate) {
			return (
				<div className='container-fluid'>
					<UnsavedWarningContainer />
					<HeaderComponent />
					<div id={'MapCalibrationContainer'}>
						<MapCalibrationChartDisplayContainer/>
						<MapCalibrationInfoDisplayContainer/>
					</div>
				</div>
			);
		} else { // preview mode containers
			return (
				<div className='container-fluid'>
					<UnsavedWarningContainer />
					<HeaderComponent/>
					<p/>
				</div>
			);
		}
	}
}

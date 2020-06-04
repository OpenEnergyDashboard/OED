/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { MapModeTypes } from '../types/redux/map';
import MapInitiateContainer from '../containers/MapInitiateContainer';
import MapCalibrationContainer from '../containers/MapCalibrationContainer';

interface MapChartProps {
	mode: MapModeTypes;
	isLoading: boolean;
}

export default class MapChartComponent extends React.Component<MapChartProps, {}> {
	constructor(props: MapChartProps) {
		super(props);
	}

	public render() {
		if (this.props.mode === MapModeTypes.initiate) {
			return (
				<MapInitiateContainer/>
			);
		} else if (this.props.mode === MapModeTypes.calibrate) {
			return (
				<MapCalibrationContainer/>
			);
		} else { // display-mode containers
			return (
				<p>Coming soon...</p>
			);
		}
	}
}

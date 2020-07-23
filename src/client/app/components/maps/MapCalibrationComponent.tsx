/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { CalibrationModeTypes } from '../../types/redux/map';
import MapCalibration_InitiateContainer from "../../containers/maps/MapCalibration_InitiateContainer";
import MapCalibration_ChartDisplayContainer from "../../containers/maps/MapCalibration_ChartDisplayContainer";
import MapCalibration_InfoDisplayContainer from "../../containers/maps/MapCalibration_InfoDisplayContainer";
import HeaderContainer from "../../containers/HeaderContainer";

interface MapCalibrationProps {
	mode: CalibrationModeTypes;
	isLoading: boolean;
	mapID: number;
}

export default class MapCalibrationComponent extends React.Component<MapCalibrationProps, {}> {
	constructor(props: any) {
		super(props);
	}

	public render() {
		if (this.props.mode === CalibrationModeTypes.initiate) {
			return (
				<div className='container-fluid'>
					<HeaderContainer />
					<MapCalibration_InitiateContainer/>
				</div>
			);
		} else if (this.props.mode === CalibrationModeTypes.calibrate) {
			return (
				<div className='container-fluid'>
					<HeaderContainer />
					<div id={'MapCalibrationContainer'}>
						<MapCalibration_ChartDisplayContainer/>
						<MapCalibration_InfoDisplayContainer/>
					</div>
				</div>
			);
		} else { // preview mode containers
			// return (
			// 	<div className='container-fluid'>
			// 		<HeaderContainer />
			// 		<p>Coming soon...</p>
			// 	</div>
			// );
			return (
				<div className='container-fluid'>
					<HeaderContainer />
					<div />
				</div>
			)
		}
	}
}

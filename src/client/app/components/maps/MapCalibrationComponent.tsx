/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { CalibrationModeTypes } from '../../types/redux/map';
import MapCalibration_InitiateContainer from "../../containers/maps/MapCalibration_InitiateContainer";
import MapCalibration_ChartDisplayContainer from "../../containers/maps/MapCalibration_ChartDisplayContainer";
import MapCalibration_InfoDisplayContainer from "../../containers/maps/MapCalibration_InfoDisplayContainer";
import HeaderContainer from "../../containers/HeaderContainer";

interface MapCalibrationState {
	id: number;
	mode: string;
}

export default class MapCalibrationComponent extends React.Component<MapCalibrationProps, MapCalibrationState> {
	constructor(props: any) {
		super(props);
		const IDAndMode = window.location.pathname.split('_');
		this.state = {
			id: Number(IDAndMode[0]),
			mode: IDAndMode[1],
		};
	}

	public render() {
		if (this.state.mode === CalibrationModeTypes.initiate) {
			return (
				<div className='container-fluid'>
					<HeaderContainer />
					<MapCalibration_InitiateContainer mapID={this.state.id}/>
				</div>
			);
		} else if (this.state.mode === CalibrationModeTypes.calibrate) {
			return (
				<div className='container-fluid'>
					<HeaderContainer />
					<div id={'MapCalibrationContainer'}>
						<MapCalibration_ChartDisplayContainer mapID={this.state.id}/>
						<MapCalibration_InfoDisplayContainer mapID={this.props.mapID}/>
					</div>
				</div>
			);
		} else { // preview mode containers
			return (
				<div className='container-fluid'>
					<HeaderContainer />
					<p>Coming soon...</p>
				</div>
			);
		}
	}
}

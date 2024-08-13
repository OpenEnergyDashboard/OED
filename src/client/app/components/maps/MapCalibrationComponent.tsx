/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../redux/reduxHooks';
import { localEditsSlice } from '../../redux/slices/localEditsSlice';
import { CalibrationModeTypes } from '../../types/redux/map';
import MapCalibrationChartDisplayComponent from './MapCalibrationChartDisplayComponent';
import MapCalibrationInfoDisplayComponent from './MapCalibrationInfoDisplayComponent';
import MapCalibrationInitiateComponent from './MapCalibrationInitiateComponent';

/**
 * @returns Calibration Component corresponding to current step invloved
 */
export const MapCalibrationComponent = () => {
	const mapToCalibrate = useAppSelector(localEditsSlice.selectors.selectCalibrationMapId);
	const calibrationMode = useAppSelector(state => {
		const data = localEditsSlice.selectors.selectLocalEdit(state, mapToCalibrate);
		return data?.calibrationMode ?? CalibrationModeTypes.unavailable;
	});
	console.log(calibrationMode);
	if (calibrationMode === CalibrationModeTypes.initiate) {
		return (
			<div className='container-fluid'>
				{/* <MapCalibrationInitiateContainer /> */}
				<MapCalibrationInitiateComponent />
			</div >
		);
	} else if (calibrationMode === CalibrationModeTypes.calibrate) {
		return (
			<div className='container-fluid'>
				<div id={'MapCalibrationContainer'}>
					<MapCalibrationChartDisplayComponent />
					<MapCalibrationInfoDisplayComponent />
				</div>
			</div>
		);
	} else {
		return <Navigate to='/maps' replace />;
	}
};

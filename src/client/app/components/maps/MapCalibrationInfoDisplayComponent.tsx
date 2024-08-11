/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { logsApi } from '../../redux/api/logApi';
import { mapsAdapter, mapsApi } from '../../redux/api/mapsApi';
import { useTranslate } from '../../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { localEditsSlice } from '../../redux/slices/localEditsSlice';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';

/**
 * @returns TODO DO ME
 */
export default function MapCalibrationInfoDisplayComponent() {
	const dispatch = useAppDispatch();
	const [createNewMap] = mapsApi.useCreateMapMutation();
	const [editMap] = mapsApi.useEditMapMutation();
	const translate = useTranslate();
	const [logToServer] = logsApi.useLogToServerMutation();
	const [value, setValue] = React.useState<string>('');
	const showGrid = useAppSelector(state => state.localEdits.calibrationSettings.showGrid);
	const mapData = useAppSelector(state => mapsAdapter.getSelectors().selectById(state.localEdits.mapEdits, state.localEdits.calibratingMap));
	const resultDisplay = (mapData.calibrationResult)
		? `x: ${mapData.calibrationResult.maxError.x}%, y: ${mapData.calibrationResult.maxError.y}%`
		: translate('need.more.points');
	const cartesianDisplay = (mapData.currentPoint)
		? `x: ${mapData.currentPoint.cartesian.x}, y: ${mapData.currentPoint.cartesian.y}`
		: translate('undefined');

	const handleGridDisplay = () => { dispatch(localEditsSlice.actions.toggleMapShowGrid()); };

	const resetInputField = () => setValue('');

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		const latitudeIndex = 0;
		const longitudeIndex = 1;
		if (cartesianDisplay === 'x: undefined, y: undefined') {
			return;
		}
		const input = value;
		if (isValidGPSInput(input)) {
			const array = input.split(',').map((value: string) => parseFloat(value));
			const gps: GPSPoint = {
				longitude: array[longitudeIndex],
				latitude: array[latitudeIndex]
			};
			console.log('Verify: this.props.updateGPSCoordinates(gps); ', gps);

			dispatch(localEditsSlice.actions.offerCurrentGPS(gps));
			resetInputField();
		} else {
			logToServer({ level: 'info', message: `refused data point with invalid input: ${input}` });
		}
	};

	const handleGPSInput = (event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value);

	const dropCurrentCalibration = () => {
		console.log('Verfiy  this.props.dropCurrentCalibration();');
		dispatch(localEditsSlice.actions.resetCalibration(mapData.id));
	};

	const handleChanges = () => {
		console.log('Verfiy: // this.props.submitCalibratingMap();');
		if (mapData.id < 0) {
			createNewMap(mapData);
		} else {
			editMap(mapData);
		}
	};
	const calibrationDisplay = `${resultDisplay}`;
	return (
		<div>
			<div className='checkbox'>
				<label><input type='checkbox' onChange={handleGridDisplay} checked={showGrid} />
					<FormattedMessage id='show.grid' />
				</label>
			</div>
			<div id='UserInput'>
				<form onSubmit={handleSubmit}>
					<label>
						<FormattedMessage id='input.gps.coords.first' /> {cartesianDisplay}
						<br />
						<FormattedMessage id='input.gps.coords.second' />
						<br />
						<textarea id={'text'} cols={50} value={value} onChange={handleGPSInput} />
					</label>
					<br />
					<FormattedMessage id='calibration.submit.button'>
						{intlSubmitText => <input type={'submit'} value={intlSubmitText.toString()} />}
					</FormattedMessage>
				</form>
				<FormattedMessage id='calibration.reset.button'>
					{intlResetButton => <button onClick={dropCurrentCalibration}>{intlResetButton.toString()}</button>}
				</FormattedMessage>
				<FormattedMessage id='calibration.save.database'>
					{intlSaveChanges => <button onClick={handleChanges}>{intlSaveChanges.toString()}</button>}
				</FormattedMessage>
				<FormattedMessage id='calibration.display'>
					{intlResult => <p>{intlResult.toString()}{calibrationDisplay}</p>}
				</FormattedMessage>
			</div>
		</div>
	);

}


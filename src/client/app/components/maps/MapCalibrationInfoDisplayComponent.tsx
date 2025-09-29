/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { mapsApi } from '../../redux/api/mapsApi';
import { useTranslate } from '../../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { localEditsSlice, MIN_POINT_MAP_CALIBRATION } from '../../redux/slices/localEditsSlice';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { Button } from 'reactstrap';
import { showErrorNotification } from '../../utils/notifications';

/**
 * @returns TODO DO ME
 */
export default function MapCalibrationInfoDisplayComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const [createNewMap] = mapsApi.useCreateMapMutation();
	const [editMap] = mapsApi.useEditMapMutation();
	const [value, setValue] = React.useState<string>('');
	const showGrid = useAppSelector(state => state.localEdits.calibrationSettings.showGrid);
	const mapData = useAppSelector(state => localEditsSlice.selectors.selectLocalEdit(state, state.localEdits.calibratingMap));

	// Disable save if calibration incomplete.
	let noSave = false;
	let numPointsNeeded = 0;
	if (!mapData.calibrationResult) {
		noSave = true;
		numPointsNeeded = MIN_POINT_MAP_CALIBRATION - mapData.calibrationSet.length;
	}
	const resultDisplay = (noSave)
		// TS thinks mapData.calibrationResult can be undefined so added ?. noSave should protect against this.
		? ' ' + numPointsNeeded + translate('need.more.points')
		: ` x: ${mapData.calibrationResult?.maxError.x}%, y: ${mapData.calibrationResult?.maxError.y}%`;
	const cartesianDisplay = (mapData.currentPoint)
		? `x: ${mapData.currentPoint.cartesian.x}, y: ${mapData.currentPoint.cartesian.y}`
		: translate('map.need.click.point');

	const handleGridDisplay = () => { dispatch(localEditsSlice.actions.toggleMapShowGrid()); };

	const resetInputField = () => {
		// Remove GPS value.
		setValue('');
		// Remove point clicked.
		dispatch(localEditsSlice.actions.resetCurrentPoint(mapData.id));
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		const latitudeIndex = 0;
		const longitudeIndex = 1;
		if (!mapData.currentPoint) {
			showErrorNotification(translate('map.no.gps'));
			return;
		}
		const input = value;
		const { validGps, message } = isValidGPSInput(input);
		if (validGps) {
			const array = input.split(',').map((value: string) => parseFloat(value));
			const gps: GPSPoint = {
				longitude: array[longitudeIndex],
				latitude: array[latitudeIndex]
			};

			dispatch(localEditsSlice.actions.offerCurrentGPS(gps));
			resetInputField();
		} else {
			const msg = translate('map.no.save') + message;
			showErrorNotification(msg);
		}
	};

	const handleGPSInput = (event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value);

	const dropCurrentCalibration = () => {
		dispatch(localEditsSlice.actions.resetCalibration(mapData.id));
	};

	const handleChanges = () => {
		if (mapData.id < 0) {
			createNewMap(mapData);
		} else {
			editMap(mapData);
		}
	};

	return (
		<div>
			<div className='checkbox'>
				<label><input type='checkbox' onChange={handleGridDisplay} checked={showGrid} />
					<FormattedMessage id='show.grid' />
				</label>
			</div>
			<div id='UserInput'>
				{/* When this is fully converted to the more standard OED input methods, the button, text, etc. will look OED normal. */}
				<form onSubmit={handleSubmit}>
					{/* Status of the calibration. Either # points needed or accuracy result. */}
					{/* top padding */}
					<div style={{ padding: '15px 0 0 0' }}>
						<FormattedMessage id='calibration.display'>
							{intlResult => <p>{intlResult.toString()}{resultDisplay}</p>}
						</FormattedMessage>
					</div>
					<label>
						<div>
							<FormattedMessage id='input.gps.coords.first' />
						</div>
						{/* The point clicked or empty if none. */}
						<div>
							{cartesianDisplay}
						</div>
						{/* bottom padding */}
						<div style={{ padding: '0 0 5px 0' }} >
							{translate('input.gps.coords.second') + '"' + translate('calibration.submit.button') + '".'}
						</div>
						<textarea id={'text'} cols={50} value={value} onChange={handleGPSInput} />
					</label>
					{/* top & bottom padding */}
					<div style={{ padding: '5px 0 15px 0' }}>
						<FormattedMessage id='calibration.submit.button'>
							{intlSubmitText => <input type={'submit'} value={intlSubmitText.toString()} />}
						</FormattedMessage>
					</div>
				</form>
				{/*  right & bottom padding */}
				<div style={{ padding: '0  45px 15px 0' }}>
					{/* <FormattedMessage id='calibration.reset.button'>
						{intlResetButton => <button onClick={dropCurrentCalibration}>{intlResetButton.toString()}</button>}
					</FormattedMessage> */}

					<Button color="primary" style={{ margin: '0 45px 0 0' }} onClick={dropCurrentCalibration}>
						<FormattedMessage id="calibration.reset.button" />
					</Button>
					{/* This is a hack to put space between the buttons. */}
					{/* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; */}
					{/* This is the original code. I'm unclear on the advantages to how it is done elsewhere in OED.
						Also, I could not get the disable to work so switched to a reactstrap Button. 
						To be consistent, I did for all of them. */}
					{/* <FormattedMessage id='calibration.save.database'>
						{intlSaveChanges => <button onClick={handleChanges}>{intlSaveChanges.toString()}</button>}
					</FormattedMessage> */}
					<Button color="primary" onClick={handleChanges} disabled={noSave}>
						<FormattedMessage id="calibration.save.database" />
					</Button>
				</div>
			</div>
		</div >
	);
}

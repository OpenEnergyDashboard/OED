/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { ChangeEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { updateMapMode, updateMapSource } from '../../redux/actions/map';
import { logsApi } from '../../redux/api/logApi';
import { selectMapById } from '../../redux/api/mapsApi';
import { useTranslate } from '../../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectSelectedMap } from '../../redux/slices/graphSlice';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { showErrorNotification } from '../../utils/notifications';

/**
 * Accepts image file from user upload,
 * parse the file into DataURL,
 * store dataURL in state to use for calibration at next stage,
 * Other configurations could also be selected during this phase;
 */

// interface MapInitiateProps {
// 	map: MapMetadata
// 	updateMapMode(nextMode: CalibrationModeTypes): any;
// 	onSourceChange(data: MapMetadata): any;
// }

// interface MapInitiateState {
// 	filename: string;
// 	mapName: string;
// 	angle: string;
// }

// type MapInitiatePropsWithIntl = MapInitiateProps & WrappedComponentProps;

/**
 * @returns TODO
 */
export default function MapCalibrationInitiateComponent() {
	const translate = useTranslate();
	const [logToServer] = logsApi.useLogToServerMutation();
	const dispatch = useAppDispatch();
	const [mapName, setMapName] = React.useState<string>('');
	const [angle, setAngle] = React.useState<string>('');
	const fileRef = React.useRef<HTMLInputElement>(null);
	const mapData = useAppSelector(state => selectMapById(state, selectSelectedMap(state)));

	const notify = (key: 'map.bad.number' | 'map.bad.digita' | 'map.bad.digitb' | 'map.bad.load' | 'map.bad.name') => {
		showErrorNotification(translate(key));
	};
	const confirmUpload = async (event: React.FormEvent<HTMLFormElement>) => {
		const bcheck = handleAngle(event);
		if (bcheck) {
			if (!fileRef.current?.files || fileRef.current.files.length === 0) {
				notify('map.bad.load');
			}
			else if (mapName.trim() === '') {
				notify('map.bad.name');
			}
			else {
				await processImgUpload(event);
			}
		}
	};

	const handleAngle = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const pattern = /^[-+]?\d+(\.\d+)?$/;
		if (!pattern.test(angle)) {
			notify('map.bad.number');

			return false;
		}
		else {
			if (parseFloat(angle) > 360) {
				notify('map.bad.digita');
				return false;
			}
			else if (parseFloat(angle) < 0) {
				notify('map.bad.digitb');
				return false;
			}
			else {
				return true;
			}
		}
	};

	const processImgUpload = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			const mapMetaData = await processImgMapMetaData();
			dispatch(updateMapSource(mapMetaData));
			dispatch(updateMapMode(CalibrationModeTypes.calibrate));
		} catch (err) {
			logToServer({ level: 'error', message: `Error, map source image uploading: ${err}` });
		}
	};

	const handleNameInput = (event: ChangeEvent<HTMLTextAreaElement>) => { setMapName(event.target.value); };

	const handleAngleInput = (event: React.FormEvent<HTMLInputElement>) => { setAngle(event.currentTarget.value); };

	// Takes image from upload, derives dimensions, and generates MapMetaData Object for redux state.
	// No longer using Image element in Redux state for serializability purposes. Store img.src only.
	const processImgMapMetaData = (): Promise<MapMetadata> => {
		return new Promise((resolve, reject) => {
			const file = fileRef.current?.files?.[0];
			if (!file) {
				reject('No File Found');

			} else {

				const fileReader = new FileReader();
				// Fire when loading complete
				fileReader.onloadend = () => {
					// When file upload completed, use the result to create an image
					// use image, to extract image dimensions;
					if (typeof fileReader.result === 'string') {
						img.src = fileReader.result;
					}
				};
				fileReader.onerror = reject;
				// begin file read
				fileReader.readAsDataURL(file);
				const img = new Image();
				// Fire when image load complete.
				img.onload = () => {
					// resolve mapMetadata from image.
					// Not storing image in state, instead extract relevang values
					resolve({
						...mapData,
						imgWidth: img.width,
						imgHeight: img.height,
						filename: file.name,
						name: mapName,
						northAngle: parseFloat(angle),
						// Save the image source only
						// Does not store the Image Obpect in redux for serializability reasons.
						// use mapSource to recreate images when needed.
						mapSource: img.src
					});

				};
				// file when image error
				img.onerror = error => {
					reject(error);
				};

			}

		});
	};

	return (
		<form onSubmit={confirmUpload}>
			<label>
				<FormattedMessage id='map.new.upload' />
				<br />
				<input type='file' ref={fileRef} />
			</label>
			<br />
			<label>
				<FormattedMessage id='map.new.name' />
				<br />
				<textarea id={'text'} cols={50} value={mapName} onChange={handleNameInput} />
			</label>
			<br />
			<label>
				<FormattedMessage id='map.new.angle' />
				<br />
				<input type='text' value={angle} onChange={handleAngleInput} />
			</label>
			<br />
			<FormattedMessage id='map.new.submit'>
				{placeholder => <input type='submit' value={(placeholder !== null && placeholder !== undefined) ? placeholder.toString() : 'undefined'} />}
			</FormattedMessage>
		</form>
	);
}
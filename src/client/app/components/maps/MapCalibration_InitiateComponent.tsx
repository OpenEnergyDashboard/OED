/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {CalibrationModeTypes, MapMetadata} from '../../types/redux/map';
import * as moment from 'moment';

/**
 * Accepts image file from user upload,
 * parse the file into DataURL,
 * store dataURL in state to use for calibration at next stage,
 * Other configurations could also be selected during this phase;
 */

interface MapInitiateProps {
	mapID: number;
	map: MapMetadata;
	updateMapMode(nextMode: CalibrationModeTypes): any;
	onSourceChange(data: MapMetadata): any;
}

export default class MapCalibration_InitiateComponent extends React.Component<MapInitiateProps, {} > {
	private readonly fileInput: any;
	private notifyLoadComplete() {
		window.alert(`Map load complete from item ${this.fileInput.current.files[0].name}.`);
	}

	constructor(props: MapInitiateProps) {
		super(props);
		this.fileInput = React.createRef();
		this.handleInput = this.handleInput.bind(this);
		this.confirmUpload = this.confirmUpload.bind(this);
		this.notifyLoadComplete = this.notifyLoadComplete.bind(this);
	}

	public render() {
		return (
			<form onSubmit={this.confirmUpload}>
				<label>
					Upload map image to begin.
					<br />
					<input type="file" ref={this.fileInput} />
				</label>
				<br />
				<input type="submit" value="Submit" />
			</form>
		);
	}

	private async confirmUpload(event: any) {
		await this.handleInput(event);
		this.notifyLoadComplete();
		this.props.updateMapMode(CalibrationModeTypes.calibrate);
	}

	private async handleInput(event: any) {
		event.preventDefault();
		try {
			const imageURL = await this.getDataURL();
			let image = new Image();
			image.src = imageURL;
			const source: MapMetadata = {
				...this.props.map,
				name: 'map',
				filename: this.fileInput.current.files[0].name,
				modifiedDate: moment().toISOString(),
				image: image,
			}
			await this.props.onSourceChange(source);
		} catch (err) {
			console.log(err);
		}
	}

	private getDataURL(): Promise<string> {
		return new Promise((resolve, reject) => {
			const file = this.fileInput.current.files[0];
			let fileReader = new FileReader();
			fileReader.onloadend = () => {
				// @ts-ignore
				resolve(fileReader.result);
			}
			fileReader.onerror = reject;
			fileReader.readAsDataURL(file);
		})
	}
}

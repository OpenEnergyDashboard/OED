/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {CalibrationModeTypes, MapMetadata} from '../../types/redux/map';
import {ChangeEvent} from 'react';
import {logToServer} from '../../actions/logs';
import { FormattedMessage } from 'react-intl';

/**
 * Accepts image file from user upload,
 * parse the file into DataURL,
 * store dataURL in state to use for calibration at next stage,
 * Other configurations could also be selected during this phase;
 */

interface MapInitiateProps {
	map: MapMetadata
	updateMapMode(nextMode: CalibrationModeTypes): any;
	onSourceChange(data: MapMetadata): any;
}

interface MapInitiateState {
	filename: string;
	mapName: string;
}

export default class MapCalibrationInitiateComponent extends React.Component<MapInitiateProps, MapInitiateState > {
	private readonly fileInput: any;
	private notifyLoadComplete() {
		window.alert(`Map load complete from ${this.state.filename}.`);
	}

	constructor(props: MapInitiateProps) {
		super(props);
		this.state = {
			filename: '',
			mapName: ''
		};
		this.fileInput = React.createRef();
		this.handleInput = this.handleInput.bind(this);
		this.confirmUpload = this.confirmUpload.bind(this);
		this.notifyLoadComplete = this.notifyLoadComplete.bind(this);
		this.handleNameInput = this.handleNameInput.bind(this);
	}

	public render() {
		return (
			<form onSubmit={this.confirmUpload}>
				<label>
					<FormattedMessage id='map.new.upload' />
					<br/>
					<input type='file' ref={this.fileInput} />
				</label>
				<br />
				<label>
					<FormattedMessage id='map.new.name' />
					<br/>
					<textarea id={'text'} cols={50} value={this.state.mapName} onChange={this.handleNameInput}/>
				</label>
				<br/>
				<FormattedMessage id='map.new.submit'>
					{placeholder => <input type='submit' value={placeholder.toString()} />}
				</FormattedMessage>
			</form>
		);
	}

	private async confirmUpload(event: any) {
		await this.handleInput(event);
		await this.notifyLoadComplete();
		this.props.updateMapMode(CalibrationModeTypes.calibrate);
	}

	private async handleInput(event: any) {
		event.preventDefault();
		try {
			const imageURL = await this.getDataURL();
			this.setState({filename: this.fileInput.current.files[0].name});
			const image = new Image();
			image.src = imageURL;
			const source: MapMetadata = {
				...this.props.map,
				name: this.state.mapName,
				filename: this.fileInput.current.files[0].name,
				image
			};
			await this.props.onSourceChange(source);
		} catch (err) {
			logToServer('error', `Error, map source image uploading: ${err}`);
		}
	}

	private handleNameInput(event: ChangeEvent<HTMLTextAreaElement>) {
		this.setState({
			mapName: event.target.value
		});
	}

	private getDataURL(): Promise<string> {
		return new Promise((resolve, reject) => {
			const file = this.fileInput.current.files[0];
			const fileReader = new FileReader();
			fileReader.onloadend = () => {
				// @ts-ignore
				resolve(fileReader.result);
			};
			fileReader.onerror = reject;
			fileReader.readAsDataURL(file);
		});
	}
}

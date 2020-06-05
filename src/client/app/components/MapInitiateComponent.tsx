/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import {MapModeTypes} from '../types/redux/map';

/**
 * Accepts image file from user upload,
 * parse the file into DataURL,
 * store dataURL in state to use for calibration at next stage,
 * Other configurations could also be selected during this phase;
 */

interface MapInitiateProps {
	isLoading: boolean;
	uploadMapImage(imageURI: string): Promise<any>;
	updateMapMode(nextMode: MapModeTypes): any;
}

interface MapInitiateState {
	source: string;
}

export default class MapInitiateComponent extends React.Component<MapInitiateProps, MapInitiateState> {
	private readonly fileInput: any;
	private notifyLoadComplete() {
		window.alert(`Map load complete from item ${this.fileInput.current.files[0].name}.`);
		console.log(`currState: ${this.state.source}`);
	}

	constructor(props: MapInitiateProps) {
		super(props);
		this.state = {
			source: ''
		};
		this.fileInput = React.createRef();
		this.handleInput = this.handleInput.bind(this);
		this.confirmUpload = this.confirmUpload.bind(this);
		this.notifyLoadComplete = this.notifyLoadComplete.bind(this);
	}

	public render() {
		return (
			<form onSubmit={this.confirmUpload}>
				<label>
					Upload map image URI to begin.
					<input type="file" ref={this.fileInput} />
				</label>
				<br />
				<input type="submit" value="Submit" />
			</form>
		);
	}

	private async confirmUpload(event: any) {
		await this.handleInput(event);
		await this.props.uploadMapImage(this.state.source);
		this.notifyLoadComplete();
		this.props.updateMapMode(MapModeTypes.calibrate);
	}

	private async handleInput(event: any) {
		event.preventDefault();
		try {
			const imageURL = await this.getDataURL();
			await this.setState({
				source: imageURL
			});
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

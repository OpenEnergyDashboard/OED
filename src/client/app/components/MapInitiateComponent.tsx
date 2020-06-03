/**
 * accepts image URI data stored in a .txt file as user input,
 * used to initiate map view for next stage of calibration.
 */

import * as React from 'react';
import {MapModeTypes} from '../types/redux/map';

interface MapInitiateProps {
	isLoading: boolean;
	uploadMapImage(imageURI: string): Promise<any>;
	updateMapMode(nextMode: MapModeTypes): any;
}

interface MapInitiateState {
	source: string;
	confirmed: boolean;
}

export default class MapInitiateComponent extends React.Component<MapInitiateProps, MapInitiateState> {
	private readonly fileInput: any;
	private notifyLoadComplete() {
		// change isLoading to false;
		window.alert(`Map load complete from item ${this.fileInput.current.files[0].name}.`);
	}

	constructor(props: MapInitiateProps) {
		super(props);
		this.state = {
			source: '',
			confirmed: false
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
		const imageURI = this.getURI();
		if (typeof imageURI === 'string') {
			this.setState({
				source: imageURI
			});
		}
	}

	private getURI() {
		const file = this.fileInput.current.files[0];
		let fileReader = new FileReader();
		fileReader.readAsText(file);
		return fileReader.result;
	}
}

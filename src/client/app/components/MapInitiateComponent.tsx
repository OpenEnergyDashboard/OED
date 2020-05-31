/**
 * accepts image URI data stored in a .txt file as user input,
 * used to initiate map view for next stage of calibration.
 */

import * as React from 'react';
import Button from 'reactstrap/lib/Button';
import {MapModeTypes} from '../types/redux/map';

interface MapInitiateProps {
	isLoading: boolean,
	uploadMapImage(imageURI: string): Promise<any>,
	updateMapMode(nextMode: MapModeTypes): any,
}

interface MapInitiateState {
	source: string,
	confirmed: boolean,
}

export default class MapInitiateComponent extends React.Component<MapInitiateProps, MapInitiateState>{
	constructor(props: MapInitiateProps) {
		super(props);
		this.state = {
			source: '',
			confirmed: false,
		};
		this.getURI = this.getURI.bind(this);
		this.confirmUpload = this.confirmUpload.bind(this);
	}

	public render() {
		return (
			<div id='initiateContainer'>
				<p>Upload map image URI to begin.</p>
				<label>
					<textarea cols={50}/>
				</label>
				<Button onClick={() => this.confirmUpload}>Confirm</Button>
			</div>
		);
	}

	private static notifyLoadComplete() {
		//change isLoading to false;
		window.alert('Map load complete.');
	}

	private confirmUpload() {
		this.getURI();
		this.props.uploadMapImage(this.state.source);
		MapInitiateComponent.notifyLoadComplete();

	}

	private getURI() {
		let input = document.querySelector('textarea');
		if (input) {
			let imageURI = input.value;
			this.setState({
				source: imageURI,
			});
		}
	}
}

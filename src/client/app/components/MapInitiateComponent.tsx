import * as React from 'react';
import Button from 'reactstrap/lib/Button';

interface MapInitiateProps {
	isLoading: boolean,
	uploadMapImage(imageURI: string): any,
}

export default class MapInitiateComponent extends React.Component<MapInitiateProps, {}>{
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
			<div>
				<p>Upload map image to begin.</p>
				<input type="file" name="inputFile"
					   id="inputFile" onChange={() => this.getURI}
				/>
				<Button onClick={() => this.confirmUpload}>Confirm</Button>
			</div>
		);
	}

	private static notifyLoadComplete() {
		//change isLoading to false;
		window.alert('Map load complete.');
	}

	private confirmUpload() {

	}

	private getURI() {
		if (this.props.isLoading) return;
		//TODO: write up action to change isLoading in mapState to true;
		let fileReader = new FileReader();
		let file;
		fileReader.onload = function () {
			file = fileReader.result;
		};
		let inputFile:any = document.getElementById('inputFile');
		fileReader.readAsText(inputFile.files[0]);
		if (file) {
			this.setState({
				source: file,
			});
		}
		MapInitiateComponent.notifyLoadComplete();
	}
}

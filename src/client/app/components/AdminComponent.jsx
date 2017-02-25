import React from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';


export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleOnDrop = this.handleOnDrop.bind(this);
	}

	handleOnDrop(file) {
		axios.post('/api/fileProcessing/', { file })
			.then(response => {
				console.log(response);
			})
			.catch(console.log);
	}

	render() {
		return (
			<div>
				<p>Admin panel</p>
				<button>AddMeter</button>
				<Dropzone onDrop={this.handleOnDrop}>
					<div> Add in a CSV file here: </div>
				</Dropzone>
			</div>
		);
	}


}

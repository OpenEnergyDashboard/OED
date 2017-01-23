import React from 'react';
import UIOptionsComponent from './UIOptionsComponent.jsx'

export default class DashboardComponent extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const titleStyle = {
			textAlign: 'center'
		};
		return (
			<div className="container-fluid">
				<h1 style={titleStyle}>Energy Usage</h1>
				<UIOptionsComponent/>
			</div>
		);
	}
}

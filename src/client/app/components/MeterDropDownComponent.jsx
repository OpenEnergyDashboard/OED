/**
 * Created by Eduardo on 4/12/2017.
 */
import React from 'react';

export default class MeterDropDownComponent extends React.Component {
	constructor(props) {
		super(props);
		console.log(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
	}

	handleMeterSelect(event) {
		this.setState({ selectedMeter: event.target.value });
	}

	render() {
		return (
			<select onChange={this.handleMeterSelect}>
				{this.props.meters.map(meter =>
					<option key={meter.id} value={meter.id}>{meter.name}</option>
				)}
			</select>
		);
	}
}

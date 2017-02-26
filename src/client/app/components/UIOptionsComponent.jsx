import React from 'react';
import { fetchMetersDataIfNeeded } from '../actions/meters';
import { changeSelectedMeters } from '../actions/graph';

export default class UIOptionsComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
	}

	componentWillMount() {
		this.props.fetchMetersDataIfNeeded();
	}

	handleMeterSelect(e) {
		e.preventDefault();
		const options = e.target.options;
		const selectedMeters = [];
		// We can't map here because this is a collection of DOM elements, not an array.
		for (let i = 0; i < options.length; i++) {
			if (options[i].selected) {
				selectedMeters.push(parseInt(options[i].value));
			}
		}
		this.props.selectMeters(selectedMeters);
	}

	render() {
		const labelStyle = {
			textDecoration: 'underline'
		};
		const divPadding = {
			paddingTop: '35px'
		};
		return (
			<div className="col-xs-2" style={divPadding}>
				<div className="col-xs-11">
					<div>
						<div className="form-group">
							<p style={labelStyle}>Select meters:</p>
							<select multiple className="form-control" id="meterList" size="8" onChange={this.handleMeterSelect}>
								{this.props.meters.map(meter =>
									<option key={meter.id} value={meter.id}>{meter.name}</option>
								)}
							</select>
						</div>
					</div>
					<p style={labelStyle}>Energy Type:</p>
					<div className="radio">
						<label><input type="radio" name="energyTypes" value="Electricity" defaultChecked />Electricity</label>
					</div>
					<div className="radio">
						<label><input type="radio" name="energyTypes" value="Wind" />Wind</label>
					</div>
					<div className="radio">
						<label><input type="radio" name="energyTypes" value="NaturalGas" />Natural Gas</label>
					</div>
					<div className="radio">
						<label><input type="radio" name="energyTypes" value="Solar" />Solar</label>
					</div>
					<br />
					<p style={labelStyle}>Graph Type:</p>
					<div className="radio">
						<label><input type="radio" name="graphTypes" value="Line" defaultChecked />Line</label>
					</div>
					<div className="radio">
						<label><input type="radio" name="graphTypes" value="Bar" />Bar</label>
					</div>
					<div className="radio">
						<label><input type="radio" name="graphTypes" value="Map" />Map</label>
					</div>
					<br />
					<p style={labelStyle}>Other options:</p>
					<div className="checkbox">
						<label><input type="checkbox" value="overlayweather" />Overlay Weather</label>
					</div>
					<div className="checkbox">
						<label><input type="checkbox" value="scaling" />kWh scaling</label>
					</div>
					<br />
					<button type="button" id="changeButton" className="btn btn-primary">Change!</button>
				</div>
			</div>
		);
	}
}

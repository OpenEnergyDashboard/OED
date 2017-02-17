import React from 'react';
import { fetchMeterDataIfNeeded, changeDisplayedMeters } from '../actions';

export default class UIOptionsComponent extends React.Component {
	/**
	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props) {
		super(props);
		this.state = {
			meterInfo: {
				names: [],
				ids: []
			},
			selectedMeters: []
		};
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
	}

	/**
	 * Called when this component mounts
	 * Dispatches a Redux action to fetch meter information
	 */
	componentWillMount() {
		this.props.dispatch(fetchMeterDataIfNeeded());
	}

	/**
	 * Called when this component receives new props
	 * Sets the component's state to the new props
	 */
	componentWillReceiveProps(nextProps) {
		this.setState({ meterInfo: nextProps.meterInfo });
		this.setState({ selectedMeters: nextProps.selectedMeters });
	}

	/**
	 * Dispatches a Redux action to change the displayed meters on the ids of the meters selected
	 * @param e The event fired
	 */
	handleMeterSelect(e) {
		e.preventDefault();
		const options = e.target.options;
		const values = [];
		for (let i = 0; i < options.length; i++) {
			if (options[i].selected) {
				values.push(parseInt(options[i].value));
			}
		}
		this.props.dispatch(changeDisplayedMeters(values));
	}

	/**
	 * @returns JSX to create the UI options side-panel (includes dynamic rendering of meter information for selection)
	 */
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
								{this.state.meterInfo.names.map((name, index) => <option key={index} value={this.state.meterInfo.ids[index]}>{name}</option>)}
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

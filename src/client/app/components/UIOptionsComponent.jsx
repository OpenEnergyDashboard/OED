/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Slider from 'react-rangeslider';
import { MultiSelect } from 'react-selectize';
import 'react-selectize/themes/bootstrap3.css';
import moment from 'moment';
import 'react-rangeslider/lib/index.css';
import { chartTypes } from '../reducers/graph';
import ExportContainer from '../containers/ExportContainer';

// Signifies that the containing object represents a meter
const DATA_TYPE_METER = 'DATA_TYPE_METER';
// Signifies that the containing object represents a group of meters and groups
const DATA_TYPE_GROUP = 'DATA_TYPE_GROUP';

/**
 * Put item's id field in tgt if the item specifies a meter
 * @param {int[]} tgt The array to perhaps insert an item into
 * @param {{String, int}} item The item being considered
 * @return {Array} The modified tgt array
 */
function metersFilterReduce(tgt, item) {
	if (item.type === DATA_TYPE_METER) {
		tgt.push(item.value);
	}
	return tgt;
}

/**
 * Put item's id field in tgt if the item specifies a group
 * @param {int[]} tgt The array to perhaps insert an item into
 * @param {{String, int}} item The item being considered
 * @return {Array} The modified tgt array
 */
function groupsFilterReduce(tgt, item) {
	if (item.type === DATA_TYPE_GROUP) {
		tgt.push(item.value);
	}
}

export default class UIOptionsComponent extends React.Component {
	/**
	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props) {
		super(props);
		this.handleDatasourceSelect = this.handleDatasourceSelect.bind(this);
		this.handleBarDurationChange = this.handleBarDurationChange.bind(this);
		this.handleBarDurationChangeComplete = this.handleBarDurationChangeComplete.bind(this);
		this.handleChangeChartType = this.handleChangeChartType.bind(this);
		this.handleChangeBarStacking = this.handleChangeBarStacking.bind(this);
		this.state = {
			barDuration: 30 // barDuration in days
		};
	}

	/**
	 * Called when this component mounts
	 * Dispatches a Redux action to fetch meter information
	 */
	componentWillMount() {
		this.props.fetchMetersDetailsIfNeeded();
	}

	/**
	 * Handles a change in data source selection
	 * @param {Object[]} selection An array of {label: string, value: {type: string, id: int}} representing the current selection
	 */
	handleDatasourceSelect(selection) {
		// Only load meters
		const selectedMeters = selection.reduce(metersFilterReduce, []);
		this.props.selectMeters(selectedMeters);
		// Only load groups
		// TODO: Uncomment when groups graphing is implemented
		// const selectedGroups = selection.reduce(groupsFilterReduce, []);
		// this.props.selectGroups(selectedGroups);
	}

	/**
	 * Stores temporary barDuration until slider is released, used to update the UI of the slider
	 */
	handleBarDurationChange(value) {
		this.setState({ barDuration: value });
	}

	/**
	 * Called when the user releases the slider, dispatch action on temporary state variable
	 */
	handleBarDurationChangeComplete(e) {
		e.preventDefault();
		this.props.changeDuration(moment.duration(this.state.barDuration, 'days'));
	}

	handleChangeChartType(e) {
		this.props.changeChartType(e.target.value);
	}

	handleChangeBarStacking() {
		this.props.changeBarStacking();
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
		const divBottomPadding = {
			paddingBottom: '15px'
		};
		const radioButtonInlinePadding = {
			display: 'inline-block',
			width: '10px',
		};
		const multiSelectStyle = {
			maxWidth: '100%',
		};

		// Construct the options of the MultiSelect. Because value can be any JavaScript object, here we load it with both the type
		// and ID. Currently this is useless, but when groups graphing is introduced it will be important
		const selectOptions = this.props.meters.map(meter => (
			{ 	label: meter.name,
				type: DATA_TYPE_METER,
				value: meter.id,
			}
		));
		return (
			<div className="col-xs-2" style={divPadding}>
				<div className="col-xs-11">
					<p style={labelStyle}>Meters:</p>
					<div style={divBottomPadding}>
						<MultiSelect options={selectOptions} placeholder="Select Meters" theme="bootstrap3" style={multiSelectStyle} onValuesChange={this.handleDatasourceSelect} />
					</div>
					<p style={labelStyle}>Graph Type:</p>
					<div className="radio">
						<label><input type="radio" name="chartTypes" value={chartTypes.line} onChange={this.handleChangeChartType} checked={this.props.chartToRender === chartTypes.line} />Line</label>
						<div style={radioButtonInlinePadding} />
						<label><input type="radio" name="chartTypes" value={chartTypes.bar} onChange={this.handleChangeChartType} checked={this.props.chartToRender === chartTypes.bar} />Bar</label>
					</div>
					<div className="checkbox">
						<label><input type="checkbox" onChange={this.handleChangeBarStacking} />Bar stacking</label>
					</div>
					<p style={labelStyle}>Bar chart interval (days):</p>
					<Slider min={1} max={365} value={this.state.barDuration} onChange={this.handleBarDurationChange} onChangeComplete={this.handleBarDurationChangeComplete} />
					<div>
						<ExportContainer />
					</div>
				</div>
			</div>
		);
	}
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Slider from 'react-rangeslider';
import moment from 'moment';
import 'react-rangeslider/lib/index.css';
import MultiSelectComponent from './MultiSelectComponent';
import { chartTypes } from '../reducers/graph';
import ExportContainer from '../containers/ExportContainer';
import { DATA_TYPE_METER, DATA_TYPE_GROUP, metersFilterReduce, groupsFilterReduce } from '../utils/Datasources';

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
		this.props.fetchGroupsDetailsIfNeeded();
	}

	/**
	 * Handles a change in data source selection
	 * @param {Object[]} selection An array of {label: string, value: {type: string, id: int}} representing the current selection
	 * @param {String} type either DATA_TYPE_GROUPS or DATA_TYPE_METERS
	 */
	handleDatasourceSelect(selection, type) {
		if (type === DATA_TYPE_METER) {
			this.props.selectMeters(selection.reduce(metersFilterReduce, []));
		} else if (type === DATA_TYPE_GROUP) {
			this.props.selectGroups(selection.reduce(groupsFilterReduce, []));
		}
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

		// Construct the options of the MultiSelect. Because value can be any JavaScript object, here we load it with both the type
		// and ID. Currently this is useless, but when groups graphing is introduced it will be important
		const meterSelectOptions = this.props.meters.map(meter => (
			{ 	
        label: meter.name,
				type: DATA_TYPE_METER,
				value: meter.id
			}
		));

		const groupSelectOptions = this.props.groups.map(group => (
			{
				label: group.name,
				type: DATA_TYPE_GROUP,
				value: group.id
			}
		));
		return (
			<div style={divPadding}>
				<p style={labelStyle}>Groups:</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent options={groupSelectOptions} placeholder="Select Groups" onValuesChange={s => this.handleDatasourceSelect(s, DATA_TYPE_GROUP)} />
				</div>
				<p style={labelStyle}>Meters:</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent options={meterSelectOptions} placeholder="Select Meters" onValuesChange={s => this.handleDatasourceSelect(s, DATA_TYPE_METER)} />
				</div>
				<p style={labelStyle}>Graph Type:</p>
				<div className="radio">
					<label><input type="radio" name="chartTypes" value={chartTypes.line} onChange={this.handleChangeChartType} checked={this.props.chartToRender === chartTypes.line} />Line</label>
					<div style={radioButtonInlinePadding} />
					<label><input type="radio" name="chartTypes" value={chartTypes.bar} onChange={this.handleChangeChartType} checked={this.props.chartToRender === chartTypes.bar} />Bar</label>
				</div>
				{this.props.chartToRender === chartTypes.bar &&
				<div>
					<div className="checkbox">
						<label><input type="checkbox" onChange={this.handleChangeBarStacking} />Bar stacking</label>
					</div>
					<p style={labelStyle}>Bar chart interval (days):</p>
					<Slider min={1} max={365} value={this.state.barDuration} onChange={this.handleBarDurationChange} onChangeComplete={this.handleBarDurationChangeComplete} />
				</div>
				}
				<ExportContainer />
			</div>
		);
	}
}

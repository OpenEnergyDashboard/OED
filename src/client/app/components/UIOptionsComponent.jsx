/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Slider from 'react-rangeslider';
import moment from 'moment';
import 'react-rangeslider/lib/index.css';
import '../styles/react-rangeslider-fix.css';
import MultiSelectComponent from './MultiSelectComponent';
import { chartTypes } from '../reducers/graph';
import ExportContainer from '../containers/ExportContainer';

export default class UIOptionsComponent extends React.Component {
	/**
	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
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
	 * Handles a change in meter selection
	 * @param {Object[]} selection An array of {label: string, value: {type: string, id: int}} representing the current selection
	 */
	handleMeterSelect(selection) {
		this.props.selectMeters(selection.map(s => s.value));
	}

	/**
	 * Handles a change in group selection
	 * @param {Object[]} selection An array of {label: string, value: {type: string, id: int}} representing the current selection
	 */
	handleGroupSelect(selection) {
		this.props.selectGroups(selection.map(s => s.value));
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
			fontWeight: 'bold',
			margin: 0
		};
		const divPadding = {
			paddingTop: '15px'
		};
		const divBottomPadding = {
			paddingBottom: '15px'
		};
		const radioButtonInlinePadding = {
			display: 'inline-block',
			width: '10px',
		};

		const meterSelectOptions = this.props.meters.map(meter => (
			{
				label: meter.name,
				value: meter.id
			}
		));

		const groupSelectOptions = this.props.groups.map(group => (
			{
				label: group.name,
				value: group.id
			}
		));
		return (
			<div style={divPadding}>
				<p style={labelStyle}>Groups:</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={groupSelectOptions}
						selectedOptions={this.props.selectedGroups}
						placeholder="Select Groups"
						onValuesChange={s => this.handleGroupSelect(s)}
					/>
				</div>
				<p style={labelStyle}>Meters:</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={meterSelectOptions}
						selectedOptions={this.props.selectedMeters}
						placeholder="Select Meters"
						onValuesChange={s => this.handleMeterSelect(s)}
					/>
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

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Slider from 'react-rangeslider';
import moment from 'moment';
import { Button, ButtonGroup } from 'reactstrap';
import 'react-rangeslider/lib/index.css';
import '../styles/react-rangeslider-fix.css';
import { chartTypes } from '../reducers/graph';
import ExportContainer from '../containers/ExportContainer';
import ChartSelectContainer from '../containers/ChartSelectContainer';
import ChartDataSelectContainer from '../containers/ChartDataSelectContainer';
import ChartLinkContainer from '../containers/ChartLinkContainer';
import TimeInterval from '../../../common/TimeInterval';

export default class UIOptionsComponent extends React.Component {
	/**
	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
		this.handleBarDurationChange = this.handleBarDurationChange.bind(this);
		this.handleBarDurationChangeComplete = this.handleBarDurationChangeComplete.bind(this);
		this.handleChangeBarStacking = this.handleChangeBarStacking.bind(this);
		this.handleBarButton = this.handleBarButton.bind(this);
		this.handleCompareButton = this.handleCompareButton.bind(this);
		this.toggleSlider = this.toggleSlider.bind(this);
		this.state = {
			barDuration: this.props.barDuration.asDays(),
			showSlider: false
		};
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ barDuration: nextProps.barDuration.asDays() });
	}

	/**
	 * Stores temporary barDuration until slider is released, used to update the UI of the slider
	 */
	handleBarDurationChange(value) {
		this.setState({ barDuration: value });
	}

	/**
	 * Handles a change in meter selection
	 * @param {Object[]} selection An array of {label: string, value: {type: string, id: int}} representing the current selection
	 */
	handleMeterSelect(selection) {
		this.props.selectMeters(selection.map(s => s.value));
	}

	/**
	 * Called when the user releases the slider, dispatch action on temporary state variable
	 */
	handleBarDurationChangeComplete(e) {
		e.preventDefault();
		this.props.changeDuration(moment.duration(this.state.barDuration, 'days'));
	}


	handleChangeBarStacking() {
		this.props.changeBarStacking();
	}

	handleBarButton(value) {
		this.props.changeDuration(moment.duration(value, 'days'));
	}

	handleCompareButton(value) {
		let compareTimeInterval;
		let compareDuration;
		switch (value) {
			case 'day':
				compareTimeInterval = new TimeInterval(moment().subtract(2, 'days'), moment()).toString();
				// fetch hours for accuracy when time interval is small
				compareDuration = moment.duration(1, 'hours');
				break;
			case 'month':
				compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(49, 'days'), moment()).toString();
				compareDuration = moment.duration(1, 'days');
				break;
			default: // handles week
				compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(7, 'days'), moment()).toString();
				compareDuration = moment.duration(1, 'days');
				break;
		}
		this.props.changeCompareInterval(compareTimeInterval, compareDuration);
	}

	toggleSlider() {
		this.setState({ showSlider: !this.state.showSlider });
	}

	/**
	 * @returns JSX to create the UI options side-panel (includes dynamic rendering of meter information for selection)
	 */
	render() {
		const labelStyle = {
			fontWeight: 'bold',
			margin: 0
		};
		const divTopPadding = {
			paddingTop: '15px'
		};

		const zIndexFix = {
			zIndex: '0'
		};

		const compareTimeIntervalDurationInDays = TimeInterval.fromString(this.props.compareInterval).duration('days');
		let compareVal;
		if (compareTimeIntervalDurationInDays < 7) {
			compareVal = 'day';
		} else if (compareTimeIntervalDurationInDays >= 7 && compareTimeIntervalDurationInDays < 14) {
			compareVal = 'week';
		} else {
			compareVal = 'month';
		}

		return (
			<div>
				<ChartSelectContainer />
				<ChartDataSelectContainer />

				{ /* Controls specific to the bar chart */}
				{this.props.chartToRender === chartTypes.bar &&
					<div>
						<div className="checkbox">
							<label><input type="checkbox" onChange={this.handleChangeBarStacking} checked={this.props.barStacking} />Bar stacking</label>
						</div>
						<p style={labelStyle}>Bar chart interval:</p>
						<ButtonGroup
							type="radio"
							value={this.state.barDuration}
							style={zIndexFix}
						>
							<Button
								outline={this.state.barDuration !== 1}
								onClick={() => this.handleBarButton(1)}
							>
								Day
							</Button>
							<Button
								outline={this.state.barDuration !== 7}
								onClick={() => this.handleBarButton(7)}
							>
								Week
							</Button>
							<Button
								outline={this.state.barDuration !== 28}
								onClick={() => this.handleBarButton(28)}
							>
								4 Weeks
							</Button>
						</ButtonGroup>
						<Button
							outline={!this.state.showSlider}
							onClick={this.toggleSlider}
						>
							Toggle custom slider (days)
						</Button>
						{this.state.showSlider &&
						<Slider
							min={1} max={365} value={this.state.barDuration} onChange={this.handleBarDurationChange}
							onChangeComplete={this.handleBarDurationChangeComplete}
						/>
						}
					</div>

				}
				{ /* Controls specific to the compare chart */}
				{this.props.chartToRender === chartTypes.compare &&
				<div>
					<ButtonGroup
						style={zIndexFix}
					>
						<Button
							outline={compareVal !== 'day'}
							onClick={() => this.handleCompareButton('day')}
						>
							Day
						</Button>
						<Button
							outline={compareVal !== 'week'}
							onClick={() => this.handleCompareButton('week')}
						>
							Week
						</Button>
						<Button
							outline={compareVal !== 'month'}
							onClick={() => this.handleCompareButton('month')}
						>
							4 Weeks
						</Button>
					</ButtonGroup>
				</div>
				}


				{ /* We can't export compare data */ }
				{this.props.chartToRender !== chartTypes.compare &&
					<div style={divTopPadding}>
						<ExportContainer />
					</div>
				}
				<div style={divTopPadding}>
					<ChartLinkContainer />
				</div>
			</div>
		);
	}
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
// TODO TYPESCRIPT: Need definitions for this?
import Slider from 'react-rangeslider';
import * as moment from 'moment';
import 'react-rangeslider/lib/index.css';
import '../styles/react-rangeslider-fix.css';
import { chartTypes } from '../reducers/graph';
import ExportContainer from '../containers/ExportContainer';
import ChartSelectContainer from '../containers/ChartSelectContainer';
import ChartDataSelectContainer from '../containers/ChartDataSelectContainer';
import { ChangeBarStackingAction } from '../actions/graph';
import ChartLinkContainer from '../containers/ChartLinkContainer';

export interface UIOptionsProps {
	chartToRender: chartTypes;
	barStacking: boolean;
	barDuration: moment.Duration;
	changeDuration(duration: moment.Duration): Promise<any>;
	changeBarStacking(): ChangeBarStackingAction;
}

interface UIOptionsState {
	barDuration: number;
}

export default class UIOptionsComponent extends React.Component<UIOptionsProps, UIOptionsState> {
	/**
	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props: UIOptionsProps) {
		super(props);
		this.handleBarDurationChange = this.handleBarDurationChange.bind(this);
		this.handleBarDurationChangeComplete = this.handleBarDurationChangeComplete.bind(this);
		this.handleChangeBarStacking = this.handleChangeBarStacking.bind(this);
		this.state = {
			barDuration: this.props.barDuration.asDays()
		};
	}

	public componentWillReceiveProps(nextProps: UIOptionsProps) {
		this.setState({ barDuration: nextProps.barDuration.asDays() });
	}

	/**
	 * @returns JSX to create the UI options side-panel (includes dynamic rendering of meter information for selection)
	 */
	public render() {
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};

		const divTopPadding: React.CSSProperties = {
			paddingTop: '15px'
		};

		return (
			<div>
				<ChartSelectContainer />
				<ChartDataSelectContainer />

				{/* Controls specific to the bar chart. */}
				{this.props.chartToRender === chartTypes.bar &&
					<div>
						<div className='checkbox'>
							<label><input type='checkbox' onChange={this.handleChangeBarStacking} checked={this.props.barStacking} />Bar stacking</label>
						</div>
						<p style={labelStyle}>Bar chart interval (days):</p>
						<Slider
							min={1}
							max={365}
							value={this.state.barDuration}
							onChange={this.handleBarDurationChange}
							onChangeComplete={this.handleBarDurationChangeComplete}
						/>
					</div>
				}

				{/* We can't export compare data */}
				{this.props.chartToRender !== chartTypes.compare &&
					<ExportContainer />
				}
				<div style={divTopPadding}>
					<ChartLinkContainer />
				</div>
			</div>
		);
	}

	/**
	 * Stores temporary barDuration until slider is released, used to update the UI of the slider
	 */
	private handleBarDurationChange(value: number) {
		this.setState({ barDuration: value });
	}

	/**
	 * Called when the user releases the slider, dispatch action on temporary state variable
	 */
	private handleBarDurationChangeComplete(e: React.ChangeEvent<null>) {
		e.preventDefault();
		this.props.changeDuration(moment.duration(this.state.barDuration, 'days'));
	}

	/**
	 * Toggles the bar stacking option
	 */
	private handleChangeBarStacking() {
		this.props.changeBarStacking();
	}
}

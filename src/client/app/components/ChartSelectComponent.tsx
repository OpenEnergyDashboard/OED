/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

import { ChartTypes } from '../types/redux/graph';
import { ChangeChartToRenderAction } from '../types/redux/graph';
import Button from 'reactstrap/lib/Button';
import ButtonGroup from 'reactstrap/lib/ButtonGroup';
import { FormEvent } from 'react';
import { FormattedMessage } from 'react-intl';

/*
 * Calls method to change the type of chart when a chart is selected.
 */
interface ChartSelectProps {
	selectedChart: ChartTypes;
	changeChartType(chartType: ChartTypes): ChangeChartToRenderAction;
}

/**
 * A component that allows users to select which chart should be displayed.
 */
export default class ChartSelectComponent extends React.Component<ChartSelectProps, {}> {
	constructor(props: ChartSelectProps) {
		super(props);
		this.handleChangeChartType = this.handleChangeChartType.bind(this);
	}
	
	/**
	 * @returns JSX code to render components for ChartSelectComponents.
	 * TODO: confirm this.
	 */
	public render() {
		const divBottomPadding: React.CSSProperties = {
			paddingBottom: '15px'
		};

		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};

		return (
			<div style={divBottomPadding}>
				<p style={labelStyle}>
					<FormattedMessage id='graph.type' />:
				</p>
				<ButtonGroup>
					<Button
						outline={this.props.selectedChart !== ChartTypes.line}
						onClick={() => this.handleChangeChartType(ChartTypes.line)}
					>
						<FormattedMessage id='line' />
					</Button>
					<Button
						outline={this.props.selectedChart !== ChartTypes.bar}
						onClick={() => this.handleChangeChartType(ChartTypes.bar)}
					>
						<FormattedMessage id='bar' />
					</Button>
					<Button
						outline={this.props.selectedChart !== ChartTypes.compare}
						onClick={() => this.handleChangeChartType(ChartTypes.compare)}
					>
						<FormattedMessage id='compare' />
					</Button>
				</ButtonGroup>
			</div>
		);
	}

	private handleChangeChartType(value: ChartTypes) {
		this.props.changeChartType(value);
	}
}

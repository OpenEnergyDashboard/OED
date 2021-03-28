/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

import { ChartTypes } from '../types/redux/graph';
import { ChangeChartToRenderAction } from '../types/redux/graph';
import { FormattedMessage } from 'react-intl';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import Dropdown from 'reactstrap/lib/Dropdown';
import DropdownItem from 'reactstrap/lib/DropdownItem';
import DropdownToggle from 'reactstrap/lib/DropdownToggle';
import DropdownMenu from 'reactstrap/lib/DropdownMenu';

interface ChartSelectProps {
	selectedChart: ChartTypes;
	changeChartType(chartType: ChartTypes): ChangeChartToRenderAction;
}
interface DropdownState {
	dropdownOpen: boolean;
	compareSortingDropdownOpen: boolean;
}
/**
 * A component that allows users to select which chart should be displayed.
 */
export default class ChartSelectComponent extends React.Component<ChartSelectProps, DropdownState, {}> {
	constructor(props: ChartSelectProps) {
		super(props);
		this.handleChangeChartType = this.handleChangeChartType.bind(this);
		this.toggleDropdown = this.toggleDropdown.bind(this);
		this.state = {
			dropdownOpen: false,
			compareSortingDropdownOpen: false
		};
	}

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
				<Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
					<DropdownToggle outline caret>
						<FormattedMessage id='chart.select' />
					</DropdownToggle>
					<DropdownMenu>
						<DropdownItem
							outline={this.props.selectedChart !== ChartTypes.line}
							onClick={() => this.handleChangeChartType(ChartTypes.line)}
						>
							<FormattedMessage id='line' />
						</DropdownItem>
						<DropdownItem
							outline={this.props.selectedChart !== ChartTypes.bar}
							onClick={() => this.handleChangeChartType(ChartTypes.bar)}
						>
							<FormattedMessage id='bar' />
						</DropdownItem>
						<DropdownItem
							outline={this.props.selectedChart !== ChartTypes.compare}
							onClick={() => this.handleChangeChartType(ChartTypes.compare)}
						>
							<FormattedMessage id='compare' />
						</DropdownItem>
						<DropdownItem
							outline={this.props.selectedChart !== ChartTypes.map}
							onClick={() => this.handleChangeChartType(ChartTypes.map)}
						>
							<FormattedMessage id='map' />
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
				<div>
					<TooltipMarkerComponent page='home' helpTextId='help.home.chart.select'/>
				</div>
			</div>
		);
	}

	private handleChangeChartType(value: ChartTypes) {
		this.props.changeChartType(value);
	}
	private toggleDropdown() {
		this.setState(prevState => ({dropdownOpen: !prevState.dropdownOpen}));
	}
}

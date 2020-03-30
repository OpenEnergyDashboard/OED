/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import {ChartTypes} from '../types/redux/graph';
import {getRangeSliderInterval} from './DashboardComponent';

interface ChartLinkProps {
	linkText: string;
	weeklyLink: string;
	chartType: ChartTypes;
}

interface ChartLinkState {
	showLink: boolean;
	showSliderRange: boolean;
	showOptionalLink: boolean;
	optionalLink: string;
	sliderRange: string;
}

export default class ChartLinkComponent extends React.Component<ChartLinkProps, ChartLinkState> {
	constructor(props: ChartLinkProps) {
		super(props);
		this.toggleLink = this.toggleLink.bind(this);
		this.handle7DaysChange = this.handle7DaysChange.bind(this);
		this.state = {
			showLink: false,
			showSliderRange: false,
			showOptionalLink: false,
			optionalLink: '',
			sliderRange: ''
		};
	}

	public render() {
		const wellStyle: React.CSSProperties = {
			wordWrap: 'break-word',
			padding: '9px',
			minHeight: '20px',
			marginBottom: '20px',
			backgroundColor: '#f5f5f5',
			border: '1px solid #e3e3e3'

		};
		return (
			<div>
				<Button	outline	onClick={this.toggleLink}>
					<FormattedMessage id='toggle.link' />
				</Button>
				{this.state.showLink &&
					<>
						<div style={wellStyle}>
							{this.props.linkText}
							{this.state.showSliderRange && this.state.sliderRange}
						</div>
						<Button outline onClick={this.handle7DaysChange}>
							Set to track most recent 7 days
						</Button>
						{this.state.showOptionalLink &&
							<div style={wellStyle}>
							{this.state.optionalLink}
							</div>
						}
					</>
				}
			</div>
		);
	}
	private handle7DaysChange() {
		this.setState(
			{
				showOptionalLink: !this.state.showOptionalLink,
				optionalLink: this.props.weeklyLink
		});
	}


	private toggleLink() {
		if (this.state.showLink) {
			this.setState({
				showLink: false,
				showSliderRange: false
			});
		} else {
			if (this.props.chartType === 'line') {
				const newSliderRange = this.getSliderRangeString();
				this.setState({
					showLink: !this.state.showLink,
					showSliderRange: true,
					sliderRange: newSliderRange
				});
			} else {
				this.setState({
					showLink: !this.state.showLink
				});
			}
		}
	}

	private getSliderRangeString() {
		const sliderRangeString = `&sliderRange=${getRangeSliderInterval()}`;
		return sliderRangeString;
	}
}

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
	chartType: ChartTypes;
}

interface ChartLinkState {
	showLink: boolean;
	showSliderRange: boolean;
	sliderRange: string;
	showOptionalLink: boolean;
	optionalLink: string;
	hideOptionsInLinkedPage: boolean;
}

export default class ChartLinkComponent extends React.Component<ChartLinkProps, ChartLinkState> {
	constructor(props: ChartLinkProps) {
		super(props);
		this.toggleLink = this.toggleLink.bind(this);
		this.handleOptionsVisibility = this.handleOptionsVisibility.bind(this);
		// this.handle7DaysChange = this.handle7DaysChange.bind(this);
		this.state = {
			showLink: false,
			showSliderRange: false,
			sliderRange: '',
			showOptionalLink: true,
			optionalLink: '',
			hideOptionsInLinkedPage: false,
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
                        <div className='checkbox'>
                            <label><input type='checkbox' onChange={this.handleOptionsVisibility} checked={this.state.hideOptionsInLinkedPage}/>
                                <FormattedMessage id='hide.options.in.link' />
                            </label>
                        </div>
						<div style={wellStyle}>
							{this.props.linkText}
							{this.state.showSliderRange && this.state.sliderRange}
							{this.state.showOptionalLink && this.state.optionalLink}
						</div>
						{/*removed the button to track a week's data from present after commit caa6109e7624c1ad0bee2b20aa8f9c91cf48c8e4*/}
						{/*<Button outline onClick={this.handle7DaysChange}>*/}
						{/*	Set to track most recent 7 days*/}
						{/*</Button>*/}
						{/*{this.state.showOptionalLink &&*/}
						{/*	<div style={wellStyle}>*/}
						{/*	{this.state.optionalLink}*/}
						{/*	</div>*/}
						{/*}*/}
					</>
				}
			</div>
		);
	}
	// function responsible for showing url to track a week's data from present, removed after commit caa6109e7624c1ad0bee2b20aa8f9c91cf48c8e4
	// private handle7DaysChange() {
	// 	this.setState(
	// 		{
	// 			showOptionalLink: !this.state.showOptionalLink,
	// 			optionalLink: this.props.weeklyLink
	// 	});
	// }


	private toggleLink() {
		if (this.state.showLink) {
			this.setState({
				showLink: false,
				showSliderRange: false
			});
		} else {
			if (this.props.chartType === 'line') {
				const newSliderRange = this.getSliderRangeString(); //get sliderRange on demand;
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

	/**
	 * TODO: this could be refactor into part of an interface that holds all user-selected options
	 * and produce output as a single string in a loop.
	 */
	private handleOptionsVisibility() {
		let currState = this.state.hideOptionsInLinkedPage;
		let optionsVisibilityToken = '&optionsVisibility=false';
		this.setState({
			hideOptionsInLinkedPage: !currState,
			optionalLink: (currState)? '':optionsVisibilityToken,
		});
	}
}

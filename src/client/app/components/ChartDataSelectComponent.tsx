/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import MultiSelectComponent from './MultiSelectComponent';
import { SelectOption } from '../types/items';
import { defineMessages, FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import TooltipMarkerComponent from './TooltipMarkerComponent';

interface ChartDataSelectProps {
	meters: SelectOption[];
	groups: SelectOption[];
	selectedMeters: SelectOption[];
	selectedGroups: SelectOption[];
	selectMeters(meterIDs: number[]): Promise<any>;
	selectGroups(groupIDs: number[]): Promise<any>;
}

type ChartDataSelectPropsWithIntl = ChartDataSelectProps & WrappedComponentProps;

/**
 * A component which allows the user to select which data should be displayed on the chart.
 */
class ChartDataSelectComponent extends React.Component<ChartDataSelectPropsWithIntl, {}> {
	constructor(props: ChartDataSelectPropsWithIntl) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
	}

	public render() {
		const divBottomPadding: React.CSSProperties = {
			paddingBottom: '15px'
		};
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};
		const messages = defineMessages({
			selectGroups: { id: 'select.groups' },
			selectMeters: { id: 'select.meters' },
			helpSelectGroups: { id: 'help.home.select.groups' },
			helpSelectMeters: { id: 'help.home.select.meters' }
		});

		return (
			<div>
				<p style={labelStyle}>
					<FormattedMessage id='groups' />:
				</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={this.props.groups}
						selectedOptions={this.props.selectedGroups}
						placeholder={this.props.intl.formatMessage(messages.selectGroups)}
						onValuesChange={this.handleGroupSelect}
					/>
					<TooltipMarkerComponent page='home' helpTextId='help.home.select.groups' />
				</div>
				<p style={labelStyle}>
					<FormattedMessage id='meters' />:
				</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={this.props.meters}
						selectedOptions={this.props.selectedMeters}
						placeholder={this.props.intl.formatMessage(messages.selectMeters)}
						onValuesChange={this.handleMeterSelect}
					/>
					<TooltipMarkerComponent page='home' helpTextId='help.home.select.meters' />
				</div>
			</div>
		);
	}

	/**
	 * Handles a change in meter selection
	 * @param {Object[]} selection An array of items representing the current selection
	 */
	private handleMeterSelect(selection: SelectOption[]) {
		this.props.selectMeters(selection.map(s => s.value));
	}

	/**
	 * Handles a change in group selection
	 * @param {Object[]} selection An array of items representing the current selection
	 */
	private handleGroupSelect(selection: SelectOption[]) {
		this.props.selectGroups(selection.map(s => s.value));
	}
}

export default injectIntl(ChartDataSelectComponent);

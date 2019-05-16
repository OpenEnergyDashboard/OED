/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import MultiSelectComponent from './MultiSelectComponent';
import { SelectOption } from '../types/items';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import TooltipHelpComponent from './TooltipHelpComponent';

interface ChartDataSelectProps {
	meters: SelectOption[];
	groups: SelectOption[];
	selectedMeters: SelectOption[];
	selectedGroups: SelectOption[];
	selectMeters(meterIDs: number[]): Promise<any>;
	selectGroups(groupIDs: number[]): Promise<any>;
}

type ChartDataSelectPropsWithIntl = ChartDataSelectProps & InjectedIntlProps;

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
			selectGroups: {	id: 'select.groups' },
			selectMeters: { id: 'select.meters' }
		});
		const { formatMessage } = this.props.intl;

		const handleGroupSelect = (s: SelectOption[]) => this.handleGroupSelect(s);

		return (
			<div>
				<p style={labelStyle}>
				
					<FormattedMessage id='groups' />:
				</p>
				<div style={divBottomPadding}>
			
					<MultiSelectComponent
						options={this.props.groups}
						selectedOptions={this.props.selectedGroups}
						placeholder={formatMessage(messages.selectGroups)}
						onValuesChange={handleGroupSelect}
					/>
					<TooltipHelpComponent tip="Choose which groups to dipsplay"/>
				</div>
				<p style={labelStyle}>
					
					<FormattedMessage id='meters' />:
				</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={this.props.meters}
						selectedOptions={this.props.selectedMeters}
						placeholder={formatMessage(messages.selectMeters)}
						onValuesChange={this.handleMeterSelect}
					/>
					<TooltipHelpComponent tip="Choose which meters to display"/>
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

export default injectIntl<ChartDataSelectProps>(ChartDataSelectComponent);

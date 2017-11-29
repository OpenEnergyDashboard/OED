/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import MultiSelectComponent from './MultiSelectComponent';
import { SelectOption } from '../types/items';
import { fetchGroupsDetailsIfNeeded } from 'actions/groups';

interface ChartDataSelectProps {
	meters: SelectOption[];
	groups: SelectOption[];
	selectedMeters: SelectOption[];
	selectedGroups: SelectOption[];
	fetchMetersDetailsIfNeeded(): Promise<any>;
	fetchGroupsDetailsIfNeeded(): Promise<any>;
	selectMeters(meterIDs: number[]): Promise<any>;
	selectGroups(groupIDs: number[]): Promise<any>;
}

/**
 * A component which allows the user to select which data should be displayed on the chart.
 */
export default class ChartDataSelectComponent extends React.Component<ChartDataSelectProps, {}> {
	constructor(props: ChartDataSelectProps) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
	}

	/**
	 * Called when the component mounts.
	 * Fetch all meter and group info, for display.
	 */
	public componentWillMount() {
		this.props.fetchMetersDetailsIfNeeded();
		this.props.fetchGroupsDetailsIfNeeded();
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
			<div>
				<p style={labelStyle}>Groups:</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={this.props.groups}
						selectedOptions={this.props.selectedGroups}
						placeholder='Select Groups'
						onValuesChange={s => this.handleGroupSelect(s)}
					/>
				</div>
				<p style={labelStyle}>Meters:</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={this.props.meters}
						selectedOptions={this.props.selectedMeters}
						placeholder='Select Meters'
						onValuesChange={s => this.handleMeterSelect(s)}
					/>
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

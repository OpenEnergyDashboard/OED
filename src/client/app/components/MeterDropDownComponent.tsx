/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { NamedIDItem } from '../types/items';
import { adminSlice } from '../redux/slices/adminSlice';

export interface MeterDropDownProps {
	meters: NamedIDItem[];
	updateSelectedMeter(meterID: number): ReturnType<typeof adminSlice.actions.updateImportMeter>
}

export default class MeterDropDownComponent extends React.Component<MeterDropDownProps> {
	constructor(props: MeterDropDownProps) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
	}

	public render() {
		return (
			<select onChange={this.handleMeterSelect}>
				{this.props.meters.map(meter =>
					<option key={meter.id} value={meter.id}>{meter.name}</option>
				)}
			</select>
		);
	}

	private handleMeterSelect(e: React.ChangeEvent<HTMLSelectElement>) {
		this.props.updateSelectedMeter(parseInt(e.target.value));
	}
}

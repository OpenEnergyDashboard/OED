/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { State } from '../types/redux/state';
import { useDispatch, useSelector } from 'react-redux';
import { SelectOption } from '../types/items';
import Select from 'react-select';
import translate from '../utils/translate';
import { updateLineGraphRate } from '../actions/graph'
import { LineGraphRate, LineGraphRates } from '../types/redux/graph';

/**
 * React component that controls the line graph rate menu
 */
export default function GraphicRateMenuComponent() {
	const dispatch = useDispatch();

	// Graph state
	const graphState = useSelector((state: State) => state.graph);

	// Array of select options created from the rates
	const rateOptions: SelectOption[] = [];

	//Loop over our rates object to create the selects for the dropdown
	Object.entries(LineGraphRates).forEach(([rateKey, rateValue]) => {
		rateOptions.push({
			label: translate(rateKey),
			value: rateValue,
			labelIdForTranslate: rateKey
		} as SelectOption);
	});

	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};

	return (
		<div>
			{
				graphState.chartToRender == 'line' &&
				<div>
					<p style={labelStyle}><FormattedMessage id='rate' />:</p>
					{ /* On change update the line graph rate in the store after a null check */}
					<Select
						options={rateOptions}
						value={{ label: translate(graphState.lineGraphRate.label), value: graphState.lineGraphRate.rate } as SelectOption}
						onChange={newSelectedRate => {
							if (newSelectedRate) {
								dispatch(updateLineGraphRate({
									label: newSelectedRate.labelIdForTranslate,
									rate: Number(newSelectedRate.value)
								} as LineGraphRate))
							}
						}}
					/>
				</div>
			}
		</div>
	);
}

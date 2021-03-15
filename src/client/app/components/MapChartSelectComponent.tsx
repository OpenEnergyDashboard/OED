/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { SelectOption } from '../types/items';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import '../styles/react-select-css.css';
import 'react-select/dist/react-select.css';
import SingleSelectComponent from './SingleSelectComponent';
import TooltipMarkerComponent from './TooltipMarkerComponent';

interface MapChartSelectProps {
	maps: SelectOption[];
	selectedMap: SelectOption;
	selectMap(mapID: number): any;
}

type MapChartSelectPropsWithIntl = MapChartSelectProps & InjectedIntlProps;

class MapChartSelectComponent extends React.Component<MapChartSelectPropsWithIntl, {}> {
	constructor(props: MapChartSelectPropsWithIntl) {
		super(props);
		this.handleMapSelect = this.handleMapSelect.bind(this);
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
			selectMap: {id: 'select.map'}
		});
		const { formatMessage } = this.props.intl;

		return (
			<div>
				<p style={labelStyle}>
					<FormattedMessage id='maps' />:
				</p>
				<div style={divBottomPadding}>
					<SingleSelectComponent
						options={this.props.maps}
						selectedOption={(this.props.selectedMap.value === 0)? undefined: this.props.selectedMap}
						placeholder={formatMessage(messages.selectMap)}
						onValueChange={this.handleMapSelect}
					/>
					<TooltipMarkerComponent page='home' helpTextId='help.home.select.maps'/>
				</div>
			</div>
		);
	}

	/**
	 * handles change in map selection
	 * @param selection
	 */
	private handleMapSelect(selection: SelectOption) {
		this.props.selectMap(selection.value);
	}
}

export default injectIntl<MapChartSelectProps>(MapChartSelectComponent);

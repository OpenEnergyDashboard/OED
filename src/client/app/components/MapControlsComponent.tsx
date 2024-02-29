/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import * as React from 'react';
import translate from '../utils/translate';
import { Button, ButtonGroup } from 'reactstrap';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import MapChartSelectComponent from './MapChartSelectComponent';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectBarWidthDays } from '../redux/slices/graphSlice';
import * as moment from 'moment';
/**
 * @returns Map page controls
 */
export default function MapControlsComponent() {
	const dispatch = useAppDispatch();
	const barDuration = useAppSelector(selectBarWidthDays);

	const handleDurationChange = (value: number) => {
		dispatch(graphSlice.actions.updateBarDuration(moment.duration(value, 'days')));
	};

	const barDurationDays = barDuration.asDays();

	return (
		<div>
			<div key='side-options'>
				<p style={labelStyle}>
					{translate('map.interval')}:
				</p>
				<ButtonGroup style={zIndexFix}>
					<Button outline={barDurationDays !== 1} onClick={() => handleDurationChange(1)}> {translate('day')} </Button>
					<Button outline={barDurationDays !== 7} onClick={() => handleDurationChange(7)}> {translate('week')} </Button>
					<Button outline={barDurationDays !== 28} onClick={() => handleDurationChange(28)}> {translate('4.weeks')} </Button>
				</ButtonGroup>
				<TooltipMarkerComponent page='home' helpTextId='help.home.map.interval.tip' />
			</div>
			<MapChartSelectComponent key='chart' />
		</div>
	);
}


const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};

const zIndexFix: React.CSSProperties = {
	zIndex: 0
};
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// import * as moment from 'moment';
// import * as React from 'react';
// import { Button, ButtonGroup } from 'reactstrap';
// import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
// import { selectMapBarWidthDays, updateMapsBarDuration } from '../redux/slices/graphSlice';
// import translate from '../utils/translate';
// import MapChartSelectComponent from './MapChartSelectComponent';
// import TooltipMarkerComponent from './TooltipMarkerComponent';
// /**
//  * @returns Map page controls
//  */
// export default function MapControlsComponent() {
// 	const dispatch = useAppDispatch();
// 	const mapDuration = useAppSelector(selectMapBarWidthDays);

// 	const handleDurationChange = (value: number) => {
// 		dispatch(updateMapsBarDuration(moment.duration(value, 'days')));
// 	};

// 	const barDurationDays = mapDuration.asDays();

// 	return (
// 		<div>
// 			<div key='side-options'>
// 				<p style={labelStyle}>
// 					{translate('map.interval')}:
// 				</p>
// 				<ButtonGroup style={zIndexFix}>
// 					<Button outline={barDurationDays !== 1} onClick={() => handleDurationChange(1)}> {translate('day')} </Button>
// 					<Button outline={barDurationDays !== 7} onClick={() => handleDurationChange(7)}> {translate('week')} </Button>
// 					<Button outline={barDurationDays !== 28} onClick={() => handleDurationChange(28)}> {translate('4.weeks')} </Button>
// 				</ButtonGroup>
// 				<TooltipMarkerComponent page='home' helpTextId='help.home.map.interval.tip' />
// 			</div>
// 			<MapChartSelectComponent key='chart' />
// 		</div>
// 	);
// }


// const labelStyle: React.CSSProperties = {
// 	fontWeight: 'bold',
// 	margin: 0
// };

// const zIndexFix: React.CSSProperties = {
// 	zIndex: 0
// };

import * as moment from 'moment';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { FormFeedback, FormGroup, Input, Label } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectBarWidthDays } from '../redux/slices/graphSlice';
import translate from '../utils/translate';
import MapChartSelectComponent from './MapChartSelectComponent';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns Map page controls
 */
export default function MapControlsComponent() {
	const dispatch = useAppDispatch();

	// The min/max days allowed for user selection
	const MIN_MAP_DAYS = 1;
	const MAX_MAP_DAYS = 366;
	// Special value if custom input for standard menu.
	const CUSTOM_INPUT = '-99';

	// This is the current map interval for graphic.
	const mapDuration = useAppSelector(selectBarWidthDays);
	// Holds the value of standard map duration choices used so decoupled from custom.
	const [mapDays, setMapDays] = React.useState<string>(mapDuration.asDays().toString());
	// Holds the value during custom map duration input so only update graphic when done entering and
	// separate from standard choices.
	const [mapDaysCustom, setMapDaysCustom] = React.useState<number>(mapDuration.asDays());
	// True if custom map duration input is active.
	const [showCustomMapDuration, setShowCustomMapDuration] = React.useState<boolean>(false);

	// Keeps react-level state, and redux state in sync.
	// Two different layers in state may differ especially when externally updated (chart link, history buttons.)
	React.useEffect(() => {
		// Assume value is valid since it is coming from state.
		// Do not allow bad values in state.
		const isCustom = !(['1', '7', '28'].find(days => days == mapDuration.asDays().toString()));
		setShowCustomMapDuration(isCustom);
		setMapDaysCustom(mapDuration.asDays());
		setMapDays(isCustom ? CUSTOM_INPUT : mapDuration.asDays().toString());
	}, [mapDuration]);

	// Returns true if this is a valid map duration.
	const mapDaysValid = (mapDays: number) => {
		return Number.isInteger(mapDays) && mapDays >= MIN_MAP_DAYS && mapDays <= MAX_MAP_DAYS;
	};

	// Updates values when the standard map duration menu is used.
	const handleMapDaysChange = (value: string) => {
		if (value === CUSTOM_INPUT) {
			// Set menu value for standard map to special value to show custom
			// and show the custom input area.
			setMapDays(CUSTOM_INPUT);
			setShowCustomMapDuration(true);
		} else {
			// Set the standard menu value, hide the custom map duration input
			//  and map duration for graphing.
			// Since controlled values know it is a valid integer.
			setShowCustomMapDuration(false);
			updateMapDurationChange(Number(value));
		}
	};

	// Updates value when the custom map duration input is used.
	const handleCustomMapDaysChange = (value: number) => {
		setMapDaysCustom(value);
	};

	const handleEnter = (key: string) => {
		// This detects the enter key and then uses the previously entered custom
		// map duration to set the map duration for the graphic.
		if (key == 'Enter') {
			updateMapDurationChange(mapDaysCustom);
		}
	};

	const updateMapDurationChange = (value: number) => {
		// Update if okay value. May not be okay if this came from user entry in custom form.
		if (mapDaysValid(value)) {
			dispatch(graphSlice.actions.updateBarDuration(moment.duration(value, 'days')));
		}
	};

	return (
		<div>
			<div key='side-options'>
				<p style={labelStyle}>
					{translate('map.interval')}:
					<TooltipMarkerComponent page='home' helpTextId='help.home.map.interval.tip' />
				</p>
				<Input
					id='mapDurationDays'
					name='mapDurationDays'
					type='select'
					value={mapDays}
					onChange={e => handleMapDaysChange(e.target.value)}
				>
					<option value='1'>{translate('day')}</option>
					<option value='7'>{translate('week')}</option>
					<option value='28'>{translate('4.weeks')}</option>
					<option value={CUSTOM_INPUT}>{translate('custom.value')}</option>
				</Input>
				{/* This has a little more spacing at bottom than optimal. */}
				{showCustomMapDuration &&
					<FormGroup>
						<Label for='mapDays'>{translate('map.days.enter')}:</Label>
						<Input id='mapDays' name='mapDays' type='number'
							onChange={e => handleCustomMapDaysChange(Number(e.target.value))}
							// This grabs each key hit and then finishes input when hit enter.
							onKeyDown={e => { handleEnter(e.key); }}
							step='1'
							min={MIN_MAP_DAYS}
							max={MAX_MAP_DAYS}
							value={mapDaysCustom}
							invalid={!mapDaysValid(mapDaysCustom)} />
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: MIN_MAP_DAYS, max: MAX_MAP_DAYS }} />
						</FormFeedback>
					</FormGroup>
				}
			</div >
			<MapChartSelectComponent key='chart' />
		</div >
	);
}
	
const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};

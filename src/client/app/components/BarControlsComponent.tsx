/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { FormFeedback, FormGroup, Input, Label } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectBarStacking, selectBarWidthDays } from '../redux/slices/graphSlice';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns controls for the Options Ui page.
 */
export default function BarControlsComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();

	// The min/max days allowed for user selection
	const MIN_BAR_DAYS = 1;
	const MAX_BAR_DAYS = 366;
	// Special value if custom input for standard menu.
	const CUSTOM_INPUT = '-99';

	// This is the current bar interval for graphic.
	const barDuration = useAppSelector(selectBarWidthDays);
	const barStacking = useAppSelector(selectBarStacking);
	// Holds the value of standard bar duration choices used so decoupled from custom.
	const [barDays, setBarDays] = React.useState<string>(barDuration.asDays().toString());
	// Holds the value during custom bar duration input so only update graphic when done entering and
	// separate from standard choices.
	const [barDaysCustom, setBarDaysCustom] = React.useState<number>(barDuration.asDays());
	// True if custom bar duration input is active.
	const [showCustomBarDuration, setShowCustomBarDuration] = React.useState<boolean>(false);

	const handleChangeBarStacking = () => {
		dispatch(graphSlice.actions.changeBarStacking());
	};

	// Keeps react-level state, and redux state in sync.
	// Two different layers in state may differ especially when externally updated (chart link, history buttons.)
	React.useEffect(() => {
		// Assume value is valid  since it is coming from state.
		// Do not allow bad values in state.
		const isCustom = !(['1', '7', '28'].find(days => days == barDuration.asDays().toString()));
		setShowCustomBarDuration(isCustom);
		setBarDaysCustom(barDuration.asDays());
		setBarDays(isCustom ? CUSTOM_INPUT : barDuration.asDays().toString());
	}, [barDuration]);

	// Returns true if this is a valid bar duration.
	const barDaysValid = (barDays: number) => {
		return Number.isInteger(barDays) && barDays >= MIN_BAR_DAYS && barDays <= MAX_BAR_DAYS;
	};

	// Updates values when the standard bar duration menu is used.
	const handleBarDaysChange = (value: string) => {
		if (value === CUSTOM_INPUT) {
			// Set menu value for standard bar to special value to show custom
			// and show the custom input area.
			setBarDays(CUSTOM_INPUT);
			setShowCustomBarDuration(true);
		} else {
			// Set the standard menu value, hide the custom bar duration input
			//  and bar duration for graphing.
			// Since controlled values know it is a valid integer.
			setShowCustomBarDuration(false);
			updateBarDurationChange(Number(value));
		}
	};

	// Updates value when the custom bar duration input is used.
	const handleCustomBarDaysChange = (value: number) => {
		setBarDaysCustom(value);
	};

	const handleEnter = (key: string) => {
		// This detects the enter key and then uses the previously entered custom
		// bar duration to set the bar duration for the graphic.
		if (key == 'Enter') {
			updateBarDurationChange(barDaysCustom);
		}
	};

	const updateBarDurationChange = (value: number) => {
		// Update if okay value. May not be okay if this came from user entry in custom form.
		if (barDaysValid(value)) {
			dispatch(graphSlice.actions.updateBarDuration(moment.duration(value, 'days')));
		}
	};

	return (
		<div>
			<div className='checkbox'>
				<input type='checkbox' style={{ marginRight: '10px' }} onChange={handleChangeBarStacking} checked={barStacking} id='barStacking' />
				<label htmlFor='barStacking'>{translate('bar.stacking')}</label>
				<TooltipMarkerComponent page='home' helpTextId='help.home.bar.stacking.tip' />
			</div>
			<div style={divTopBottomPadding}>
				<p style={labelStyle}>
					{translate('bar.interval')}:
					<TooltipMarkerComponent page='home' helpTextId='help.home.bar.days.tip' />
				</p>
				<Input
					id='barDurationDays'
					name='barDurationDays'
					type='select'
					value={barDays}
					onChange={e => handleBarDaysChange(e.target.value)}
				>
					<option value='1'>{translate('day')}</option>
					<option value='7'>{translate('week')}</option>
					<option value='28'>{translate('4.weeks')}</option>
					<option value={CUSTOM_INPUT}>{translate('custom.value')}</option>
				</Input>
				{/* This has a little more spacing at bottom than optimal. */}
				{showCustomBarDuration &&
					<FormGroup>
						<Label for='barDays'>{translate('bar.days.enter')}:</Label>
						<Input id='barDays' name='barDays' type='number'
							onChange={e => handleCustomBarDaysChange(Number(e.target.value))}
							// This grabs each key hit and then finishes input when hit enter.
							onKeyDown={e => { handleEnter(e.key); }}
							step='1'
							min={MIN_BAR_DAYS}
							max={MAX_BAR_DAYS}
							value={barDaysCustom}
							invalid={!barDaysValid(barDaysCustom)} />
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: MIN_BAR_DAYS, max: MAX_BAR_DAYS }} />
						</FormFeedback>
					</FormGroup>
				}
			</div >
		</div >
	);
}

const divTopBottomPadding: React.CSSProperties = {
	paddingTop: '15px',
	paddingBottom: '15px'
};

const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};

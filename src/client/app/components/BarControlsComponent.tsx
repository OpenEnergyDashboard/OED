/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, FormFeedback, FormGroup, Input, Label } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectBarStacking, selectBarWidthDays } from '../redux/slices/graphSlice';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns controls for the Options Ui page.
 */
export default function BarControlsComponent() {
	// The min/max days allowed for user selection
	const minBarDays = 1;
	const maxBarDays = 366;

	const dispatch = useAppDispatch();
	// This is the current bar interval for graphic.
	const barDuration = useAppSelector(selectBarWidthDays);
	const barStacking = useAppSelector(selectBarStacking);
	// Holds the value during input so only update graphic when done entering.
	const [barDays, setBarDays] = React.useState<number>(barDuration.asDays());

	const barDaysValid = (barDays: number) => {
		return Number.isInteger(barDays) && barDays >= minBarDays && barDays <= maxBarDays;
	};

	const handleChangeBarStacking = () => {
		dispatch(graphSlice.actions.changeBarStacking());
	};

	const handleBarDaysChange = (value: number) => {
		setBarDays(value);
	};

	const handleEnter = (key: string) => {
		// This detects the enter key and then uses the previously entered bar days
		// to set the bar duration for the graphic.
		if (key == 'Enter') {
			updateBarDurationChange(barDays);
		}
	}

	const updateBarDurationChange = (value: number) => {
		// Update if okay value. May not be okay if this came from user entry in form.
		if (barDaysValid(value)) {
			dispatch(graphSlice.actions.updateBarDuration(moment.duration(value, 'days')));
			// Set user entry field to same value so if change came from button choices then same.
			setBarDays(value);
		}
	};

	const barDurationDays = barDuration.asDays();

	return (
		<div>
			<div className='checkbox'>
				<input type='checkbox' style={{ marginRight: '10px' }} onChange={handleChangeBarStacking} checked={barStacking} id='barStacking' />
				<label htmlFor='barStacking'>{translate('bar.stacking')}</label>
				<TooltipMarkerComponent page='home' helpTextId='help.home.bar.stacking.tip' />
			</div>
			<div style={divTopPadding}>
				<p style={labelStyle}>
					{translate('bar.interval')}:
					<TooltipMarkerComponent page='home' helpTextId='help.home.bar.days.tip' />
				</p>
				{/* Indent to left so all items stand out under label. */}
				<div style={divLeftBottomPadding}>
					<ButtonGroup style={zIndexFix}>
						{/* If the user enter a different value then 1, 7 0r 28 then no button highlighted. */}
						<Button outline={barDurationDays !== 1} onClick={() => { updateBarDurationChange(1); }}> {translate('day')} </Button>
						<Button outline={barDurationDays !== 7} onClick={() => { updateBarDurationChange(7); }}> {translate('week')} </Button>
						<Button outline={barDurationDays !== 28} onClick={() => { updateBarDurationChange(28); }}> {translate('4.weeks')} </Button>
					</ButtonGroup>
					<div>
						{translate('or')}
					</div>
					<div>
						<FormGroup>
							<Label for='barDays'>{translate('bar.days.enter')}:</Label>
							<Input id='barDays' name='barDays' type='number'
								onChange={e => handleBarDaysChange(Number(e.target.value))}
								// This grabs each key hit and then finishes input when hit enter.
								onKeyDown={e => {handleEnter(e.key);}}
								step='1'
								min={minBarDays}
								max={maxBarDays}
								value={barDays}
								invalid={!barDaysValid(barDays)} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: minBarDays, max: maxBarDays }} />
							</FormFeedback>
						</FormGroup>
					</div>
				</div>
			</div>
		</div>
	);
}

const divTopPadding: React.CSSProperties = {
	paddingTop: '15px'
};

const divLeftBottomPadding: React.CSSProperties = {
	paddingLeft: 15,
	paddingBottom: 20
};

const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};

const zIndexFix: React.CSSProperties = {
	zIndex: 0
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { FormFeedback, FormGroup, Input, Label } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectThreeDNumDays } from '../redux/slices/graphSlice';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { labelStyle, divTopBottomPadding } from '../styles/modalStyle';
import { MAX_3D_DAYS, DEFAULT_3D_DAYS, getEffectiveNumDays } from '../utils/dateRangeCompatibility';

/**
 * Standard numDays options for 3D graphics
 */
export enum ThreeDNumDays {
	OneMonth = 30,
	SixMonths = 180,
	OneYear = 365,
	TwoYears = 730,
	Max = MAX_3D_DAYS,
	Custom = -99 // Special value to indicate custom input
}

/**
 * @returns Interval controls for the 3D page (numDays dropdown)
 */
export default function ThreeDIntervalControlsComponent() {
	const dispatch = useAppDispatch();
	const translate = useTranslate();

	// The min/max days allowed for user selection
	const MIN_DAYS = 1;
	const MAX_DAYS = MAX_3D_DAYS;
	// Special value if custom input for standard menu.
	const CUSTOM_INPUT = ThreeDNumDays.Custom.toString();

	// Get current numDays from Redux state
	const numDaysRedux = useAppSelector(selectThreeDNumDays);
	const effectiveNumDays = getEffectiveNumDays(numDaysRedux);

	// Holds the value of standard numDays choices, decoupled from custom.
	const [numDays, setNumDays] = React.useState<string>(effectiveNumDays.toString());
	// Holds the value during custom numDays input, so only update graphic when done entering.
	const [numDaysCustom, setNumDaysCustom] = React.useState<number>(effectiveNumDays);
	// True if custom numDays input is active.
	const [showCustomNumDays, setShowCustomNumDays] = React.useState<boolean>(false);
	// Define a flag to track if custom input is actively being used
	const [isCustomInput, setIsCustomInput] = React.useState<boolean>(false);

	// Keeps react-level state, and redux state in sync.
	// Two different layers in state may differ especially when externally updated (chart link, history buttons.)
	React.useEffect(() => {
		// If user is in custom input mode, don't reset to standard options
		if (!isCustomInput) {
			const standardValues = Object.values(ThreeDNumDays)
				.filter(v => typeof v === 'number' && v > 0) as number[];
			const isCustom = !standardValues.includes(effectiveNumDays);
			setShowCustomNumDays(isCustom);
			setNumDaysCustom(effectiveNumDays);
			setNumDays(isCustom ? CUSTOM_INPUT : effectiveNumDays.toString());
		}
	}, [numDaysRedux, effectiveNumDays, isCustomInput]);

	// Returns true if this is a valid numDays.
	const numDaysValid = (days: number): boolean => {
		return Number.isInteger(days) && days >= MIN_DAYS && days <= MAX_DAYS;
	};

	// Updates values when the standard numDays menu is used.
	const handleNumDaysChange = (value: string) => {
		setIsCustomInput(false);
		if (value === CUSTOM_INPUT) {
			// Set menu value from standard value to special value to show custom
			// and show the custom input area.
			setShowCustomNumDays(true);
			setNumDays(CUSTOM_INPUT);
		} else {
			// Set the standard menu value, hide the custom numDays input
			// and numDays for graphing.
			// Since controlled values know it is a valid integer.
			setShowCustomNumDays(false);
			updateNumDaysChange(Number(value));
		}
	};

	// Updates value when the custom numDays input is used.
	const handleCustomNumDaysChange = (value: number) => {
		setIsCustomInput(true);
		setNumDaysCustom(value);
	};

	const handleEnter = (key: string) => {
		// This detects the enter key and then uses the previously entered custom
		// numDays to set the numDays for the graphic.
		if (key === 'Enter') {
			updateNumDaysChange(numDaysCustom);
		}
	};

	const updateNumDaysChange = (value: number) => {
		// Update if okay value. May not be okay if this came from user entry in custom form.
		if (numDaysValid(value)) {
			dispatch(graphSlice.actions.updateThreeDNumDays(value));
		}
	};

	const numDaysTranslations: Record<keyof typeof ThreeDNumDays, string> = {
		OneMonth: '1.month',
		SixMonths: '6.months',
		OneYear: '1.year',
		TwoYears: '2.years',
		Max: 'max',
		Custom: 'custom.value'
	};

	// Helper function to get display label for a value
	const getLabelForValue = (value: number): string => {
		if (value === ThreeDNumDays.OneMonth) return translate(numDaysTranslations.OneMonth);
		if (value === ThreeDNumDays.SixMonths) return translate(numDaysTranslations.SixMonths);
		if (value === ThreeDNumDays.OneYear) return translate(numDaysTranslations.OneYear);
		if (value === ThreeDNumDays.TwoYears) return translate(numDaysTranslations.TwoYears);
		if (value === ThreeDNumDays.Max) return translate(numDaysTranslations.Max);
		return value.toString();
	};

	return (
		<div>
			<div style={divTopBottomPadding}>
				<p style={labelStyle}>
					{translate('threeD.numDays')}:
					<TooltipMarkerComponent page='home' helpTextId='help.home.threeD.numDays.tip' />
				</p>
				<Input
					id='threeDNumDays'
					name='threeDNumDays'
					type='select'
					value={numDays}
					onChange={e => handleNumDaysChange(e.target.value)}
				>
					<option value={ThreeDNumDays.OneMonth.toString()}>
						{translate(numDaysTranslations.OneMonth)}
					</option>
					<option value={ThreeDNumDays.SixMonths.toString()}>
						{translate(numDaysTranslations.SixMonths)}
					</option>
					<option value={ThreeDNumDays.OneYear.toString()}>
						{translate(numDaysTranslations.OneYear)}
					</option>
					<option value={ThreeDNumDays.TwoYears.toString()}>
						{translate(numDaysTranslations.TwoYears)}
					</option>
					<option value={ThreeDNumDays.Max.toString()}>
						{translate(numDaysTranslations.Max)}
					</option>
					<option value={CUSTOM_INPUT}>
						{translate(numDaysTranslations.Custom)}
					</option>
				</Input>
				{showCustomNumDays && (
					<FormGroup>
						<Label for='threeDCustomDays'>{translate('days.enter')}:</Label>
						<Input
							id='threeDCustomDays'
							name='threeDCustomDays'
							type='number'
							onChange={e => handleCustomNumDaysChange(Number(e.target.value))}
							// This grabs each key hit and then finishes input when hit enter.
							onKeyDown={e => handleEnter(e.key)}
							step='1'
							min={MIN_DAYS}
							max={MAX_DAYS}
							value={numDaysCustom}
							invalid={!numDaysValid(numDaysCustom)}
						/>
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: MIN_DAYS, max: MAX_DAYS }} />
						</FormFeedback>
					</FormGroup>
				)}
			</div>
		</div>
	);
}


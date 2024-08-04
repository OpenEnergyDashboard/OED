/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { FormFeedback, FormGroup, Input, Label, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import {
	selectChartToRender, graphSlice,
	selectBarStacking, selectWidthDays,
	selectComparePeriod, selectSortingOrder
} from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import { ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import translate from '../utils/translate';
import MapChartSelectComponent from './MapChartSelectComponent';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns controls for the bar, map, and compare pages
 */
export default function IntervalControlsComponent() {
	const dispatch = useAppDispatch();
	const chartType = useAppSelector(selectChartToRender);

	// The min/max days allowed for user selection
	const MIN_DAYS = 1;
	const MAX_DAYS = 366;
	// Special value if custom input for standard menu.
	const CUSTOM_INPUT = '-99';

	// This is the current interval for the bar and map graphics.
	const duration = useAppSelector(selectWidthDays);
	const barStacking = chartType === ChartTypes.bar ? useAppSelector(selectBarStacking) : undefined;
	// This is the current compare period for graphic
	const comparePeriod = chartType === ChartTypes.compare ? useAppSelector(selectComparePeriod) : undefined;
	// This is the current sorting order for graphic
	const compareSortingOrder = chartType === ChartTypes.compare ? useAppSelector(selectSortingOrder) : undefined;

	// Holds the value of standard duration choices used for bar and map, decoupled from custom.
	const [days, setDays] = React.useState<string>(duration.asDays().toString());
	// Holds the value during custom duration input for bar and map, so only update graphic
	// when done entering and separate from standard choices.
	const [daysCustom, setDaysCustom] = React.useState<number>(duration.asDays());
	// True if custom duration input for bar or map is active.
	const [showCustomDuration, setShowCustomDuration] = React.useState<boolean>(false);
	// State to manage the dropdown open status for compare period.
	const [comparePeriodDropdownOpen, setComparePeriodDropdownOpen] = React.useState<boolean>(false);
	// State to manage the dropdown open status for sorting order.
	const [compareSortingDropdownOpen, setCompareSortingDropdownOpen] = React.useState<boolean>(false);

	const handleChangeBarStacking = () => {
		if (chartType === ChartTypes.bar) {
			dispatch(graphSlice.actions.changeBarStacking());
		}
	};

	// Keeps react-level state, and redux state in sync.
	// Two different layers in state may differ especially when externally updated (chart link, history buttons.)
	React.useEffect(() => {
		// Assume value is valid since it is coming from state.
		// Do not allow bad values in state.
		const isCustom = !(['1', '7', '28'].find(days => days == duration.asDays().toString()));
		setShowCustomDuration(isCustom);
		setDaysCustom(duration.asDays());
		setDays(isCustom ? CUSTOM_INPUT : duration.asDays().toString());
	}, [duration]);

	// Returns true if this is a valid duration for bar and map.
	const daysValid = (days: number) => {
		return Number.isInteger(days) && days >= MIN_DAYS && days <= MAX_DAYS;
	};

	// Updates values when the standard duration menu for bar or map is used.
	const handleDaysChange = (value: string) => {
		if (value === CUSTOM_INPUT) {
			// Set menu value from standard value to special value to show custom
			// and show the custom input area.
			setDays(CUSTOM_INPUT);
			setShowCustomDuration(true);
		} else {
			// Set the standard menu value, hide the custom duration input
			// and duration for graphing.
			// Since controlled values know it is a valid integer.
			setShowCustomDuration(false);
			updateDurationChange(Number(value));
		}
	};

	// Updates value when the custom duration input is used for bar or map.
	const handleCustomDaysChange = (value: number) => {
		setDaysCustom(value);
	};

	const handleEnter = (key: string) => {
		// This detects the enter key and then uses the previously entered custom
		// duration to set the duration for the graphic.
		if (key === 'Enter') {
			updateDurationChange(daysCustom);
		}
	};

	const updateDurationChange = (value: number) => {
		// Update if okay value. May not be okay if this came from user entry in custom form.
		if (daysValid(value)) {
			dispatch(graphSlice.actions.updateDuration(moment.duration(value, 'days')));
		}
	};

	// Updates values when the compare period menu is used.
	const handleCompare = (comparePeriod: ComparePeriod) => {
		if (chartType === ChartTypes.compare) {
			dispatch(graphSlice.actions.updateComparePeriod({ comparePeriod, currentTime: moment() }));
		}
	};

	// Updates sorting order when the sort order menu is used.
	const handleSorting = (sortingOrder: SortingOrder) => {
		if (chartType === ChartTypes.compare) {
			dispatch(graphSlice.actions.changeCompareSortingOrder(sortingOrder));
		}
	};

	// Updates the text in the compare period dropdown menu when switching between periods.
	const getComparePeriodDisplayText = () => {
		switch (comparePeriod) {
			case ComparePeriod.Day:
				return translate('day');
			case ComparePeriod.Week:
				return translate('week');
			case ComparePeriod.FourWeeks:
				return translate('4.weeks');
			default:
				return '';
		}
	};

	// Updates the text in the sort dropdown menu when switching between sorting types.
	const getSortDisplayText = () => {
		switch (compareSortingOrder) {
			case SortingOrder.Alphabetical:
				return translate('alphabetically');
			case SortingOrder.Ascending:
				return translate('ascending');
			case SortingOrder.Descending:
				return translate('descending');
			default:
				return '';
		}
	};

	return (
		<div>
			{chartType === ChartTypes.bar && (
				<div className='checkbox'>
					<input type='checkbox' style={{ marginRight: '10px' }} onChange={handleChangeBarStacking} checked={barStacking} id='barStacking' />
					<label htmlFor='barStacking'>{translate('bar.stacking')}</label>
					<TooltipMarkerComponent page='home' helpTextId='help.home.bar.stacking.tip' />
				</div>
			)}
			{(chartType === ChartTypes.bar || chartType === ChartTypes.map) && (
				<div style={divTopBottomPadding}>
					<p style={labelStyle}>
						{chartType === ChartTypes.bar ? translate('bar.interval') : translate('map.interval')}:
						<TooltipMarkerComponent page='home' helpTextId={chartType === ChartTypes.bar ? 'help.home.bar.days.tip' : 'help.home.map.days.tip'} />
					</p>
					<Input
						id='durationDays'
						name='durationDays'
						type='select'
						value={days}
						onChange={e => handleDaysChange(e.target.value)}
					>
						<option value='1'>{translate('day')}</option>
						<option value='7'>{translate('week')}</option>
						<option value='28'>{translate('4.weeks')}</option>
						<option value={CUSTOM_INPUT}>{translate('custom.value')}</option>
					</Input>
					{/* This has a little more spacing at bottom than optimal. */}
					{showCustomDuration &&
						<FormGroup>
							<Label for='days'>{translate('bar.days.enter')}:</Label>
							<Input id='days' name='days' type='number'
								onChange={e => handleCustomDaysChange(Number(e.target.value))}
								// This grabs each key hit and then finishes input when hit enter.
								onKeyDown={e => { handleEnter(e.key); }}
								step='1'
								min={MIN_DAYS}
								max={MAX_DAYS}
								value={daysCustom}
								invalid={!daysValid(daysCustom)} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: MIN_DAYS, max: MAX_DAYS }} />
							</FormFeedback>
						</FormGroup>
					}
				</div>
			)}
			{chartType === ChartTypes.map && <MapChartSelectComponent key='chart' />}
			{chartType === ChartTypes.compare && (
				<>
					<div style={divTopBottomPadding}>
						<p style={labelStyle}>
							{translate('compare.period')}:
							<TooltipMarkerComponent page='home' helpTextId='help.home.compare.period.tip' />
						</p>
						<Dropdown isOpen={comparePeriodDropdownOpen} toggle={() => setComparePeriodDropdownOpen(current => !current)}>
							<DropdownToggle caret style={dropdownToggleStyle}>
								{getComparePeriodDisplayText()}
							</DropdownToggle>
							<DropdownMenu>
								<DropdownItem
									active={comparePeriod === ComparePeriod.Day}
									onClick={() => handleCompare(ComparePeriod.Day)}
								>
									{translate('day')}
								</DropdownItem>
								<DropdownItem
									active={comparePeriod === ComparePeriod.Week}
									onClick={() => handleCompare(ComparePeriod.Week)}
								>
									{translate('week')}
								</DropdownItem>
								<DropdownItem
									active={comparePeriod === ComparePeriod.FourWeeks}
									onClick={() => handleCompare(ComparePeriod.FourWeeks)}
								>
									{translate('4.weeks')}
								</DropdownItem>
								{/* TODO: Add custom option. Compare is currently not ready for this. */}
							</DropdownMenu>
						</Dropdown>
					</div>
					<div style={{ ...divTopBottomPadding, paddingTop: '0px' }}>
						<p style={labelStyle}>
							{translate('sort')}:
							<TooltipMarkerComponent page='home' helpTextId='help.home.compare.sort.tip' />
						</p>
						<Dropdown isOpen={compareSortingDropdownOpen} toggle={() => setCompareSortingDropdownOpen(current => !current)}>
							<DropdownToggle caret style={dropdownToggleStyle}>
								{getSortDisplayText()}
							</DropdownToggle>
							<DropdownMenu>
								<DropdownItem
									active={compareSortingOrder === SortingOrder.Alphabetical}
									onClick={() => handleSorting(SortingOrder.Alphabetical)}
								>
									{translate('alphabetically')}
								</DropdownItem>
								<DropdownItem
									active={compareSortingOrder === SortingOrder.Ascending}
									onClick={() => handleSorting(SortingOrder.Ascending)}
								>
									{translate('ascending')}
								</DropdownItem>
								<DropdownItem
									active={compareSortingOrder === SortingOrder.Descending}
									onClick={() => handleSorting(SortingOrder.Descending)}
								>
									{translate('descending')}
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</div>
				</>
			)}
		</div>
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

const dropdownToggleStyle: React.CSSProperties = {
	backgroundColor: '#ffffff',
	color: '#000000',
	border: '1px solid #ced4da',
	boxShadow: 'none'
};

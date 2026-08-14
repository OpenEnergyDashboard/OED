/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { daysApi, stableEmptyDays } from '../../redux/api/daysApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectSelectedLanguage } from '../../redux/slices/appStateSlice';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateDayModalComponent from './CreateDayModalComponent';
import DayViewComponent from './DayViewComponent';

/**
 * Defines the daily pattern info page
 * @returns Single day element
 */
export default function DaysDetailComponent() {
	const locale = useAppSelector(selectSelectedLanguage);

	// Day state
	const { data: dayState = stableEmptyDays } = daysApi.useGetDaysQuery();

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipDayView: 'help.admin.dayview'
	};

	const sortedDays = React.useMemo(() => {
		return Object.values(dayState)
			.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase(), locale, { sensitivity: 'accent' }));
	}, [dayState, locale]);

	return (
		<div className='flexGrowOne'>
			<div>
				<TooltipHelpComponent page='days' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='days' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='days' helpTextId={tooltipStyle.tooltipDayView} />
						</div>
					</h2>
					<div className="edit-btn">
						{/* Placeholder for create day modal */}
						<CreateDayModalComponent />
					</div>
					<div className="card-container">
						{sortedDays
							.map(day => (
								<DayViewComponent key={day.id} day={day} />
							))}
					</div>
				</div>
			</div>
		</div>
	);
}

/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { weeksApi } from '../../redux/api/weeksApi';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateWeekModalComponent from './CreateWeekModalComponent';
import WeekViewComponent from './WeekViewComponent';

/**
 * Defines the weekly patterns page
 * @returns Weekly patterns page element
 */
export default function WeeksDetailComponent() {

	const { data: weeks } = weeksApi.useGetWeeksQuery();

	// Sort weeks by week name
	const sortedWeeks = React.useMemo(() => {
		if (!weeks) {
			return [];
		}
		return [...weeks].sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
	}, [weeks]);

	return (
		<div className="flexGrowOne">
			<TooltipHelpComponent page="weeks" />
			<div className="container-fluid">
				<h2 style={titleStyle}>
					<FormattedMessage id="weeks" />
					<div style={tooltipBaseStyle}>
						<TooltipMarkerComponent page="weeks" helpTextId="help.admin.weekview" />
					</div>
				</h2>
				<div className="edit-btn">
					<CreateWeekModalComponent />
				</div>
				<div className="card-container">
					{sortedWeeks?.map(week => <WeekViewComponent week={week} key={week.id} />)}
				</div>
			</div>
		</div>
	);
}

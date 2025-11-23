import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectSelectedLanguage } from '../../redux/slices/appStateSlice';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';
import { Day } from '../../types/redux/days';
import SpinnerComponent from '../SpinnerComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import DayViewComponent from './DayViewComponent';

/**
 * Hardcoded day data for demonstration.
 */
const hardcodedDays: Day[] = [
	{
		id: 1,
		dayName: 'Weekday',
		note: 'Standard weekday pattern',
		segments: [
			{ id: '1-1', dayId: '1', hour: 0, slope: 0.5, intercept: 1, note: 'Midnight to morning' },
			{ id: '1-2', dayId: '1', hour: 8, slope: 0.7, intercept: 1.2, note: 'Morning to evening' },
			{ id: '1-3', dayId: '1', hour: 18, slope: 0.4, intercept: 0.8, note: 'Evening to midnight' }
		]
	},
	{
		id: 2,
		dayName: 'Weekend',
		note: 'Weekend pattern',
		segments: [
			{ id: '2-1', dayId: '2', hour: 0, slope: 0.3, intercept: 0.9, note: 'All day' }
		]
	}
];

/**
 * Defines the daily pattern info page
 * @param props defined above
 * @returns Single day element
 */
export default function DayDetailComponent() {
	const locale = useAppSelector(selectSelectedLanguage);

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipDayView: 'help.admin.dailypatternview'
	};

	// Simulate loading state if needed
	const [loading] = React.useState(false);

	return (
		<div className='flexGrowOne'>
			{loading ? (
				<div className='text-center'>
					<SpinnerComponent loading width={50} height={50} />
					<FormattedMessage id='redo.cik.and.refresh.db.views' />
				</div>
			) : (
				<div>
					<TooltipHelpComponent page='daily.patterns' />

					<div className='container-fluid'>
						<h2 style={titleStyle}>
							<FormattedMessage id='daily.patterns' />
							<div style={tooltipStyle}>
								<TooltipMarkerComponent page='daily.patterns' helpTextId={tooltipStyle.tooltipDayView} />
							</div>
						</h2>
						<div className="edit-btn">
							{/* Placeholder for create day modal */}
							<Button color='secondary'>
								<FormattedMessage id="daily.patterns.create" />
							</Button>
						</div>
						<div className="card-container">
							{hardcodedDays
								.sort((a, b) => (a.dayName || '').toLowerCase().localeCompare((b.dayName || '').toLowerCase(), locale, { sensitivity: 'accent' }))
								.map(day => (
									<DayViewComponent key={day.id} day={day} />
								))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

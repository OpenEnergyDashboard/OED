/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import ExportComponent from '../components/ExportComponent';
import { useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender, selectSelectedGroups, selectSelectedMeters } from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import AreaUnitSelectComponent from './AreaUnitSelectComponent';
import ChartDataSelectComponent from './ChartDataSelectComponent';
import ChartLinkComponent from './ChartLinkComponent';
import ChartSelectComponent from './ChartSelectComponent';
import DateRangeComponent from './DateRangeComponent';
import ErrorBarComponent from './ErrorBarComponent';
import GraphicRateMenuComponent from './GraphicRateMenuComponent';
import IntervalControlsComponent from './IntervalControlsComponent';
import ReadingsPerDaySelectComponent from './ReadingsPerDaySelectComponent';

/**
 * @returns the UI Control panel
 */
export default function UIOptionsComponent() {
	const chartToRender = useAppSelector(selectChartToRender);
	const selectedMeters = useAppSelector(selectSelectedMeters);
	const selectedGroups = useAppSelector(selectSelectedGroups);
	const optionsRef = React.useRef<HTMLDivElement>(null);

	const resizeHandler = () => {
		const headFootHeight = document.querySelector('#header')!.clientHeight + document.querySelector('#footer')!.clientHeight + 50;
		// Total window - Header and footer height = dashboard height
		const maxOptionsHeight = window.innerHeight - headFootHeight;

		// May be null for initial render(s)
		if (optionsRef.current) {
			const scrollHeight = optionsRef.current.scrollHeight;
			// When options are greater in height than window real-estate, set max height & overflow properties
			if (scrollHeight >= maxOptionsHeight) {
				optionsRef.current.style.maxHeight = `${maxOptionsHeight}px`;
				optionsRef.current.style.overflowY = 'scroll';
			} else {
				// Clear constraints when enough space.
				optionsRef.current.style.maxHeight = 'none';
				optionsRef.current.style.overflowY = 'visible';
			}
		}
	};
	// Effect(s) Manipulates UI Options max height. To allow for dynamic window sizing to work.
	React.useEffect(() => {
		resizeHandler();
		window.addEventListener('resize', resizeHandler);
		return () => window.removeEventListener('resize', resizeHandler);
	}, []);
	React.useEffect(() => { resizeHandler(); }, [selectedMeters, selectedGroups]);

	ReactTooltip.rebuild();
	return (
		<div
			className='customScrollBar'
			style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingRight: '10px' }} ref={optionsRef}>
			<ReactTooltip event='custom-event' className='tip' id='select-tooltips' />
			<ChartSelectComponent />
			<ChartDataSelectComponent />
			<GraphicRateMenuComponent />
			{chartToRender === ChartTypes.threeD && <ReadingsPerDaySelectComponent />}
			<DateRangeComponent />
			<AreaUnitSelectComponent />
			{ /* Controls error bar, specifically for the line chart. */
				chartToRender === ChartTypes.line && <ErrorBarComponent />}

			{	/* Controls specific to the bar chart. */
				chartToRender === ChartTypes.bar && <IntervalControlsComponent />}

			{	/* Controls specific to the compare chart */
				chartToRender === ChartTypes.compare && <IntervalControlsComponent />}

			{	/* Controls specific to the compare chart */
				chartToRender === ChartTypes.map && <IntervalControlsComponent />}

			{ /* We can't export compare, map, radar or 3D data */
				chartToRender !== ChartTypes.compare &&
				chartToRender !== ChartTypes.map &&
				chartToRender !== ChartTypes.threeD &&
				chartToRender !== ChartTypes.radar && <ExportComponent />
			}
			<ChartLinkComponent />
		</div>
	);
}

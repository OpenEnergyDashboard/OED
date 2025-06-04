/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import { useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender, selectSelectedGroups, selectSelectedMeters } from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import BarControlsComponent from './BarControlsComponent';
import ChartDataSelectComponent from './ChartDataSelectComponent';
import ChartSelectComponent from './ChartSelectComponent';
import CompareControlsComponent from './CompareControlsComponent';
import DateRangeComponent from './DateRangeComponent';
import MapControlsComponent from './MapControlsComponent';
import ReadingsPerDaySelectComponent from './ReadingsPerDaySelectComponent';
import MoreOptionsComponent from './MoreOptionsComponent';
import CompareLineControlsComponent from './CompareLineControlsComponent';

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

			{/* UI options for line graphic */}
			{chartToRender == ChartTypes.line}

			{/* UI options for bar graphic */}
			{chartToRender == ChartTypes.bar && <BarControlsComponent />}

			{/* UI options for compare graphic */}
			{chartToRender == ChartTypes.compare && <CompareControlsComponent />}

			{/* UI options for map graphic */}
			{chartToRender == ChartTypes.map && <MapControlsComponent />}

			{/* UI options for 3D graphic */}
			{chartToRender == ChartTypes.threeD && <ReadingsPerDaySelectComponent />}
			{chartToRender == ChartTypes.threeD && <DateRangeComponent />}

			{/* UI options for radar graphic */}
			{chartToRender == ChartTypes.radar}

			{	/* Controls specific to the compare line chart */}
			{chartToRender === ChartTypes.compareLine && <DateRangeComponent />}
			{chartToRender === ChartTypes.compareLine && <CompareLineControlsComponent />}

			<MoreOptionsComponent />

		</div>
	);
}

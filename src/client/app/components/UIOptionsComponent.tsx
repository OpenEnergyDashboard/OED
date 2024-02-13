/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import ExportComponent from '../components/ExportComponent';
import ChartLinkContainer from '../containers/ChartLinkContainer';
import { selectChartToRender } from '../redux/slices/graphSlice';
import { useAppSelector } from '../redux/reduxHooks';
import { ChartTypes } from '../types/redux/graph';
import AreaUnitSelectComponent from './AreaUnitSelectComponent';
import BarControlsComponent from './BarControlsComponent';
import ChartSelectComponent from './ChartSelectComponent';
import CompareControlsComponent from './CompareControlsComponent';
import DateRangeComponent from './DateRangeComponent';
import ErrorBarComponent from './ErrorBarComponent';
import GraphicRateMenuComponent from './GraphicRateMenuComponent';
import MapControlsComponent from './MapControlsComponent';
import ThreeDSelectComponent from './ReadingsPerDaySelectComponent';
import ChartDataSelectComponent from './ChartDataSelectComponent';


/**
 * @returns the Ui Control panel
 */
export default function UIOptionsComponent() {
	const chartToRender = useAppSelector(selectChartToRender);
	const optionsRef = React.useRef<HTMLDivElement>(null);

	// Effect Manipulates Ui Options max height. To allow for dynamic window sizing to work.
	React.useEffect(() => {
		const headFootHeight = document.querySelector('#header')!.clientHeight + document.querySelector('#footer')!.clientHeight + 50
		const resizeHandler = () => {
			// Total window - Header and footer height = dashboard height
			const maxOptionsHeight = window.innerHeight - headFootHeight

			// May be null for initial render(s)
			if (optionsRef.current) {
				const scrollHeight = optionsRef.current.scrollHeight
				// When options are greater in height  than window real-estate, set max height & overflow properties
				if (scrollHeight >= maxOptionsHeight) {
					optionsRef.current.style.maxHeight = `${maxOptionsHeight}px`
					optionsRef.current.style.overflow = 'scroll'
				} else {
					// Clear constraints when enough space. ()
					optionsRef.current.style.maxHeight = 'none'
					optionsRef.current.style.overflow = 'visible'
				}
			}
		}
		resizeHandler()
		window.addEventListener('resize', resizeHandler)
		return () => window.removeEventListener('resize', resizeHandler)
	}, [])

	ReactTooltip.rebuild();
	return (
		<div className='no_scrollbar' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'scroll' }} ref={optionsRef}>
			<ChartSelectComponent />
			<ChartDataSelectComponent />
			<GraphicRateMenuComponent />
			<ThreeDSelectComponent />
			<DateRangeComponent />
			<AreaUnitSelectComponent />
			{ /* Controls error bar, specifically for the line chart. */
				chartToRender === ChartTypes.line && <ErrorBarComponent />}

			{	/* Controls specific to the bar chart. */
				chartToRender === ChartTypes.bar && <BarControlsComponent />}

			{	/* Controls specific to the compare chart */
				chartToRender === ChartTypes.compare && <CompareControlsComponent />}

			{	/* Controls specific to the compare chart */
				chartToRender === ChartTypes.map && <MapControlsComponent />}

			{ /* We can't export compare, map, radar or 3D data */
				chartToRender !== ChartTypes.compare &&
				chartToRender !== ChartTypes.map &&
				chartToRender !== ChartTypes.threeD &&
				chartToRender !== ChartTypes.radar && <ExportComponent />
			}
			<ChartLinkContainer />
		</div>
	);
}

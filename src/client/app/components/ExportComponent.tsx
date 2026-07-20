/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender } from '../redux/slices/graphSlice';
import { exportGraphReadingsThunk, exportRawReadings } from '../redux/thunks/exportThunk';
import { ChartTypes } from '../types/redux/graph';
import TooltipMarkerComponent from './TooltipMarkerComponent';
/**
 * Creates export buttons and does code for handling export to CSV files.
 * @returns HTML for export buttons
 */
export default function ExportComponent() {
	const dispatch = useAppDispatch();
	const chartToRender = useAppSelector(selectChartToRender);

	return (
		<>
			{
				<div>
					{/* will not dispatch if data in flight */}
					<Button color='secondary' outline onClick={() => dispatch(exportGraphReadingsThunk())}>
						<FormattedMessage id='export.graph.data' />
					</Button>
					<TooltipMarkerComponent page='home' helpTextId='help.home.export.graph.data' />
				</div>
			}
			{
				/* Only raw export if a line graph */
				chartToRender === ChartTypes.line &&
				<div style={{ paddingTop: '10px' }}>
					<Button color='secondary' outline onClick={() => dispatch(exportRawReadings())}>
						<FormattedMessage id='export.raw.graph.data' />
					</Button>
				</div>
			}
		</>
	);
}

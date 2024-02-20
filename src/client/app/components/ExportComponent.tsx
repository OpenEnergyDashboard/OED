/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { selectLineChartDeps } from '../redux/selectors/lineChartSelectors';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectAnythingFetching } from '../redux/selectors/apiSelectors';
import { selectChartToRender } from '../redux/slices/graphSlice';
import { exportGraphReadingsThunk, exportRawReadings } from '../redux/thunks/exportThunk';
import TooltipMarkerComponent from './TooltipMarkerComponent';
/**
 * Creates export buttons and does code for handling export to CSV files.
 * @returns HTML for export buttons
 */
export default function ExportComponent() {
	const dispatch = useAppDispatch();
	const somethingIsFetching = useAppSelector(selectAnythingFetching);
	const { meterDeps, groupDeps } = useAppSelector(selectLineChartDeps)
	const chartToRender = useAppSelector(selectChartToRender);
	const shouldExport = !somethingIsFetching && (meterDeps.compatibleEntities.length > 0 || groupDeps.compatibleEntities.length > 0)

	return (
		<>
			<div>
				{/* Buttons have no callback when any data fetch in progress */}
				<Button color='secondary' outline onClick={() => shouldExport && dispatch(exportGraphReadingsThunk())}>
					<FormattedMessage id='export.graph.data' />
				</Button>
				<TooltipMarkerComponent page='home' helpTextId='help.home.export.graph.data' />
			</div>
			{/* Only raw export if a line graph */}
			{chartToRender === 'line' ? <div style={{ paddingTop: '10px' }}>
				<Button color='secondary' outline onClick={() => shouldExport && dispatch(exportRawReadings())}>
					<FormattedMessage id='export.raw.graph.data' />
				</Button>
			</div> : ''}
		</>
	);
}

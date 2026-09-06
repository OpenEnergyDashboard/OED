/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { useTranslate } from '../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender } from '../redux/slices/graphSlice';
import { exportGraphReadingsThunk, exportRawReadings } from '../redux/thunks/exportThunk';
import { ChartTypes } from '../types/redux/graph';
import ConfirmActionModalComponent from './ConfirmActionModalComponent';
import TooltipMarkerComponent from './TooltipMarkerComponent';

interface PendingExportConfirmation {
	message: string;
	resolve: (confirmed: boolean) => void;
}

/**
 * Creates export buttons and does code for handling export to CSV files.
 * @returns HTML for export buttons
 */
export default function ExportComponent() {
	const dispatch = useAppDispatch();
	const chartToRender = useAppSelector(selectChartToRender);
	const translate = useTranslate();
	const [pendingExportConfirmation, setPendingExportConfirmation] = React.useState<PendingExportConfirmation | null>(null);
	const pendingExportConfirmationRef = React.useRef<PendingExportConfirmation | null>(null);

	const requestExportConfirmation = React.useCallback((message: string) => new Promise<boolean>(resolve => {
		// Do not replace an unresolved confirmation if the export button is activated more than once.
		if (pendingExportConfirmationRef.current !== null) {
			resolve(false);
			return;
		}
		const pendingConfirmation = { message, resolve };
		pendingExportConfirmationRef.current = pendingConfirmation;
		setPendingExportConfirmation(pendingConfirmation);
	}), []);

	const settleExportConfirmation = React.useCallback((confirmed: boolean) => {
		const pendingConfirmation = pendingExportConfirmationRef.current;
		pendingExportConfirmationRef.current = null;
		setPendingExportConfirmation(null);
		pendingConfirmation?.resolve(confirmed);
	}, []);

	React.useEffect(() => () => {
		const pendingConfirmation = pendingExportConfirmationRef.current;
		pendingExportConfirmationRef.current = null;
		pendingConfirmation?.resolve(false);
	}, []);

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
					<Button color='secondary' outline
						onClick={() => dispatch(exportRawReadings({ requestConfirmation: requestExportConfirmation }))}>
						<FormattedMessage id='export.raw.graph.data' />
					</Button>
				</div>
			}
			<ConfirmActionModalComponent
				show={pendingExportConfirmation !== null}
				actionTitle={translate('confirm.action')}
				actionConfirmMessage={pendingExportConfirmation?.message}
				handleClose={() => settleExportConfirmation(false)}
				actionFunction={() => settleExportConfirmation(true)}
				actionRejectText={translate('cancel')}
				actionConfirmText={translate('continue')}
			/>
		</>
	);
}

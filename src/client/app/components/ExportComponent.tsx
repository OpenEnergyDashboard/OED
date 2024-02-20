/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { exportGraphReadingsThunk } from '../redux/thunks/exportThunk';
import { selectConversionsDetails } from '../redux/api/conversionsApi';
import { selectMeterDataById } from '../redux/api/metersApi';
import { selectUnitDataById } from '../redux/api/unitsApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectAnythingFetching } from '../redux/selectors/apiSelectors';
import { selectGraphState, selectQueryTimeInterval } from '../redux/slices/graphSlice';
import { UserRole } from '../types/items';
import { ConversionData } from '../types/redux/conversions';
import { metersApi, usersApi } from '../utils/api';
import { downloadRawCSV } from '../utils/exportData';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { showErrorNotification } from '../utils/notifications';
import { hasToken } from '../utils/token';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';
/**
 * Creates export buttons and does code for handling export to CSV files.
 * @returns HTML for export buttons
 */
export default function ExportComponent() {
	const dispatch = useAppDispatch();
	// Meters state
	const meterDataById = useAppSelector(selectMeterDataById);
	// Units state
	const unitsDataById = useAppSelector(selectUnitDataById);
	// Conversion state
	const conversionState = useAppSelector(selectConversionsDetails);
	// graph state
	const graphState = useAppSelector(selectGraphState);
	// admin state
	const adminState = useAppSelector(state => state.admin);
	// Time range of graphic
	const timeInterval = useAppSelector(selectQueryTimeInterval);
	const somethingIsFetching = useAppSelector(selectAnythingFetching);

	// Function to export raw readings of graphic data shown.
	const exportRawReadings = async () => {
		// Get the total number of readings for all meters so can warn user if large.
		// Soon OED will be able to estimate the number of readings based on reading frequency. However,
		// we will still get the correct count since this is not done very often and don't want to get
		// the wrong value. The time to do this is small compared to most raw exports (if file is large
		// when it matters).
		const count = await metersApi.lineReadingsCount(graphState.selectedMeters, graphState.queryTimeInterval);
		// Estimated file size in MB. Note that changing the language effects the size about +/- 8%.
		// This is just a decent estimate for larger files.
		const fileSize = (count * 0.082 / 1000);
		// Decides if the readings should be exported, true if should.
		let shouldDownload = false;
		if (fileSize <= adminState.defaultWarningFileSize) {
			// File sizes that anyone can download without prompting so fine
			shouldDownload = true;
		} else if (fileSize > adminState.defaultFileSizeLimit) {
			// Exceeds the size allowed unless admin or export role and must verify want to continue.
			if (hasToken() || await usersApi.hasRolePermissions(UserRole.EXPORT)) {
				// A user allowed to do this but need to check okay with them.
				const msg = translate('csv.download.size.warning.size') + ` ${fileSize.toFixed(2)}MB. ` +
					translate('csv.download.size.warning.verify') + '?';
				const consent = window.confirm(msg);
				if (consent) {
					shouldDownload = true;
				}
			} else {
				// User not allowed to download.
				const msg = translate('csv.download.size.warning.size') + ` ${fileSize.toFixed(2)}MB. ` +
					translate('csv.download.size.limit');
				showErrorNotification(msg);
			}
		} else {
			// Anyone can download if they approve
			const msg = translate('csv.download.size.warning.size') + ` ${fileSize.toFixed(2)}MB. ` +
				translate('csv.download.size.warning.verify') + '?';
			const consent = window.confirm(msg);
			if (consent) {
				shouldDownload = true;
			}
		}

		if (shouldDownload) {
			// Loop over each selected meter in graphic. Does nothing if no meters selected.
			for (const meterId of graphState.selectedMeters) {
				// export if area normalization is off or the meter can be normalized
				if (!graphState.areaNormalization || (meterDataById[meterId].area > 0 && meterDataById[meterId].areaUnit !== AreaUnitType.none)) {
					// Which selected meter being processed.
					// const currentMeter = graphState.selectedMeters[i];
					// Identifier for current meter.
					const currentMeterIdentifier = meterDataById[meterId].identifier;
					// The unit of the currentMeter.
					const meterUnitId = meterDataById[meterId].unitId;
					// Note that each meter can have a different unit so look up for each one.
					let unitIdentifier;
					// A complication is that a unit associated with a meter is not the one the user
					// sees when graphing. Now try to find the graphing unit.
					// Try to find expected conversion from meter with slope = 1 and intercept = 0
					const conversion = _.find(conversionState, function (c: ConversionData) {
						return c.sourceId === meterUnitId && c.slope === 1 && c.intercept === 0;
					}) as ConversionData;
					if (conversion == undefined) {
						// This is the unusual case where the conversion is not 1, 0.
						// We find the first conversion and use it.
						const anyConversion = _.find(conversionState, function (c: ConversionData) {
							// Conversion has source that is the meter unit.
							return c.sourceId === meterUnitId;
						}) as ConversionData;
						if (anyConversion == undefined) {
							// Could not find a conversion with this meter. This should never happen.
							// Use the identifier of currentMeter unit and extra info.
							unitIdentifier = unitsDataById[meterUnitId].identifier +
								' (this is the meter unit which is unusual)';
							// Nice if logged warning but no easy way so don't.
						} else {
							// Use this conversion but give slope/destination since changes values.
							unitIdentifier = unitsDataById[anyConversion.destinationId].identifier +
								` (but conversion from meter values of slope = ${anyConversion.slope} and intercept = ${anyConversion.intercept}`;
						}
					} else {
						// This is the typical case where there was a conversion from the meter of 1, 0.
						unitIdentifier = unitsDataById[conversion.destinationId].identifier;
					}

					// TODO The new line readings route for graphs allows one to get the raw data. Maybe we should try to switch to that and then modify
					// this code to use the unix timestamp that is returned. It is believed that the unix timestamp will be smaller than this string.
					// The long reading work will modify how you get raw data and probably make this easier. However, it does return the meter id for
					// each reading so that will add to the size unless we remove it as was done in how this data is gotten.

					// Get the raw readings.
					const lineReadings = await metersApi.rawLineReadings(meterId, timeInterval);
					// Get the CSV to to user.
					downloadRawCSV(lineReadings, currentMeterIdentifier, unitIdentifier);
				}
			}
		}
	}

	return (
		<>
			<div>
				{/* Buttons have no callback when any data fetch in progress */}
				<Button color='secondary' outline onClick={() => {
					dispatch(exportGraphReadingsThunk())
				}}>
					<FormattedMessage id='export.graph.data' />
				</Button>
				<TooltipMarkerComponent page='home' helpTextId='help.home.export.graph.data' />
			</div>
			{/* Only raw export if a line graph */}
			{graphState.chartToRender === 'line' ? <div style={{ paddingTop: '10px' }}>
				<Button color='secondary' outline onClick={!somethingIsFetching ? exportRawReadings : undefined}>
					<FormattedMessage id='export.raw.graph.data' />
				</Button>
			</div> : ''}
		</>
	);
}

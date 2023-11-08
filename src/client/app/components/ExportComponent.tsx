/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { selectConversionsDetails } from '../redux/api/conversionsApi';
import { selectGroupDataById } from '../redux/api/groupsApi';
import { selectMeterDataById } from '../redux/api/metersApi';
import { readingsApi } from '../redux/api/readingsApi';
import { selectUnitDataById } from '../redux/api/unitsApi';
import { useAppSelector } from '../redux/hooks';
import { selectChartQueryArgs } from '../redux/selectors/dataSelectors';
import { UserRole } from '../types/items';
import { ConversionData } from '../types/redux/conversions';
import { ChartTypes, MeterOrGroup } from '../types/redux/graph';
import { metersApi, usersApi } from '../utils/api';
import graphExport, { downloadRawCSV } from '../utils/exportData';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';
import { barUnitLabel, lineUnitLabel } from '../utils/graphics';
import { hasToken } from '../utils/token';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * Creates export buttons and does code for handling export to CSV files.
 * @returns HTML for export buttons
 */
export default function ExportComponent() {
	// Meters state
	const meterDataById = useAppSelector(selectMeterDataById);
	// Groups state
	const groupDataById = useAppSelector(selectGroupDataById);
	// Units state
	const unitsDataById = useAppSelector(selectUnitDataById);
	// Conversion state
	const conversionState = useAppSelector(selectConversionsDetails);
	// graph state
	const graphState = useAppSelector(state => state.graph);
	// admin state
	const adminState = useAppSelector(state => state.admin);
	// error bar state
	const errorBarState = useAppSelector(state => state.graph.showMinMax);
	// Time range of graphic
	const timeInterval = graphState.queryTimeInterval;

	const queryArgs = useAppSelector(selectChartQueryArgs)

	const { data: lineMeterReadings = {}, isFetching: lineMeterIsFetching } = readingsApi.endpoints.line.useQueryState(queryArgs.line.meterArgs);
	const { data: lineGroupReadings = {}, isFetching: groupMeterIsFetching } = readingsApi.endpoints.line.useQueryState(queryArgs.line.groupsArgs);
	const { data: barMeterReadings = {}, isFetching: barMeterIsFetching } = readingsApi.endpoints.line.useQueryState(queryArgs.bar.meterArgs);
	const { data: barGroupReadings = {}, isFetching: barGroupIsFetching } = readingsApi.endpoints.line.useQueryState(queryArgs.bar.groupsArgs);

	// Function to export the data in a graph.
	const exportGraphReading = () => {
		// What unit is being graphed. Unit of all lines to export.
		const unitId = graphState.selectedUnit;
		// This is the graphic unit identifier
		const unitIdentifier = unitsDataById[unitId].identifier;
		// What type of chart/graphic is being displayed.
		const chartName = graphState.chartToRender;
		if (chartName === ChartTypes.line && !lineMeterIsFetching) {
			// Exporting a line chart
			// Get the full y-axis unit label for a line
			const returned = lineUnitLabel(unitsDataById[unitId], graphState.lineGraphRate, graphState.areaNormalization, graphState.selectedAreaUnit);
			const unitLabel = returned.unitLabel
			// The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
			const rateScaling = returned.needsRateScaling ? graphState.lineGraphRate.rate : 1;
			// Loop over the displayed meters and export one-by-one.  Does nothing if no meters selected.
			for (const meterId of graphState.selectedMeters) {
				const meterArea = meterDataById[meterId].area;
				// export if area normalization is off or the meter can be normalized
				if (!graphState.areaNormalization || (meterArea > 0 && meterDataById[meterId].areaUnit !== AreaUnitType.none)) {
					// Line readings data for this meter.
					// Get the readings for the time range and unit graphed
					const readingsData = lineMeterReadings[meterId];
					// Make sure it exists in case state is not there yet.
					// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
					const areaScaling = graphState.areaNormalization ?
						meterArea * getAreaUnitConversion(meterDataById[meterId].areaUnit, graphState.selectedAreaUnit) : 1;
					// Divide areaScaling into the rate so have complete scaling factor for readings.
					const scaling = rateScaling / areaScaling;
					// Make sure they are there and not being fetched.
					if (readingsData) {
						// Get the readings from the state.
						const readings = _.values(readingsData);
						// Sort by start timestamp.
						const sortedReadings = _.sortBy(readings, item => item.startTimestamp, 'asc');
						// Identifier for current meter.
						const meterIdentifier = meterDataById[meterId].identifier;
						graphExport(sortedReadings, meterIdentifier, unitLabel, unitIdentifier, chartName, scaling, MeterOrGroup.meters, errorBarState);
					} else {
						throw new Error(`Unacceptable condition: readingsData.readings is undefined for meter ${meterId}.`);
					}
				}
			}
			// Loop over the displayed groups and export one-by-one.  Does nothing if no groups selected.
			for (const groupId of graphState.selectedGroups) {
				const groupArea = groupDataById[groupId].area;
				// export if area normalization is off or the group can be normalized
				if (!graphState.areaNormalization || (groupArea > 0 && groupDataById[groupId].areaUnit !== AreaUnitType.none)) {
					// Convert the group area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
					const areaScaling = graphState.areaNormalization ?
						groupArea * getAreaUnitConversion(groupDataById[groupId].areaUnit, graphState.selectedAreaUnit) : 1;
					// Divide areaScaling into the rate so have complete scaling factor for readings.
					const scaling = rateScaling / areaScaling;


					// Line readings data for this group.
					const readingsData = lineGroupReadings[groupId]
					// Make sure they are there and not being fetched.
					if (readingsData && !groupMeterIsFetching) {
						// Get the readings from the state.
						const readings = _.values(readingsData);
						// Sort by start timestamp.
						const sortedReadings = _.sortBy(readings, item => item.startTimestamp, 'asc');
						// Identifier for current group.
						const groupName = groupDataById[groupId].name;
						graphExport(sortedReadings, groupName, unitLabel, unitIdentifier, chartName, scaling, MeterOrGroup.groups);
					} else {
						throw new Error(`Unacceptable condition: readingsData.readings is undefined for group ${groupId}.`);
					}
				}
			}
		} else if (chartName === ChartTypes.bar) {
			// Exporting a bar chart
			// Get the full y-axis unit label for a bar
			const unitLabel = barUnitLabel(unitsDataById[unitId], graphState.areaNormalization, graphState.selectedAreaUnit);
			// Loop over the displayed meters and export one-by-one.  Does nothing if no meters selected.
			for (const meterId of graphState.selectedMeters) {
				// export if area normalization is off or the meter can be normalized
				if (!graphState.areaNormalization || (meterDataById[meterId].area > 0 && meterDataById[meterId].areaUnit !== AreaUnitType.none)) {
					// No scaling if areaNormalization is not enabled
					let scaling = 1;
					if (graphState.areaNormalization) {
						// convert the meter area into the proper unit, if needed
						scaling *= getAreaUnitConversion(meterDataById[meterId].areaUnit, graphState.selectedAreaUnit);
					}
					// Get the readings for the time range and unit graphed
					const readingsData = barMeterReadings[meterId];
					// Make sure they are there and not being fetched.
					if (readingsData && !barMeterIsFetching) {

						// Get the readings from the state.
						const readings = _.values(readingsData);
						// Sort by start timestamp.
						const sortedReadings = _.sortBy(readings, item => item.startTimestamp, 'asc');
						// Identifier for current meter.
						const meterIdentifier = meterDataById[meterId].identifier;
						graphExport(sortedReadings, meterIdentifier, unitLabel, unitIdentifier, chartName, scaling, MeterOrGroup.meters);
					} else if (!readingsData && !barMeterIsFetching) {
						throw new Error(`Unacceptable condition: readingsData.readings is undefined for meter ${meterId}.`);
					}
				}
			}
			// Loop over the displayed groups and export one-by-one.  Does nothing if no groups selected.
			for (const groupId of graphState.selectedGroups) {
				// export if area normalization is off or the group can be normalized
				if (!graphState.areaNormalization || (groupDataById[groupId].area > 0 && groupDataById[groupId].areaUnit !== AreaUnitType.none)) {
					// Bar readings data for this group.
					// No scaling if areaNormalization is not enabled
					let scaling = 1;
					if (graphState.areaNormalization) {
						// convert the meter area into the proper unit, if needed
						scaling *= getAreaUnitConversion(groupDataById[groupId].areaUnit, graphState.selectedAreaUnit);
					}
					// Get the readings for the time range and unit graphed
					const readingsData = barGroupReadings[groupId];
					// Make sure they are there and not being fetched.
					if (readingsData && !barGroupIsFetching) {

						// Get the readings from the state.
						const readings = _.values(readingsData);
						// Sort by start timestamp.
						const sortedReadings = _.sortBy(readings, item => item.startTimestamp, 'asc');
						// Identifier for current group.
						const groupName = groupDataById[groupId].name;
						graphExport(sortedReadings, groupName, unitLabel, unitIdentifier, chartName, scaling, MeterOrGroup.groups);
					} else if (!readingsData && !barGroupIsFetching) {
						throw new Error(`Unacceptable condition: readingsData.readings is undefined for group ${groupId}.`);
					}
				}
			}
		}
	}

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
				window.alert(msg);
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
				{/*
				TODO conditionally disable button click if data for current graph is fetching.
				TODO VERIFY Behavior with RTK migration
				 */}
				<Button color='secondary' outline onClick={exportGraphReading}>
					<FormattedMessage id='export.graph.data' />
				</Button>
				<TooltipMarkerComponent page='home' helpTextId='help.home.export.graph.data' />
			</div>
			{/* Only raw export if a line graph */}
			{graphState.chartToRender === 'line' ? <div style={{ paddingTop: '10px' }}>
				<Button color='secondary' outline onClick={exportRawReadings}>
					<FormattedMessage id='export.raw.graph.data' />
				</Button>
			</div> : ''}
		</>
	);
}

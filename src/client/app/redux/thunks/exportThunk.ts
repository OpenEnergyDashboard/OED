/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { selectConversionsDetails } from '../../redux/api/conversionsApi';
import { selectGroupById } from '../../redux/api/groupsApi';
import { metersApi, selectMeterById } from '../../redux/api/metersApi';
import { readingsApi } from '../../redux/api/readingsApi';
import { selectUnitById, selectUnitDataById } from '../../redux/api/unitsApi';
import { selectPlotlyBarDeps } from '../../redux/selectors/barChartSelectors';
import { selectBarChartQueryArgs, selectLineChartQueryArgs } from '../../redux/selectors/chartQuerySelectors';
import { selectNameFromEntity, selectScalingFromEntity } from '../../redux/selectors/entitySelectors';
import { selectLineChartDeps } from '../../redux/selectors/lineChartSelectors';
import { selectBarUnitLabel, selectLineUnitLabel, selectPlotlyMeterDeps } from '../../redux/selectors/plotlyDataSelectors';
import { selectAdminState } from '../../redux/slices/adminSlice';
import { selectHasRolePermissions } from '../../redux/slices/currentUserSlice';
import { selectChartToRender, selectQueryTimeInterval, selectSelectedMeters, selectSelectedUnit } from '../../redux/slices/graphSlice';
import { UserRole } from '../../types/items';
import { ConversionData } from '../../types/redux/conversions';
import { ChartTypes, MeterOrGroup } from '../../types/redux/graph';
import graphExport, { downloadRawCSV } from '../../utils/exportData';
import { showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import { createAppThunk } from './appThunk';
import { selectAnythingFetching } from '../../redux/selectors/apiSelectors';
import { RootState } from '../../store';
import { find, sortBy } from 'lodash';

const selectCanExport = (state: RootState) => {
	const fetchInProgress = selectAnythingFetching(state);
	const { meterDeps, groupDeps } = selectLineChartDeps(state);
	return !fetchInProgress && (meterDeps.compatibleEntities.length > 0 || groupDeps.compatibleEntities.length > 0);
};

export const exportGraphReadingsThunk = createAppThunk(
	'graph/exportGraphData',
	(_unused, api) => {
		const state = api.getState();
		if (!selectCanExport(state)) {
			return api.rejectWithValue('Data Fetch In Progress, Or No data');
		}
		const chartToRender = selectChartToRender(state);
		if (chartToRender === ChartTypes.line) {
			const lineUnitLabel = selectLineUnitLabel(state);
			const lineDeps = selectLineChartDeps(state);
			const lineChartQueryArgs = selectLineChartQueryArgs(state);
			const lineReadings = readingsApi.endpoints.line.select(lineChartQueryArgs.meterArgs)(state);
			const groupReadings = readingsApi.endpoints.line.select(lineChartQueryArgs.groupArgs)(state);

			const { areaUnit, areaNormalization, lineGraphRate, showMinMax } = lineDeps.meterDeps;
			lineReadings.data && Object.entries(lineReadings.data)
				.filter(([id]) => lineDeps.meterDeps.compatibleEntities.includes(Number(id)))
				.forEach(([id, readings]) => {
					const entity = selectMeterById(state, Number(id));
					// Divide areaScaling into the rate so have complete scaling factor for readings.
					const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate);
					// Get the readings from the state.
					// Sort by start timestamp.
					const sortedReadings = sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
					// Identifier for current meter.
					const entityName = selectNameFromEntity(entity);
					// const unitLabel = selectUnitById(state, selectSelectedUnit(state))
					const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)));
					graphExport(sortedReadings, entityName, lineUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.meters, showMinMax);
				});

			groupReadings.data && Object.entries(groupReadings.data)
				.filter(([id]) => lineDeps.groupDeps.compatibleEntities.includes(Number(id)))
				.forEach(([id, readings]) => {
					const entity = selectGroupById(state, Number(id));
					const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate);
					const sortedReadings = sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
					const entityName = selectNameFromEntity(entity);
					const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)));
					graphExport(sortedReadings, entityName, lineUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.groups, showMinMax);
				});
		}

		if (chartToRender === ChartTypes.bar) {
			const barUnitLabel = selectBarUnitLabel(state);
			const barChartQueryArgs = selectBarChartQueryArgs(state);
			const barReadings = readingsApi.endpoints.bar.select(barChartQueryArgs.meterArgs)(state);
			const groupReadings = readingsApi.endpoints.bar.select(barChartQueryArgs.groupArgs)(state);

			const barDeps = selectPlotlyBarDeps(state);
			const { areaUnit, areaNormalization, lineGraphRate } = barDeps.barMeterDeps;
			barReadings.data && Object.entries(barReadings.data)
				.filter(([id]) => barDeps.barMeterDeps.compatibleEntities.includes(Number(id)))
				.forEach(([id, readings]) => {
					const entity = selectMeterById(state, Number(id));
					const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate);
					const sortedReadings = sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
					const entityName = selectNameFromEntity(entity);
					const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)));
					graphExport(sortedReadings, entityName, barUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.meters);
				});


			groupReadings.data && Object.entries(groupReadings.data)
				.filter(([id]) => barDeps.barGroupDeps.compatibleEntities.includes(Number(id)))
				.forEach(([id, readings]) => {
					const entity = selectGroupById(state, Number(id));
					const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate);
					const sortedReadings = sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
					const entityName = selectNameFromEntity(entity);
					const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)));
					graphExport(sortedReadings, entityName, barUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.groups);
				});
		}
		return api.fulfillWithValue('success');

	}
);

export const exportRawReadings = createAppThunk(
	'graph/ExportRaw',
	async (_arg, api) => {
		const state = api.getState();
		if (!selectCanExport(state)) {
			return api.rejectWithValue('Data Fetch In Progress, Or No data');
		}

		const dispatch = api.dispatch;
		const meterIDs = selectSelectedMeters(state);
		const timeInterval = selectQueryTimeInterval(state);
		const adminState = selectAdminState(state);
		const { meterDataById, compatibleEntities } = selectPlotlyMeterDeps(state);
		const conversionState = selectConversionsDetails(state);
		const unitsDataById = selectUnitDataById(state);
		// Function to export raw readings of graphic data shown.
		// Get the total number of readings for all meters so can warn user if large.
		// Soon OED will be able to estimate the number of readings based on reading frequency. However,
		// we will still get the correct count since this is not done very often and don't want to get
		// the wrong value. The time to do this is small compared to most raw exports (if file is large
		// when it matters).
		const count = await dispatch(metersApi.endpoints.lineReadingsCount.initiate({ meterIDs, timeInterval })).unwrap();
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
			if (selectHasRolePermissions(state, UserRole.EXPORT)) {
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
			for (const meterID of compatibleEntities) {
				// export if area normalization is off or the meter can be normalized
				// Which selected meter being processed.
				// const currentMeter = graphState.selectedMeters[i];
				// Identifier for current meter.
				const currentMeterIdentifier = meterDataById[meterID].identifier;
				// The unit of the currentMeter.
				const meterUnitId = meterDataById[meterID].unitId;
				// Note that each meter can have a different unit so look up for each one.
				let unitIdentifier;
				// A complication is that a unit associated with a meter is not the one the user
				// sees when graphing. Now try to find the graphing unit.
				// Try to find expected conversion from meter with slope = 1 and intercept = 0
				const conversion = find(conversionState, function (c: ConversionData) {
					return c.sourceId === meterUnitId && c.slope === 1 && c.intercept === 0;
				});
				if (!conversion) {
					// This is the unusual case where the conversion is not 1, 0.
					// We find the first conversion and use it.
					const anyConversion = find(conversionState, function (c: ConversionData) {
						// Conversion has source that is the meter unit.
						return c.sourceId === meterUnitId;
					});
					if (!anyConversion) {
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
				const response = dispatch(metersApi.endpoints.rawLineReadings.initiate({ meterID, timeInterval }));
				const lineReadings = await response.unwrap();
				// unsub from query after a minute.
				setTimeout(() => { response.unsubscribe(); }, 60000);
				// Get the CSV to to user.
				downloadRawCSV(lineReadings, currentMeterIdentifier, unitIdentifier);
			}
		}


		return api.fulfillWithValue('success');
	}
);

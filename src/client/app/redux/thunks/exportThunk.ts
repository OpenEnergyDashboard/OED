import * as _ from 'lodash'
import { selectGroupById } from '../../redux/api/groupsApi'
import { selectMeterById } from '../../redux/api/metersApi'
import { readingsApi } from '../../redux/api/readingsApi'
import { selectUnitById } from '../../redux/api/unitsApi'
import { selectPlotlyBarDeps } from '../../redux/selectors/barChartSelectors'
import { selectBarChartQueryArgs, selectLineChartQueryArgs } from '../../redux/selectors/chartQuerySelectors'
import { selectNameFromEntity, selectScalingFromEntity } from '../../redux/selectors/entitySelectors'
import { selectLineChartDeps } from '../../redux/selectors/lineChartSelectors'
import { selectBarUnitLabel, selectLineUnitLabel } from '../../redux/selectors/plotlyDataSelectors'
import { selectChartToRender, selectSelectedUnit } from '../../redux/slices/graphSlice'
import { ChartTypes, MeterOrGroup } from '../../types/redux/graph'
import graphExport from '../../utils/exportData'
import { createAppAsyncThunk } from './appThunk'

export const exportGraphReadingsThunk = createAppAsyncThunk(
	'graph/exportGraphData',
	(_unused: void, { getState }) => {
		const state = getState()
		const chartToRender = selectChartToRender(state)

		if (chartToRender === ChartTypes.line) {
			const lineUnitLabel = selectLineUnitLabel(state)
			const lineDeps = selectLineChartDeps(state)
			const lineChartQueryArgs = selectLineChartQueryArgs(state)
			const lineReadings = readingsApi.endpoints.line.select(lineChartQueryArgs.meterArgs)(state)
			const groupReadings = readingsApi.endpoints.line.select(lineChartQueryArgs.groupArgs)(state)

			const { areaUnit, areaNormalization, lineGraphRate, showMinMax } = lineDeps.meterDeps
			lineReadings.data && Object.entries(lineReadings.data)
				.filter(([id]) => lineDeps.meterDeps.compatibleEntities.includes(Number(id)))
				.forEach(([id, readings]) => {
					const entity = selectMeterById(state, Number(id))
					// Divide areaScaling into the rate so have complete scaling factor for readings.
					const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate)
					// Get the readings from the state.
					// Sort by start timestamp.
					const sortedReadings = _.sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
					// Identifier for current meter.
					const entityName = selectNameFromEntity(entity);
					// const unitLabel = selectUnitById(state, selectSelectedUnit(state))
					const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)))
					graphExport(sortedReadings, entityName, lineUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.meters, showMinMax);
				})

			groupReadings.data && Object.entries(groupReadings.data)
				.filter(([id]) => lineDeps.groupDeps.compatibleEntities.includes(Number(id)))
				.forEach(([id, readings]) => {
					const entity = selectGroupById(state, Number(id))
					const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate)
					const sortedReadings = _.sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
					const entityName = selectNameFromEntity(entity);
					const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)))
					graphExport(sortedReadings, entityName, lineUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.meters, showMinMax);
				})
		}

		if (chartToRender === ChartTypes.bar) {
			const barUnitLabel = selectBarUnitLabel(state)
			const barDeps = selectPlotlyBarDeps(state)
			const barChartQueryArgs = selectBarChartQueryArgs(state)
			const barReadings = readingsApi.endpoints.bar.select(barChartQueryArgs.meterArgs)(state)
			const groupReadings = readingsApi.endpoints.bar.select(barChartQueryArgs.groupArgs)(state)

			const { areaUnit, areaNormalization, lineGraphRate } = barDeps.barMeterDeps
			barReadings.data && Object.entries(barReadings.data)
				.filter(([id]) => barDeps.barMeterDeps.compatibleEntities.includes(Number(id)))
				.forEach(([id, readings]) => {
					const entity = selectMeterById(state, Number(id))
					const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate)
					const sortedReadings = _.sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
					const entityName = selectNameFromEntity(entity);
					const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)))
					graphExport(sortedReadings, entityName, barUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.meters);
				})


			groupReadings.data && Object.entries(groupReadings.data)
				.filter(([id]) => barDeps.barGroupDeps.compatibleEntities.includes(Number(id)))
				.forEach(([id, readings]) => {
					const entity = selectGroupById(state, Number(id))
					const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate)
					const sortedReadings = _.sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
					const entityName = selectNameFromEntity(entity);
					const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)))
					graphExport(sortedReadings, entityName, barUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.meters);
				})
		}

	})

// const exportEntityData = (readings: LineReading | BarReading, entity: MeterData | GroupData, ) => {
// 	if (selectMeterOrGroupFromEntity(entity) === MeterOrGroup.meters) {
// 		const scaling = selectScalingFromEntity(entity, areaUnit, areaNormalization, lineGraphRate.rate)
// 		const sortedReadings = _.sortBy(Object.values(readings), item => item.startTimestamp, 'asc');
// 		const entityName = selectNameFromEntity(entity);
// 		const unitIdentifier = selectNameFromEntity(selectUnitById(state, selectSelectedUnit(state)))
// 		graphExport(sortedReadings, entityName, barUnitLabel, unitIdentifier, chartToRender, scaling, MeterOrGroup.meters);

// 	}
// }
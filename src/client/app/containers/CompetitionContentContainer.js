import _ from 'lodash';
import { connect } from 'react-redux';
import CompetitionContent from '../components/CompetitionContent';
import { fetchMetersDetailsIfNeeded } from '../actions/meters';
import { changeSelectedBuilding } from '../actions/graph';

function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	// const sortedMeterID = sortedMeters.map(meter => (meter.id));
	const timeInterval = 'all';
	const data = { datasets: [] };
	// getColor() cycles through the colors, wrapping around the end to the beginning
	const colors = ['LightBlue', 'GoldenRod', 'Black', 'OrangeRed', 'LightSeaGreen', 'LightSlateGray', 'Purple'];
	let colorPointer = 0;
	function getColor() {
		const color = colors[colorPointer];
		colorPointer = (colorPointer + 1) % colors.length;
		return color;
	}
	for (const meterID of state.graph.selectedMeters) {
		const readingsData = state.readings.line.byMeterID[meterID][timeInterval];
		if (readingsData !== undefined && !readingsData.isFetching) {
			data.datasets.push({
				label: state.meters.byMeterID[meterID].name,
				data: readingsData.readings.map(arr => ({ x: arr[0], y: arr[1].toFixed(2) })),
				fill: true,
				borderColor: getColor()
			});
		}
	}

	return {
		meters: sortedMeters,
		data: data,
		redraw: true,
		timeInterval: timeInterval

	};
}

function mapDispatchToProps(dispatch) {
	return {
		// selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		fetchMetersDataIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		selectMeters: (newSelectedMeterIDs, timeInterval) => dispatch(changeSelectedBuilding(newSelectedMeterIDs, timeInterval))
		// fetchNewReadings: (meterID, startTimestamp, endTimestamp) => dispatch(fetchReadingsIfNeeded(meterID, startTimestamp, endTimestamp))
	};
}


export default connect(mapStateToProps, mapDispatchToProps)(CompetitionContent);

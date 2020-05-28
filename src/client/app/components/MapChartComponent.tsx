import * as React from 'react';
import { MapModeTypes } from '../types/redux/map';
import MapInitiateContainer from '../containers/MapInitiateContainer';

interface MapChartProps {
	mode: MapModeTypes,
	isLoading: boolean,
}

export default class MapChartComponent extends React.Component<MapChartProps, {}> {
	constructor(props: MapChartProps) {
		super(props);
	}

	public render() {
		if (this.props.mode === MapModeTypes.initiate) {
			return (
				<MapInitiateContainer/>
			);
		} else if (this.props.mode === MapModeTypes.calibrate) {
			return (
				// <MapCalibrationContainer />
				<p>Coming soon...</p>
			);
		} else { //display-mode containers
			return (
				<p>Coming soon...</p>
			);
		}
	}
}

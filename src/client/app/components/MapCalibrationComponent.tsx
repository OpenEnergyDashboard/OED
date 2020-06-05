import * as React from 'react';
import {MapModeTypes} from '../types/redux/map';

interface MapCalibrationProps {
	acceptedSource: string;

}

interface MapCalibrateState {
	numDataPoint: number;
	graphCoordinates: number[];
	gpsCoordinates: number[]; // Todo: check gps storing object and refactor data structure to store gps coordinates;
}

export default class MapCalibrationComponent extends React.Component<MapCalibrationProps, MapCalibrateState>{
	render() {
		return undefined;
	}
}


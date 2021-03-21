/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { connect } from 'react-redux';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';
import { State } from '../types/redux/state';
import { calculateScaleFromEndpoints, meterDisplayableOnMap } from '../utils/calibration';
import * as _ from 'lodash';
import getGraphColor from '../utils/getGraphColor';
import { TimeInterval } from '../../../common/TimeInterval';
import Locales from '../types/locales';
import { DataType } from '../types/Datasources';

function mapStateToProps(state: State) {
	let map;
	let data;
	let image;
	if (state.maps.selectedMap !== 0) {
		const mapID = state.maps.selectedMap;
		if (state.maps.byMapID[mapID]) {
			map = state.maps.byMapID[mapID];
			if (state.maps.editedMaps[mapID]) {
				map = state.maps.editedMaps[mapID];
			}
		}
		let x: number[] = [];
		let y: number[] = [];
		const texts: string[] = [];
		const size: number[] = [];
		const colors: string[] = [];
		data = [];
		image = (map) ? map.image : new Image();

		// calculate coordinates
		const timeInterval = state.graph.timeInterval;
		const barDuration = (timeInterval.equals(TimeInterval.unbounded())) ? moment.duration(4, 'weeks')
			: moment.duration(timeInterval.duration('days'), 'days');
		if (map && map.origin && map.opposite) {
			/**
			 * filter meters/groups with valid gps coordinates
			 */
			const points: any[] = [];
			for (const meterID of state.graph.selectedMeters) {
				const byMeterID = state.readings.bar.byMeterID[meterID];
				const gps = state.meters.byMeterID[meterID].gps;
				if (gps !== undefined && gps !== null) {
					if (meterDisplayableOnMap({ gps, meterID }, map)) {
						points.push(gps);
						const readingsData = byMeterID[timeInterval.toString()][barDuration.toISOString()];
						if (readingsData !== undefined && !readingsData.isFetching) {
							const label = state.meters.byMeterID[meterID].name;
							colors.push(getGraphColor(meterID, DataType.Meter));
							if (readingsData.readings === undefined) {
								throw new Error('Unacceptable condition: readingsData.readings is undefined.');
							}
							// Use the most recent time reading for the circle on the map.
							// This has the limitations of the bar value.
							// TODO: It might be better to do this similarly to compare. (See GitHub issue)
							const readings = _.orderBy(readingsData.readings, ['startTimestamp'], ['desc']);
							const mapReading = readings[0];
							// Shift by UTC since want database time not local/browser time which is what moment does.
							const timeReading: string =
								`${moment(mapReading.startTimestamp).utc().format('LL')} - ${moment(mapReading.endTimestamp).utc().format('LL')}`;
							const averagedReading = mapReading.reading / barDuration.asDays(); // average total reading by days of duration
							size.push(averagedReading);
							texts.push(`<b> ${timeReading} </b> <br> ${label}: ${averagedReading} kWh/day`);
						}
					}
				}
			}

			const origin = map.origin;
			const opposite = map.opposite;
			const mapScale = calculateScaleFromEndpoints(origin, opposite, {
				width: image.width,
				height: image.height
			});
			x = points.map(point => (point.longitude - origin.longitude) / mapScale.degreePerUnitX);
			y = points.map(point => (point.latitude - origin.latitude) / mapScale.degreePerUnitY);

			const traceOne = {
				x,
				y,
				type: 'scatter',
				mode: 'markers',
				marker: {
					color: colors,
					opacity: 0.5,
					size
				},
				text: texts,
				opacity: 1,
				showlegend: false
			};
			data.push(traceOne);
		}
	}

	// set map background image
	const layout: any = {
		title: {
			text: (map) ? map.name : 'There\'s not an available map'
		},
		width: 1000,
		height: 1000,
		xaxis: {
			visible: false, // changes all visibility settings including showgrid, zeroline, showticklabels and hiding ticks
			range: [0, 500] // range of displayed graph
		},
		yaxis: {
			visible: false,
			range: [0, 500],
			scaleanchor: 'x'
		},
		images: [{
			layer: 'below',
			source: (image) ? image.src : '',
			xref: 'x',
			yref: 'y',
			x: 0,
			y: 0,
			sizex: 500,
			sizey: 500,
			xanchor: 'left',
			yanchor: 'bottom',
			sizing: 'contain',
			opacity: 1
		}]
	};

	/***
	 * Usage:
	 *  <PlotlyChart data={toJS(this.model_data)}
	 *               layout={layout}
	 *               onClick={({points, event}) => console.log(points, event)}>
	 */
	const props: IPlotlyChartProps = {
		data,
		layout,
		config: {
			locales: Locales // makes locales available for use
		}
	};
	const lang = state.admin.defaultLanguage;
	if(lang === 'fr')
		props.config.locale = 'fr'
	else if(lang === 'es')
		props.config.locale = 'es'
	return props;
}

export default connect(mapStateToProps)(PlotlyChart);

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { connect } from 'react-redux';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';
import { State } from '../types/redux/state';
import {
	calculateScaleFromEndpoints, meterDisplayableOnMap, rotate, Dimensions,
	CartesianPoint, normalizeImageDimensions, trueNorthAngle
} from '../utils/calibration';
import * as _ from 'lodash';
import getGraphColor from '../utils/getGraphColor';
import { TimeInterval } from '../../../common/TimeInterval';
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
		const texts: string[] = [];
		const size: number[] = [];
		const colors: string[] = [];
		data = [];
		image = (map) ? map.image : new Image();
		// Arrays to hold the Plotly grid location (x, y) for circles to place on map.
		const x: number[] = [];
		const y: number[] = [];

		// calculate coordinates
		const timeInterval = state.graph.timeInterval;
		const barDuration = (timeInterval.equals(TimeInterval.unbounded())) ? moment.duration(4, 'weeks')
			: moment.duration(timeInterval.duration('days'), 'days');
		if (map && map.origin && map.opposite) {
			// The size of the image.
			const imageDimensions: Dimensions = {
				width: image.width,
				height: image.height
			};
			const imageDimensionNormalized = normalizeImageDimensions(imageDimensions);
			// This is the origin & opposite from the calibration. It is the lower, left
			// and upper, right corners of the user map.
			const origin = map.origin;
			const opposite = map.opposite;
			// Get the GPS degrees per unit of Plotly grid for x and y. By knowing the two corners
			// (or really any two distinct points) you can calculate this by the change in GPS over the
			// change in x or y which is the map's width & height in this case.
			const mapScale = calculateScaleFromEndpoints(origin, opposite, imageDimensions);
			for (const meterID of state.graph.selectedMeters) {
				const byMeterID = state.readings.bar.byMeterID[meterID];
				const gps = state.meters.byMeterID[meterID].gps;
				// filter meters with valid gps coordinates
				if (gps !== undefined && gps !== null) {
					// Only display items within map.
					if (meterDisplayableOnMap({ gps, meterID }, map)) {
						// Convert the gps value to the equivalent Plotly grid coordinates on user map.
						// First, convert from GPS to grid units. Since we are doing a GPS calculation, this happens on the true north map.
						// Calculate how far the point is from origin and then the units for this distance from zero.
						const gridTrueNorth: CartesianPoint = { x: (gps.longitude - origin.longitude) / mapScale.degreePerUnitX,
							y: (gps.latitude - origin.latitude) / mapScale.degreePerUnitY };
						// Rotate about center so now on the user map. Since going from true north to user map
						// the rotation angle is negative. You don't need to shift before doing this because
						// this started as a GPS point.
						const gridUserShifted: CartesianPoint = rotate(-trueNorthAngle.angle, gridTrueNorth);
						// Shift origin from center to bottom, left as this is the grid in Plotly.
						// const gridUser = shift(imageDimensionNormalized, gridUserShifted, 1);
						const gridUser = gridUserShifted;
						x.push(gridUser.x);
						y.push(gridUser.y);
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
								`${moment(mapReading.startTimestamp).utc().format('MMM DD, YYYY')} - ${moment(mapReading.endTimestamp).utc().format('MMM DD, YYYY')}`;
							const averagedReading = mapReading.reading / barDuration.asDays(); // average total reading by days of duration
							size.push(averagedReading);
							texts.push(`<b> ${timeReading} </b> <br> ${label}: ${averagedReading} kWh/day`);
						}
					}
				}
			}

			// TODO Using the following if seems to have no impact on the code. It has been noticed that this function is called
			// many times for each change. Some should look at why that is happening and why some have no items in the arrays.
			// if (size.length > 0) {
			// TODO The max circle diameter should come from admin/DB.
			const maxFeatureFraction = 0.2;
			// The width of the map should be smaller so use that.
			// The circle size is set to area below. Thus, we need to convert from wanting a max
			// diameter of width of the map * maxFeatureFraction to an area.
			// Clearly 4 * (1/2)^2 = 1 but I thought this was clear.
			const maxCircleSize = Math.PI / 4 * Math.pow(imageDimensionNormalized.width * maxFeatureFraction / 2, 2);
			// Find the largest circle.
			const largestCircleSize = Math.max(...size);
			// Scale largest circle to the max size and others will be scaled to be smaller.
			const scaling = maxCircleSize / largestCircleSize;

			// Per https://plotly.com/javascript/reference/scatter/:
			// Set the sizemode to area not diameter.
			// Set the sizemin so a circle cannot get so small that it might disappear. Unsure the best size.
			// Set the sizeref to scale each point to the desired area.
			// Note all sizes are in px so have to estimate the actual size. This could be an issue but maps are currently
			// a fixed size so not too much of an issue.
			// Also note that the circle can go off the edge of the map. At some point it would be nice to have a border
			// around the map to avoid this.
			const traceOne = {
				x,
				y,
				type: 'scatter',
				mode: 'markers',
				marker: {
					color: colors,
					opacity: 0.5,
					size,
					sizemin: 6,
					sizeref: scaling,
					sizemode: 'area'
				},
				text: texts,
				opacity: 1,
				showlegend: false
			};
			data.push(traceOne);
			// }
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
		layout
	};
	return props;
}

export default connect(mapStateToProps)(PlotlyChart);

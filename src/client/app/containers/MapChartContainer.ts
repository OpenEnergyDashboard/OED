/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { connect } from 'react-redux';
import PlotlyChart, { IPlotlyChartProps } from 'react-plotlyjs-ts';
import { State } from '../types/redux/state';
import {
	calculateScaleFromEndpoints, meterDisplayableOnMap, Dimensions,
	CartesianPoint, normalizeImageDimensions, meterMapInfoOk, gpsToUserGrid
} from '../utils/calibration';
import * as _ from 'lodash';
import getGraphColor from '../utils/getGraphColor';
import { TimeInterval } from '../../../common/TimeInterval';
import Locales from '../types/locales';
import { DataType } from '../types/Datasources';

function mapStateToProps(state: State) {
	// Map to use.
	let map;
	// Holds Plotly mapping info.
	const data = [];
	// Holds the image to use.
	let image;
	if (state.maps.selectedMap !== 0) {
		const mapID = state.maps.selectedMap;
		if (state.maps.byMapID[mapID]) {
			map = state.maps.byMapID[mapID];
			if (state.maps.editedMaps[mapID]) {
				map = state.maps.editedMaps[mapID];
			}
		}
		// Holds the hover text for each point for Plotly
		const texts: string[] = [];
		// Holds the size of each circle for Plotly.
		const size: number[] = [];
		// Holds the color of each circle for Plotly.
		const colors: string[] = [];
		// If there is no map then use a new, empty image as the map. I believe this avoids errors
		// and gives the blank screen.
		image = (map) ? map.image : new Image();
		// Arrays to hold the Plotly grid location (x, y) for circles to place on map.
		const x: number[] = [];
		const y: number[] = [];

		// Figure out what time interval the bar is using since user bar data for now.
		const timeInterval = state.graph.timeInterval;
		const barDuration = (timeInterval.equals(TimeInterval.unbounded())) ? moment.duration(4, 'weeks')
			: moment.duration(timeInterval.duration('days'), 'days');
		// Make sure there is a map with values so avoid issues.
		if (map && map.origin && map.opposite) {
			// The size of the original map loaded into OED.
			const imageDimensions: Dimensions = {
				width: image.width,
				height: image.height
			};
			// Determine the dimensions so within the Plotly coordinates on the user map.
			const imageDimensionNormalized = normalizeImageDimensions(imageDimensions);
			// This is the origin & opposite from the calibration. It is the lower, left
			// and upper, right corners of the user map.
			const origin = map.origin;
			const opposite = map.opposite;
			// Get the GPS degrees per unit of Plotly grid for x and y. By knowing the two corners
			// (or really any two distinct points) you can calculate this by the change in GPS over the
			// change in x or y which is the map's width & height in this case.
			const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized);
			// Loop over all selected meters. Maps only work for meters at this time.
			for (const meterID of state.graph.selectedMeters) {
				// Get meter id number.
				const byMeterID = state.readings.bar.byMeterID[meterID];
				// Get meter GPS value.
				const gps = state.meters.byMeterID[meterID].gps;
				// filter meters with actual gps coordinates.
				if (gps !== undefined && gps !== null) {
					// Convert the gps value to the equivalent Plotly grid coordinates on user map.
					// First, convert from GPS to grid units. Since we are doing a GPS calculation, this happens on the true north map.
					// It must be on true north map since only there are the GPS axis parallel to the map axis.
					// To start, calculate the user grid coordinates (Plotly) from the GPS value. This involves calculating
					// it coordinates on the true north map and then rotating/shifting to the user map.
					const meterGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap);
					// Only display items within valid info and within map.
					if (meterMapInfoOk({ gps, meterID }, map) && meterDisplayableOnMap(imageDimensionNormalized, meterGPSInUserGrid)) {
						// The x, y value for Plotly to use that are on the user map.
						x.push(meterGPSInUserGrid.x);
						y.push(meterGPSInUserGrid.y);
						// Get the bar data to use for the map circle.
						const readingsData = byMeterID[timeInterval.toString()][barDuration.toISOString()];
						if (readingsData !== undefined && !readingsData.isFetching) {
							// Meter name to include in hover on graph.
							const label = state.meters.byMeterID[meterID].name;
							// The usual color for this meter.
							colors.push(getGraphColor(meterID, DataType.Meter));
							if (readingsData.readings === undefined) {
								throw new Error('Unacceptable condition: readingsData.readings is undefined.');
							}
							// Use the most recent time reading for the circle on the map.
							// This has the limitations of the bar value where the last one can include ranges without
							// data (GitHub issue on this).
							// TODO: It might be better to do this similarly to compare. (See GitHub issue)
							const readings = _.orderBy(readingsData.readings, ['startTimestamp'], ['desc']);
							const mapReading = readings[0];
							let timeReading: string;
							let averagedReading = 0;
							if (readings.length === 0) {
								// No data. The next lines causes an issue so set specially.
								// There may be a better overall fix for no data.
								timeReading = 'no data to display';
								size.push(0);
							} else {
								// Shift to UTC since want database time not local/browser time which is what moment does.
								timeReading =
								`${moment(mapReading.startTimestamp).utc().format('LL')} - ${moment(mapReading.endTimestamp).utc().format('LL')}`;
								// The value for the circle is the average daily usage.
								averagedReading = mapReading.reading / barDuration.asDays();
								// The size is the reading value. It will be scaled later.
								size.push(averagedReading);
							}
							// The hover text.
							texts.push(`<b> ${timeReading} </b> <br> ${label}: ${averagedReading} kWh/day`);
						}
					}
				}
			}

			// TODO Using the following seems to have no impact on the code. It has been noticed that this function is called
			// many times for each change. Someone should look at why that is happening and why some have no items in the arrays.
			// if (size.length > 0) {
			// TODO The max circle diameter should come from admin/DB.
			const maxFeatureFraction = 0.15;
			// Find the smaller of width and height. This is used since it means the circle size will be
			// scaled to that dimension and smaller relative to the other coordinate.
			const minDimension = Math.min(imageDimensionNormalized.width, imageDimensionNormalized.height);
			// The circle size is set to area below. Thus, we need to convert from wanting a max
			// diameter of minDimension * maxFeatureFraction to an area.
			const maxCircleSize = Math.PI * Math.pow(minDimension * maxFeatureFraction / 2, 2);
			// Find the largest circle which is usage.
			const largestCircleSize = Math.max(...size);
			// Scale largest circle to the max size and others will be scaled to be smaller.
			// Not that < 1 => a larger circle.
			const scaling = largestCircleSize / maxCircleSize;

			// Per https://plotly.com/javascript/reference/scatter/:
			// The opacity of 0.5 makes it possible to see the map even when there is a circle but the hover
			// opacity is 1 so it is easy to see.
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
		// Either the actual map name or text to say it is not available.
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
	props.config.locale = state.admin.defaultLanguage;
	return props;
}

export default connect(mapStateToProps)(PlotlyChart);

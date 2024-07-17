/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { orderBy } from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import {
	selectAreaUnit, selectBarWidthDays,
	selectGraphAreaNormalization, selectSelectedGroups,
	selectSelectedMeters, selectSelectedUnit
} from '../redux/slices/graphSlice';
import { selectGroupDataById } from '../redux/api/groupsApi';
import { selectMeterDataById } from '../redux/api/metersApi';
import { readingsApi } from '../redux/api/readingsApi';
import { selectUnitDataById } from '../redux/api/unitsApi';
import { useAppSelector } from '../redux/reduxHooks';
import { selectMapChartQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { DataType } from '../types/Datasources';
import { State } from '../types/redux/state';
import { UnitRepresentType } from '../types/redux/units';
import {
	CartesianPoint,
	Dimensions,
	calculateScaleFromEndpoints,
	gpsToUserGrid,
	itemDisplayableOnMap,
	itemMapInfoOk,
	normalizeImageDimensions
} from '../utils/calibration';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';
import getGraphColor from '../utils/getGraphColor';
import translate from '../utils/translate';
import SpinnerComponent from './SpinnerComponent';

/**
 * @returns map component
 */
export default function MapChartComponent() {

	const { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip } = useAppSelector(selectMapChartQueryArgs);
	const { data: meterReadings, isLoading: meterIsFetching } = readingsApi.useBarQuery(meterArgs, { skip: meterShouldSkip });
	const { data: groupData, isLoading: groupIsFetching } = readingsApi.useBarQuery(groupArgs, { skip: groupShouldSkip });

	// converting maps to RTK has been proving troublesome, therefore using a combination of old/new stateSelectors
	const unitID = useAppSelector(selectSelectedUnit);
	const barDuration = useAppSelector(selectBarWidthDays);
	const areaNormalization = useAppSelector(selectGraphAreaNormalization);
	const selectedAreaUnit = useAppSelector(selectAreaUnit);
	const selectedMeters = useAppSelector(selectSelectedMeters);
	const selectedGroups = useAppSelector(selectSelectedGroups);
	const unitDataById = useAppSelector(selectUnitDataById);
	const groupDataById = useAppSelector(selectGroupDataById);
	const meterDataById = useAppSelector(selectMeterDataById);

	// RTK Types Disagree with maps ts types so, use old until migration completer for maps.
	// This is also an issue when trying to refactor maps reducer into slice.
	const selectedMap = useSelector((state: State) => state.maps.selectedMap);
	const byMapID = useSelector((state: State) => state.maps.byMapID);
	const editedMaps = useSelector((state: State) => state.maps.editedMaps);
	if (meterIsFetching || groupIsFetching) {
		return <SpinnerComponent loading width={50} height={50} />;
	}


	// Map to use.
	let map;
	// Holds Plotly mapping info.
	const data = [];
	// Holds the image to use.
	let image;
	if (selectedMap !== 0) {
		const mapID = selectedMap;
		if (byMapID[mapID]) {
			map = byMapID[mapID];
			if (editedMaps[mapID]) {
				map = editedMaps[mapID];
			}
		}
		// Holds the hover text for each point for Plotly
		const hoverText: string[] = [];
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

		// const timeInterval = state.graph.queryTimeInterval;
		// const barDuration = state.graph.barDuration
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
			const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, map.northAngle);
			// Loop over all selected meters. Maps only work for meters at this time.
			// The y-axis label depends on the unit which is in selectUnit state.
			let unitLabel: string = '';
			// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
			// This will probably happen when the page is first loaded.
			if (unitID !== -99) {
				const selectUnitState = unitDataById[unitID];
				if (selectUnitState !== undefined) {
					// Quantity and flow units have different unit labels.
					// Look up the type of unit if it is for quantity/flow (should not be raw) and decide what to do.
					// Bar graphics are always quantities.
					if (selectUnitState.unitRepresent === UnitRepresentType.quantity) {
						// If it is a quantity unit then that is the unit you are graphing but it is normalized to per day.
						unitLabel = selectUnitState.identifier + ' / day';
					} else if (selectUnitState.unitRepresent === UnitRepresentType.flow) {
						// If it is a flow meter then you need to multiply by time to get the quantity unit then show as per day.
						// The quantity/time for flow has varying time so label by multiplying by time.
						// To make sure it is clear, also indicate it is a quantity.
						// Note this should not be used for raw data.
						// It might not be usual to take a flow and make it into a quantity so this label is a little different to
						// catch people's attention. If sites/users don't like OED doing this then we can eliminate flow for these types
						// of graphics as we are doing for rate.
						unitLabel = selectUnitState.identifier + ' * time / day ≡ quantity / day';
					}
					if (areaNormalization) {
						unitLabel += ' / ' + translate(`AreaUnitType.${selectedAreaUnit}`);
					}
				}
			}

			for (const meterID of selectedMeters) {
				// Get meter id number.
				// Get meter GPS value.
				const gps = meterDataById[meterID].gps;
				// filter meters with actual gps coordinates.
				if (gps !== undefined && gps !== null && meterReadings !== undefined) {
					let meterArea = meterDataById[meterID].area;
					// we either don't care about area, or we do in which case there needs to be a nonzero area
					if (!areaNormalization || (meterArea > 0 && meterDataById[meterID].areaUnit != AreaUnitType.none)) {
						if (areaNormalization) {
							// convert the meter area into the proper unit, if needed
							meterArea *= getAreaUnitConversion(meterDataById[meterID].areaUnit, selectedAreaUnit);
						}
						// Convert the gps value to the equivalent Plotly grid coordinates on user map.
						// First, convert from GPS to grid units. Since we are doing a GPS calculation, this happens on the true north map.
						// It must be on true north map since only there are the GPS axis parallel to the map axis.
						// To start, calculate the user grid coordinates (Plotly) from the GPS value. This involves calculating
						// it coordinates on the true north map and then rotating/shifting to the user map.
						const meterGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, map.northAngle);
						// Only display items within valid info and within map.
						if (itemMapInfoOk(meterID, DataType.Meter, map, gps) && itemDisplayableOnMap(imageDimensionNormalized, meterGPSInUserGrid)) {
							// The x, y value for Plotly to use that are on the user map.
							x.push(meterGPSInUserGrid.x);
							y.push(meterGPSInUserGrid.y);
							// Make sure the bar reading data is available. The timeInterval should be fine (but checked) but the barDuration might have changed
							// and be fetching. The unit could change from that menu so also need to check.
							// Get the bar data to use for the map circle.
							// const readingsData = meterReadings[timeInterval.toString()][barDuration.toISOString()][unitID];
							const readingsData = meterReadings[meterID];
							// This protects against there being no readings or that the data is being updated.
							if (readingsData !== undefined && !meterIsFetching) {
								// Meter name to include in hover on graph.
								const label = meterDataById[meterID].identifier;
								// The usual color for this meter.
								colors.push(getGraphColor(meterID, DataType.Meter));
								if (!readingsData) {
									throw new Error('Unacceptable condition: readingsData.readings is undefined.');
								}
								// Use the most recent time reading for the circle on the map.
								// This has the limitations of the bar value where the last one can include ranges without
								// data (GitHub issue on this).
								// TODO: It might be better to do this similarly to compare. (See GitHub issue)
								const readings = orderBy(readingsData, ['startTimestamp'], ['desc']);
								const mapReading = readings[0];
								let timeReading: string;
								let averagedReading = 0;
								if (readings.length === 0) {
									// No data. The next lines causes an issue so set specially.
									// There may be a better overall fix for no data.
									timeReading = 'no data to display';
									size.push(0);
								} else {
									// only display a range of dates for the hover text if there is more than one day in the range
									// Shift to UTC since want database time not local/browser time which is what moment does.
									timeReading = `${moment.utc(mapReading.startTimestamp).format('ll')}`;
									if (barDuration.asDays() != 1) {
										// subtracting one extra day caused by day ending at midnight of the next day.
										// Going from DB unit timestamp that is UTC so force UTC with moment, as usual.
										timeReading += ` - ${moment.utc(mapReading.endTimestamp).subtract(1, 'days').format('ll')}`;
									}
									// The value for the circle is the average daily usage.
									averagedReading = mapReading.reading / barDuration.asDays();
									if (areaNormalization) {
										averagedReading /= meterArea;
									}
									// The size is the reading value. It will be scaled later.
									size.push(averagedReading);
								}
								// The hover text.
								hoverText.push(`<b> ${timeReading} </b> <br> ${label}: ${averagedReading.toPrecision(6)} ${unitLabel}`);
							}
						}
					}
				}
			}

			for (const groupID of selectedGroups) {
				// Get group id number.
				// Get group GPS value.
				const gps = groupDataById[groupID].gps;
				// Filter groups with actual gps coordinates.
				if (gps !== undefined && gps !== null && groupData !== undefined) {
					let groupArea = groupDataById[groupID].area;
					if (!areaNormalization || (groupArea > 0 && groupDataById[groupID].areaUnit != AreaUnitType.none)) {
						if (areaNormalization) {
							// convert the meter area into the proper unit, if needed
							groupArea *= getAreaUnitConversion(groupDataById[groupID].areaUnit, selectedAreaUnit);
						}
						// Convert the gps value to the equivalent Plotly grid coordinates on user map.
						// First, convert from GPS to grid units. Since we are doing a GPS calculation, this happens on the true north map.
						// It must be on true north map since only there are the GPS axis parallel to the map axis.
						// To start, calculate the user grid coordinates (Plotly) from the GPS value. This involves calculating
						// it coordinates on the true north map and then rotating/shifting to the user map.
						const groupGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, map.northAngle);
						// Only display items within valid info and within map.
						if (itemMapInfoOk(groupID, DataType.Group, map, gps) && itemDisplayableOnMap(imageDimensionNormalized, groupGPSInUserGrid)) {
							// The x, y value for Plotly to use that are on the user map.
							x.push(groupGPSInUserGrid.x);
							y.push(groupGPSInUserGrid.y);
							// Make sure the bar reading data is available. The timeInterval should be fine (but checked) but the barDuration might have changed
							// and be fetching. The unit could change from that menu so also need to check.
							// Get the bar data to use for the map circle.
							const readingsData = groupData[groupID];
							// This protects against there being no readings or that the data is being updated.
							if (readingsData && !groupIsFetching) {
								// Group name to include in hover on graph.
								const label = groupDataById[groupID].name;
								// The usual color for this group.
								colors.push(getGraphColor(groupID, DataType.Group));
								if (!readingsData) {
									throw new Error('Unacceptable condition: readingsData.readings is undefined.');
								}
								// Use the most recent time reading for the circle on the map.
								// This has the limitations of the bar value where the last one can include ranges without
								// data (GitHub issue on this).
								// TODO: It might be better to do this similarly to compare. (See GitHub issue)
								const readings = orderBy(readingsData, ['startTimestamp'], ['desc']);
								const mapReading = readings[0];
								let timeReading: string;
								let averagedReading = 0;
								if (readings.length === 0) {
									// No data. The next lines causes an issue so set specially.
									// There may be a better overall fix for no data.
									timeReading = 'no data to display';
									size.push(0);
								} else {
									// only display a range of dates for the hover text if there is more than one day in the range
									timeReading = `${moment.utc(mapReading.startTimestamp).format('ll')}`;
									if (barDuration.asDays() != 1) {
										// subtracting one extra day caused by day ending at midnight of the next day.
										// Going from DB unit timestamp that is UTC so force UTC with moment, as usual.
										timeReading += ` - ${moment.utc(mapReading.endTimestamp).subtract(1, 'days').format('ll')}`;
									}
									// The value for the circle is the average daily usage.
									averagedReading = mapReading.reading / barDuration.asDays();
									if (areaNormalization) {
										averagedReading /= groupArea;
									}
									// The size is the reading value. It will be scaled later.
									size.push(averagedReading);
								}
								// The hover text.
								hoverText.push(`<b> ${timeReading} </b> <br> ${label}: ${averagedReading.toPrecision(6)} ${unitLabel}`);
							}
						}
					}
				}
			}
			// TODO Using the following seems to have no impact on the code. It has been noticed that this function is called
			// many times for each change. Someone should look at why that is happening and why some have no items in the arrays.
			// if (size.length > 0) {
			// TODO The max circle diameter should come from admin/DB.
			const maxFeatureFraction = map.circleSize;
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
				text: hoverText,
				hoverinfo: 'text',
				opacity: 1,
				showlegend: false
			};
			data.push(traceOne);
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

	return (
		<Plot
			data={data as Plotly.Data[]}
			layout={layout}
		/>
	);
}

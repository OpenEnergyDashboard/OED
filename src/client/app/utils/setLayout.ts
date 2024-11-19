import translate from '../utils/translate';




/**
 * Utility to get/ set help text plotlyLayout
 * @param helpText 3D data to be formatted
 * @param fontSize current application state
 * @returns plotly layout object.
 */
export function setHelpLayout(helpText: string = 'Help Text Goes Here', fontSize: number = 28) {
	return {
		'xaxis': {
			'visible': false
		},
		'yaxis': {
			'visible': false
		},
		'annotations': [
			{
				'text': helpText,
				'xref': 'paper',
				'yref': 'paper',
				'showarrow': false,
				'font': { 'size': fontSize }
			}
		]
	};
}

/**
 * Utility to get / set 3D graphic plotlyLayout
 * @param zLabelText 3D data to be formatted
 * @param yDataToRender Data range for yaxis
 * @returns plotly layout object.
 */
export function setThreeDLayout(zLabelText: string = 'Resource Usage', yDataToRender: string[]) {
	// Convert date strings to JavaScript Date objects and then get dataRange
	const dateObjects = yDataToRender.map(dateStr => new Date(dateStr));
	const dataMin = Math.min(...dateObjects.map(date => date.getTime()));
	const dataMax = Math.max(...dateObjects.map(date => date.getTime()));
	const dataRange = dataMax - dataMin;

	//Calculate nTicks for small num of days on y-axis; possibly a better way
	let nTicks, dTick = 'd1';
	if (dataRange <= 864000000) { // 1 Day (need 2 ticks)
		nTicks = 2;
	} else if (dataRange <= 172800000) { // 2 days
		nTicks = 3;
	} else if (dataRange <= 259200000) { // 3 Days
		nTicks = 4;
	} else if (dataRange <= 345600000) { // 4 Days
		nTicks = 5;
	} else { // Anything else; use default nTicks/dTick
		nTicks = 0;
		dTick = '';
	}
	// responsible for setting Labels
	return {
		// Eliminate margin
		margin: { t: 0, b: 0, l: 0, r: 0 },
		// Leaves gaps / voids in graph for missing, undefined, NaN, or null values
		connectgaps: false,
		scene: {
			xaxis: {
				title: { text: translate('threeD.x.axis.label') }
			},
			yaxis: {
				nticks: nTicks,
				dtick: dTick,
				title: { text: translate('threeD.y.axis.label') },
				tickangle: 0 // This lets y-axis dates appear horizontally rather overlapping ticks
			},
			zaxis: {
				title: { text: zLabelText }
			},
			// Somewhat suitable aspect ratio values for 3D Graphs
			aspectratio: {
				x: 1,
				y: 2.75,
				z: 1
			},
			// Somewhat suitable camera eye values for data of zResource[day][interval]
			camera: {
				eye: {
					x: 2.5,
					y: -1.6,
					z: 0.8
				}
			}
		}
	} as Partial<Plotly.Layout>;
}

import * as React from 'react';
import * as d3 from 'd3';
import { useEffect } from 'react';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectAllUnits } from '../../redux/api/unitsApi';
import { selectConversionsDetails } from '../../redux/api/conversionsApi';
// import { useSelector } from 'react-redux';
// import { State } from 'types/redux/state';
// import { noUnitTranslated } from 'utils/input';
// import { MeterData } from 'types/redux/meters';
// import { CurrentUserState } from 'types/redux/currentUser';
// import { UnitData } from 'types/redux/units';
// import { Dispatch } from 'types/redux/actions';
// import { useDispatch } from 'react-redux';
// import { fetchMetersDetailsIfNeeded } from 'actions/meters';

interface Node {
	id: string;
	x?: number;
	y?: number;
}

interface Link {
	source: string;
	target: string;
}

interface GraphData {
	nodes: Node[];
	links: Link[];
}

// interface MeterViewComponentProps {
// 	meter: MeterData;
// 	currentUser: CurrentUserState;
// 	// These two aren't used in this component but are passed to the edit component
// 	// This is done to avoid having to recalculate the possible units sets in each view component
// 	possibleMeterUnits: Set<UnitData>;
// 	possibleGraphicUnits: Set<UnitData>;
// }

export default function CreateVisualUnitMapModalComponent() {
	// const dispatch: Dispatch = useDispatch();

	// useEffect(() => {
	// 	// Makes async call to Meters API for Meters details if one has not already been made somewhere else, stores Meter ids in state
	// 	dispatch(fetchMetersDetailsIfNeeded());
	// }, []);

	// // Access Redux state directly
	// const currentUnitState = useSelector((state: State) => state.units.units);
	// const meterDetails = useSelector((state: State) => state.meters); // Replace with your actual slice name

	// useEffect(() => {
	//   // Check if meterDetails are available
	//   if (meterDetails && meterDetails.length > 0) {
	//     meterDetails.forEach((meter: MeterData) => {
	//       const unitName = (Object.keys(currentUnitState).length === 0 || meter.unitId === -99) ?
	//         noUnitTranslated().identifier : currentUnitState[meter.unitId].identifier;

	//       const graphicName = (Object.keys(currentUnitState).length === 0 || meter.defaultGraphicUnit === -99) ?
	//         noUnitTranslated().identifier : currentUnitState[meter.defaultGraphicUnit].identifier;

	//       console.log('Meter Unit Name:', unitName);
	//       console.log('Meter Graphic Name:', graphicName);
	//       console.log('Meter Details:', meter);
	//     });
	//   }
	// }, [currentUnitState, meterDetails]);

	const jsonData: { nodes: any[], links: any[] } = {
		nodes: [],
		links: []
	};

	const unitData = useAppSelector(selectAllUnits);
	unitData.map(function (value) {
		jsonData.nodes.push({
			'name': value.name,
			'id': value.id
		});
	});

	const conversionData = useAppSelector(selectConversionsDetails);
	conversionData.map(function (value) {
		jsonData.links.push({
			'source': value.sourceId,
			'target': value.destinationId
		});
	});

	useEffect(() => {
		const margin = { top: 10, right: 30, bottom: 30, left: 40 };
		const width = 1200 - margin.left - margin.right;
		const height = 600 - margin.top - margin.bottom;

		const svg = d3.select('#sample')
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		d3.json<GraphData>('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_network.json').then(function (data) {
			if (!data) {
				console.error('Data is undefined or null.');
				return;
			}

			// connection link style
			const link = svg.selectAll('line')
				.data(jsonData.links)
				.enter().append('line')
				.style('stroke', '#aaa');

			// node style
			const node = svg.selectAll('circle')
				.data(jsonData.nodes)
				.enter().append('circle')
				.attr('r', 15)
				.style('fill', '#69b3a2');

			d3.forceSimulation(jsonData.nodes)
				.force('link', d3.forceLink()
					.id(function (d) { return (d as Node).id; })
					.links(jsonData.links)
				)
				.force('charge', d3.forceManyBody().strength(-50))
				.force('center', d3.forceCenter(width / 2, height / 2))
				.on('tick', ticked);

			function ticked() {
				link
					.attr('x1', function (d) { return (d.source as d3.SimulationNodeDatum).x ?? 0; })
					.attr('y1', function (d) { return (d.source as d3.SimulationNodeDatum).y ?? 0; })
					.attr('x2', function (d) { return (d.target as d3.SimulationNodeDatum).x ?? 0; })
					.attr('y2', function (d) { return (d.target as d3.SimulationNodeDatum).y ?? 0; });

				node
					.attr('cx', function (d) { return (d.x as number) + 6; })
					.attr('cy', function (d) { return (d.y as number) - 6; });
			}

		}).catch(error => {
			console.error('Error loading data:', error);
		});
	}, []); // Empty dependency array to run the effect only once

	return (
		<div>
			<h2>Sample Network Graph</h2>
			<div id="sample"></div>
		</div>
	);
}
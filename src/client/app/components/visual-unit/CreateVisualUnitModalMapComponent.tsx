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

	const data: { nodes: any[], links: any[] } = {
		nodes: [],
		links: []
	};

	const unitData = useAppSelector(selectAllUnits);
	unitData.map(function (value) {
		data.nodes.push({
			'name': value.name,
			'id': value.id
		});
	});

	const conversionData = useAppSelector(selectConversionsDetails);
	conversionData.map(function (value) {
		data.links.push({
			'source': value.sourceId,
			'target': value.destinationId
		});
	});

	useEffect(() => {
		const margin = { top: 10, right: 30, bottom: 30, left: 40 };
		const width = 600 - margin.left - margin.right;
		const height = 600 - margin.top - margin.bottom;

		const nodes = data.nodes.map(d => ({...d}));
		const links = data.links.map(d => ({...d}));

		const simulation = d3.forceSimulation(nodes)
			.force('link', d3.forceLink(links).id((d: any) => d.id))
			.force('charge', d3.forceManyBody().strength(-200))
			.force('x', d3.forceX())
			.force('y', d3.forceY());

		const svg = d3.select('#sample')
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.attr('viewBox',
				[-(width + margin.left + margin.right) / 2, -(height + margin.top + margin.bottom) / 2,
					width + margin.left + margin.right, height + margin.top + margin.bottom]
			)
			.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// connection link style
		const link = svg.selectAll('line')
			.data(links)
			.enter().append('line')
			.style('stroke', '#aaa')
			.attr('stroke-width', 3);

		// node style
		const node = svg.selectAll('.node')
			.data(nodes)
			.enter().append('circle')
			.attr('r', 12)
			.style('fill', '#69b3a2');

		// label style
		const label = svg.selectAll('.label')
			.data(nodes)
			.enter()
			.append('text')
			.text(function (d) { return d.name; })
			.style('text-anchor', 'middle')
			.style('fill', '#555')
			.style('font-family', 'Arial')
			.style('font-size', 12);

		simulation.on('tick', () => {
			link
				.attr('x1', d => d.source.x)
				.attr('y1', d => d.source.y)
				.attr('x2', d => d.target.x)
				.attr('y2', d => d.target.y);

			node
				.attr('cx', d => d.x)
				.attr('cy', d => d.y);

			label
				.attr('x', function(d){ return d.x; })
				.attr('y', function (d) {return d.y - 10; });
		});

	}, []); // Empty dependency array to run the effect only once

	return (
		<div>
			<div id="sample"></div>
		</div>
	);
}
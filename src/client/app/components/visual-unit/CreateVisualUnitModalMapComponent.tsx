import * as React from 'react';
import * as d3 from 'd3';
import { useEffect } from 'react';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectAllUnits } from '../../redux/api/unitsApi';
import { selectConversionsDetails } from '../../redux/api/conversionsApi';

export default function CreateVisualUnitMapModalComponent() {

	const unitData = useAppSelector(selectAllUnits);
	const conversionData = useAppSelector(selectConversionsDetails);

	const data: { nodes: any[], links: any[] } = {
		nodes: [],
		links: []
	};
	unitData.map(function (value) {
		data.nodes.push({'name': value.name,
			'id': value.id
		});
	});
	conversionData.map(function (value) {
		data.links.push({
			'source': value.sourceId,
			'target': value.destinationId,
			'bidirectional': value.bidirectional
		});
	});

	useEffect(() => {
		const width = window.innerWidth;
		const height = 750;

		const nodes = data.nodes.map(d => ({...d}));
		const links = data.links.map(d => ({...d}));

		const simulation = d3.forceSimulation(nodes)
			.force('link', d3.forceLink(links)
				.id((d: any) => d.id)
				.distance(60)
			)
			.force('charge', d3.forceManyBody()
				.strength(-500)
			)
			.force('x', d3.forceX())
			.force('y', d3.forceY());

		const svg = d3.select('#sample')
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', [-width / 2, -height / 2, width, height])
			.attr('style', 'max-width: 100%; height: auto;')
			.append('g');

		svg.append('defs').append('marker')
			.attr('id', 'arrow-end')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 20)
			.attr('refY', 0)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto')
			.append('svg:path')
			.attr('d', 'M0,-5L10,0L0,5');

		svg.append('defs').append('marker')
			.attr('id', 'arrow-start')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 20)
			.attr('refY', 0)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto-start-reverse')
			.append('svg:path')
			.attr('d', 'M0,-5L10,0L0,5');

		const link = svg.selectAll('line')
			.data(links)
			.enter().append('line')
			.style('stroke', '#aaa')
			.attr('stroke-width', 3)
			.attr('marker-end', 'url(#arrow-end)')
			.attr('marker-start', d => d.bidirectional === true ? 'url(#arrow-start)' : '');

		const node = svg.selectAll('.node')
			.data(nodes)
			.enter().append('circle')
			.attr('r', 16)
			.style('fill', '#69b3a2');

		node.call(d3.drag()
			.on('start', dragstart)
			.on('drag', dragged)
			.on('end', dragend));

		const label = svg.selectAll('.label')
			.data(nodes)
			.enter()
			.append('text')
			.text(function (d) { return d.name; })
			.style('text-anchor', 'middle')
			.style('fill', '#000')
			.style('font-family', 'Arial')
			.style('font-size', 14);

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
				.attr('y', function (d) {return d.y + 15; });
		});

		// eslint-disable-next-line jsdoc/require-jsdoc
		function dragstart(event: any) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			event.subject.fx = event.subject.x;
			event.subject.fy = event.subject.y;
		}

		// eslint-disable-next-line jsdoc/require-jsdoc
		function dragged(event: any) {
			event.subject.fx = event.x;
			event.subject.fy = event.y;
		}

		// eslint-disable-next-line jsdoc/require-jsdoc
		function dragend(event: any) {
			if (!event.active) simulation.alphaTarget(0);
			event.subject.fx = null;
			event.subject.fy = null;
		}

	}, []); // Empty dependency array to run the effect only once

	return (
		<div>
			<div id="sample"></div>
		</div>
	);

}
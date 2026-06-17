/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as d3 from 'd3';
import { useEffect, useState, useRef } from 'react';
import { useTranslate } from '../../redux/componentHooks';
import { FormattedMessage } from 'react-intl';
import { Button, Input, Label } from 'reactstrap';
import { useAppSelector } from '../../redux/reduxHooks';
import { GroupData } from '../../../../client/app/types/redux/groups';
import { MeterData } from '../../../../client/app/types/redux/meters';
import { selectAllMeters } from '../../redux/api/metersApi';
import { selectAllGroups, groupsApi } from '../../redux/api/groupsApi';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';

// Declare node types for groups and meters, will determine every node's design schema on the graphic
enum GroupNodeType {
	unselectedGroup = 'unselectedGroup',
	selectedGroup = 'selectedGroup',
	childGroup = 'childGroup',
	deepGroup = 'deepGroup'
}

enum MeterNodeType {
	meter = 'meter',
	childMeter = 'childMeter',
	deepMeter = 'deepMeter',
}

type AllNodeType = GroupNodeType | MeterNodeType;

/**
 * Visual graph component that shows the relationship between all groups and meters
 * entered by an admin
 * @returns D3 force graph visual
 */
export const CreateVisualGroupComponent: React.FC = () => {
	const translate = useTranslate();
	try {

		const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
		const [snapBackEnabled, setSnapBackEnabled] = useState<boolean>(true);
		const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
		const nodePositionsRef = useRef<Record<string, { x: number, y: number }>>({});

		// Get Meter data from redux
		const allMeters: MeterData[] = useAppSelector(selectAllMeters);

		// Fetch deep groups data from API
		const { data: deepGroupsData = [], isLoading: deepGroupsLoading } = groupsApi.useGetAllGroupsDeepGroupsQuery();

		// Get all Group data from Redux
		const allGroups: GroupData[] = useAppSelector(selectAllGroups);

		// Merge deepGroups data with allGroups
		const mergedGroups: GroupData[] = allGroups.map(group => {
			const deepGroupData = deepGroupsData.find(dg => dg.id === group.id);
			return {
				...group,
				deepGroups: deepGroupData?.deepGroups || []
			};
		});

		const selectedGroup: GroupData | undefined = mergedGroups.find(group => group.id === selectedGroupId);

		// Get all meters who are in any way a children of a group
		const groupedMeterIds: Set<number> = new Set(
			mergedGroups.flatMap(group => group.deepMeters)
		);

		// Only keep meters who have a relationship with a group
		const groupedMeters: MeterData[] = allMeters.filter(meterData => groupedMeterIds.has(meterData.id));

		// Sort meters to minimize distance between meters that share groups
		const sortMetersByGroupRelationships = (meters: MeterData[]): MeterData[] => {
			let sortedMeters: MeterData[] = [];
			if (meters.length <= 1) {
				return sortedMeters = meters;
			} else {
				const usedMeterIds = new Set<number>();

				// Start with the first meter
				sortedMeters.push(meters[0]);
				usedMeterIds.add(meters[0].id);

				// Greedy algorithm: always pick the meter that shares the most groups with the last placed meter
				while (sortedMeters.length < meters.length) {
					const lastMeter = sortedMeters[sortedMeters.length - 1];
					let bestNextMeter: MeterData | null = null;
					let maxSharedGroups = -1;

					// Find the meter that shares the most groups with the last placed meter
					for (const meter of meters) {
						// Only do if this meter is used.
						if (!usedMeterIds.has(meter.id)) {

							// Count shared groups between lastMeter and current meter
							const sharedGroups = mergedGroups.filter(group =>
								group.deepMeters.includes(lastMeter.id) &&
								group.deepMeters.includes(meter.id)
							).length;

							// Update values based on current meter
							if (sharedGroups > maxSharedGroups) {
								maxSharedGroups = sharedGroups;
								bestNextMeter = meter;
							}
						}
					}

					// If no shared groups, pick the first unused meter
					if (bestNextMeter === null) {
						bestNextMeter = meters.find(m => !usedMeterIds.has(m.id))!;
					}

					sortedMeters.push(bestNextMeter);
					usedMeterIds.add(bestNextMeter.id);
				}
			}

			return sortedMeters;
		};

		const sortedGroupedMeters = sortMetersByGroupRelationships(groupedMeters);

		// Create color schema for meter and group props
		const allNodeTypes: AllNodeType[] = [...Object.values(MeterNodeType), ...Object.values(GroupNodeType)];
		const colors = ['#000000', '#DAE8FC', '#D5E8D4', '#dc9b92', '#FFF2CC', '#DAE8FC', '#D5E8D4'];
		const colorSchema = d3.scaleOrdinal<string, string>()
			.domain(allNodeTypes)
			.range(colors);

		// Create stroke schema for meter and group props
		interface StrokeStyle {
			color: string;
			width: number;
			dasharray: string;
			opacity: number;
			zIndex: number;
		}

		const strokeStyles: StrokeStyle[] = [
			{ color: '#000000', width: 1, dasharray: '5,5', opacity: 0.5, zIndex: -1 },  // meter (default)
			{ color: '#6C8EBF', width: 3, dasharray: 'none', opacity: 1.0, zIndex: 1 }, // childMeter
			{ color: '#82B366', width: 3, dasharray: 'none', opacity: 1.0, zIndex: 1 }, // deepMeter
			{ color: '#000000', width: 1, dasharray: '5,5', opacity: 0.5, zIndex: -1 },  // group (default)
			{ color: '#D6B656', width: 3, dasharray: 'none', opacity: 1.0, zIndex: 1 }, // selectedGroup
			{ color: '#6C8EBF', width: 3, dasharray: 'none', opacity: 1.0, zIndex: 1 }, // childGroup
			{ color: '#82B366', width: 3, dasharray: 'none', opacity: 1.0, zIndex: 1 }  // deepGroup
		];

		const strokeSchema = d3.scaleOrdinal<string, StrokeStyle>()
			.domain(allNodeTypes)
			.range(strokeStyles);

		// Create data container to pass to D3 to force graph
		const data: { nodes: any[], links: any[] } = {
			nodes: [],
			links: []
		};

		//Add meters to data container
		sortedGroupedMeters.map(value => {
			let nodeType: MeterNodeType = MeterNodeType.meter;

			if (selectedGroup) {
				if (selectedGroup.childMeters.includes(value.id)) {
					//The current meter is a child meter
					nodeType = MeterNodeType.childMeter;
				} else if (selectedGroup.deepMeters.includes(value.id)) {
					//The current meter is a deep meter
					nodeType = MeterNodeType.deepMeter;
				}
			}

			data.nodes.push({
				'name': value.name,
				'id': `meter_${value.id}`,
				'meterType': value.meterType,
				'type': nodeType
			});
		});

		//Add groups to data container
		mergedGroups.map(value => {
			let nodeType: GroupNodeType = GroupNodeType.unselectedGroup;

			if (selectedGroup) {
				if (selectedGroupId === value.id) {
					//The current group is the selected group
					nodeType = GroupNodeType.selectedGroup;
				} else if (selectedGroup.childGroups.includes(value.id)) {
					//The current group is a direct child of the selected group
					nodeType = GroupNodeType.childGroup;
				}
				else if (selectedGroup.deepGroups.includes(value.id)) {
					// The current group is a deep child of the selected group
					nodeType = GroupNodeType.deepGroup;
				}
			}

			data.nodes.push({
				'name': value.name,
				'id': `group_${value.id}`,
				'childGroups': value.childGroups,
				'childMeters': value.childMeters,
				'type': nodeType
			});
		});

		mergedGroups.forEach(group => {
			// node type of child groups of the current group
			let childGroupType: GroupNodeType = GroupNodeType.unselectedGroup;

			// node type of child meters of the current group
			let childMeterType: MeterNodeType = MeterNodeType.meter;

			if (selectedGroup) {
				if (selectedGroupId === group.id) {
					// current group is the selected group
					childGroupType = GroupNodeType.childGroup;
					childMeterType = MeterNodeType.childMeter;
				} else if (selectedGroup.childGroups.includes(group.id) || selectedGroup.deepGroups.includes(group.id)) {
					// current group is a child/deep group of the selected group
					childGroupType = GroupNodeType.deepGroup;
					childMeterType = MeterNodeType.deepMeter;
				}
			}

			group.childGroups.forEach(childGroup => {
				data.links.push({
					'target': `group_${group.id}`,
					'source': `group_${childGroup}`,
					'type': 'Group-to-Group',
					'sourceType': childGroupType
				});
			});

			group.childMeters.forEach(meter => {
				data.links.push({
					'target': `group_${group.id}`,
					'source': `meter_${meter}`,
					'type': 'meter-to-group',
					'sourceType': childMeterType
				});
			});
		});

		// Uses Topological Sorting to sort groups into columns based on their depth
		const topSortAndPlaceGroups = (groups: GroupData[]): GroupData[][] => {
			// Build adjacency list (child -> parents relationship)
			const adjacencyList = new Map<number, number[]>();
			const inDegree = new Map<number, number>();

			// Initialize
			groups.forEach(group => {
				adjacencyList.set(group.id, []);
				inDegree.set(group.id, 0);
			});

			//For each group, add edges from child to parent
			groups.forEach(group => {
				group.childGroups.forEach(childGroupId => {
					// Add edge from child to parent
					const childEdges = adjacencyList.get(childGroupId) || [];
					childEdges.push(group.id);
					adjacencyList.set(childGroupId, childEdges);

					// Increment in-degree of parent
					inDegree.set(group.id, (inDegree.get(group.id) || 0) + 1);
				});
			});

			// Utilizing Kahn's algorithm
			const queue: number[] = [];
			const result: GroupData[] = [];

			// Add all groups who only have meters as children( with in-degree of 0)
			groups.forEach(group => {
				if ((inDegree.get(group.id) || 0) === 0) {
					queue.push(group.id);
				}
			});

			while (queue.length > 0) {
				const currentId = queue.shift()!;
				const currentGroup = groups.find(g => g.id === currentId);
				if (currentGroup) {
					result.push(currentGroup);
				}

				// Process children of current group
				const children = groups.filter(g => g.childGroups.includes(currentId));
				children.forEach(child => {
					inDegree.set(child.id, (inDegree.get(child.id) || 0) - 1);
					if ((inDegree.get(child.id) || 0) === 0) {
						queue.push(child.id);
					}
				});
			}

			// Error check for cycles. If the groups are properly formed then this should never happen.
			if (result.length !== groups.length) {
				// This is an internal error that is caught within this component to deal with it.
				throw new Error('Cycle detected in group hierarchy');
			}

			//Place in columns based on topological order
			const columns: GroupData[][] = [];
			const groupToColumn = new Map<number, number>();

			result.forEach(group => {
				let maxParentColumn = -1;

				// Find the maximum column for every group
				group.childGroups.forEach(childGroupId => {
					const parentColumn = groupToColumn.get(childGroupId) || 0;
					maxParentColumn = Math.max(maxParentColumn, parentColumn);
				});

				const columnIndex = maxParentColumn + 1;

				// Ensure we have enough columns
				while (columns.length <= columnIndex) {
					columns.push([]);
				}

				columns[columnIndex].push(group);
				groupToColumn.set(group.id, columnIndex);
			});

			return columns;
		};

		const columns = topSortAndPlaceGroups(mergedGroups);

		// Sort each column to ensure that groups are closer to their children, minimizes intersecting edges/links
		const sortGroupsByChildren = (columns: GroupData[][], meters: MeterData[]): GroupData[][] => {

			const sortedGroups: GroupData[][] = [];

			if (columns.length == 0) {
				return columns;
			}

			columns.forEach((column, columnIndex) => {
				if (column.length <= 1) {
					sortedGroups.push(column);
					return;
				}

				const currentSortedColumn: GroupData[] = [];

				if (columnIndex < 1) {
					for (const meter of meters) {
						const parentGroups = mergedGroups.filter(group => group.childMeters.includes(meter.id) && column.includes(group));

						// Saving the length before pushing current parent group.
						// This ensures that a group with a single meter child is
						// placed closer to it's meter child
						const currentLength = currentSortedColumn.length;
						for (const parent of parentGroups) {
							if (currentSortedColumn.includes(parent)) {
								continue;
							}

							// If any parent group has the meter as their only child, then insert that parent
							// before any of the other parents currently in parentGroup. To ensure less edge interceptions
							if (parent.childMeters.length == 1 && currentLength > 0) {
								currentSortedColumn.splice(currentLength, 0, parent);
								continue;
							}

							currentSortedColumn.push(parent);
						}
					}
				}
				else {

					const previousColumn: GroupData[] = columns[columnIndex - 1];

					for (const currentGroup of previousColumn) {
						const parentGroups = mergedGroups.filter(group => group.childGroups.includes(currentGroup.id) && column.includes(group));

						if (parentGroups.length === 0) {
							continue;
						}

						// Saving the length before pushing current parent group.
						// This ensures that a group with a single meter child is
						// placed closer to it's meter child
						const currentLength = currentSortedColumn.length;
						for (const parent of parentGroups) {
							if (currentSortedColumn.includes(parent)) {
								continue;
							}

							// If any parent group has the meter as their only child, then insert that parent
							// before any of the other parents currently in parentGroup. To ensure less edge interceptions
							if (parent.childGroups.length == 1 && currentLength > 0) {
								currentSortedColumn.splice(currentLength, 0, parent);
								continue;
							}

							currentSortedColumn.push(parent);
						}

					}
				}

				sortedGroups.push(currentSortedColumn);
			});

			return sortedGroups;
		};

		const sortedFinally = sortGroupsByChildren(columns, sortedGroupedMeters);

		// visuals start here

		// This useEffect is needed to sync up with D3 and work correctly.
		useEffect(() => {
			// Hiding visual flash
			d3.select('#sample').style('opacity', '0');

			// View-box dimensions
			const width = window.innerWidth;
			const height = 750;

			// Grab data via shallow copy
			const nodes = data.nodes.map(d => ({ ...d }));
			const links = data.links.map(d => ({ ...d }));

			const meterTypes: MeterNodeType[] = [...Object.values(MeterNodeType)];
			const groupTypes: GroupNodeType[] = [...Object.values(GroupNodeType)];

			// Separate meter and group nodes
			const meterNodeData = nodes.filter(node => meterTypes.includes(node.type));
			const groupNodeData = nodes.filter(node => groupTypes.includes(node.type));

			// Position meter nodes in a column on the left
			// 100px from left edge
			const meterColumnX = -width / 2 + 200;
			// Space between meters
			const meterSpacing = 80;
			// Start 100px from top
			const meterStartY = -height / 2 + 100;

			meterNodeData.forEach((node, index) => {
				node.x = meterColumnX;
				node.y = meterStartY + (index * meterSpacing);
				//Fixed x and y positions
				node.fx = node.x;
				node.fy = node.y;
			});

			// Position group nodes in columns
			const groupColumnX = -width / 2 + 400;
			// Space between groups in a column
			const groupSpacing = 80;
			const groupStartY = -height / 2 + 100;
			// Space between columns
			const columnSpacing = 200;

			// Iterate through each column
			sortedFinally.forEach((column, columnIndex) => {
				// Iterate through each group in the current column
				column.forEach((group, groupIndex) => {
					// Find the corresponding node in groupNodeData
					const node = groupNodeData.find(n => n.id === `group_${group.id}`);
					if (node) {
						// Position the group in its column
						node.x = groupColumnX + (columnIndex * columnSpacing);
						node.y = groupStartY + (groupIndex * groupSpacing);
						// Fix position of x and y-coordinates
						node.fx = node.x;
						node.fy = node.y;
					}
				});
			});

			groupNodeData.forEach(node => {
				node.originalX = node.x;
				node.originalY = node.y;
			});

			const saved = nodePositionsRef.current;
			nodes.forEach(node => {
				const pos = saved[node.id];
				if (pos) {
					node.x = pos.x;
					node.y = pos.y;
					node.fx = pos.x;
					node.fy = pos.y;
				}
			});

			// Calculate SVG dimensions immediately after positioning meter nodes
			const calculateSvgDimensions = () => {
				const node = g.node();
				// Exit if node doesn't exist yet
				if (!node) {
					return;
				}

				// Get the bounding box of all content
				const bbox = node.getBBox();

				// Add padding
				const padding = 50;
				const contentWidth = bbox.width + (padding * 2);
				const contentHeight = bbox.height + (padding * 2);

				// Update SVG dimensions
				svg
					.attr('viewBox', [bbox.x - padding, bbox.y - padding, contentWidth, contentHeight]);
			};

			const simulation = d3.forceSimulation(nodes)
				.force('link', d3.forceLink(links)
					// Set all link ids (from data.links)
					.id((d: any) => d.id)
					//link length is 90
					.distance(90)
				)
				.force('x', d3.forceX().strength(0.1)) // Weaker force for groups
				.force('y', d3.forceY().strength(0.1)); // Weaker force for groups

			const zoom = d3.zoom()
				.scaleExtent([0.5, 32])
				.on('zoom', zoomed);

			const svg = d3.select('#sample')
				.append('svg')
				.attr('width', width)
				.attr('height', height)
				.attr('viewBox', [-width / 2, -height / 2, width, height])
				.attr('style', 'max-width: 100%; height: 100%; overflow: visible');

			const g = svg
				.append('g');

			svg.call(zoom).call(zoom.transform, zoomTransformRef.current);

			// Zoom in
			d3.select('#zoom-in').on('click', () => {
				svg.transition().call(zoom.scaleBy, 1.2);
			});

			// Zoom out
			d3.select('#zoom-out').on('click', () => {
				svg.transition().call(zoom.scaleBy, 0.8);
			});

			// Reset View (Zoom Level and Panning back to default)
			d3.select('#reset-view').on('click', () => {
				svg.transition().call(zoom.transform, d3.zoomIdentity);
			});

			// Reset Layout (group node positions back to default)
			d3.select('#reset-layout').on('click', () => {
				nodePositionsRef.current = {};
				groupNodeData.forEach(n => {
					n.x = n.originalX;
					n.y = n.originalY;
					n.fx = n.originalX;
					n.fy = n.originalY;
				});
				simulation.alpha(0.3).restart();
			});

			// End arrow heads - create separate markers for each node type
			const defs = g.append('defs');

			allNodeTypes.forEach(nodeType => {
				const strokeStyle = strokeSchema(nodeType);
				const markerId = `arrow-end-${nodeType}`;

				defs.append('marker')
					.attr('id', markerId)
					.attr('viewBox', '0 -5 10 10')
					.attr('refX', 10)
					.attr('refY', 0)
					.attr('markerWidth', 8)
					.attr('markerHeight', 6)
					// Fixed size regardless of stroke width
					.attr('markerUnits', 'userSpaceOnUse')
					.attr('orient', 'auto')
					.append('svg:path')
					.attr('d', 'M0,-5L10,0L0,5')
					.attr('fill', strokeStyle.color)
					.attr('stroke', strokeStyle.color);
			});

			// Link Style
			const link = g.selectAll('line')
				.data(links)
				.enter().append('line')
				.attr('stroke', d => strokeSchema(d.sourceType).color)
				.attr('stroke-width', d => strokeSchema(d.sourceType).width)
				.attr('stroke-dasharray', d => strokeSchema(d.sourceType).dasharray)
				.attr('marker-end', d => `url(#arrow-end-${d.sourceType})`)
				.lower();

			// Unselected/Default Group Node Style
			const groupNodes = g.selectAll('.group-node')
				.data(groupNodeData)
				.enter().append('circle')
				.attr('r', 20)
				.attr('fill', d => colorSchema(d.type))
				.attr('data-id', d => d.id)
				.style('cursor', 'pointer')
				.on('click', (event, d) => onGroupSelect(d.id))
				.attr('stroke', d => strokeSchema(d.type).color)
				.attr('stroke-width', d => strokeSchema(d.type).width)
				.attr('stroke-dasharray', d => strokeSchema(d.type).dasharray)
				.attr('stroke-opacity', d => strokeSchema(d.type).opacity)
				.attr('fill-opacity', 1);

			// Meter Node Style
			const meterNodes = g.selectAll('.meter-node')
				.data(meterNodeData)
				.enter().append('rect')
				.attr('width', 60)
				.attr('height', 40)
				.attr('fill', d => colorSchema(d.type))
				.attr('fill-opacity', d => (d.type === MeterNodeType.childMeter || d.type === MeterNodeType.deepMeter) ? 1 : 0)
				.attr('stroke', d => strokeSchema(d.type).color)
				.attr('stroke-width', d => strokeSchema(d.type).width)
				.attr('stroke-dasharray', d => strokeSchema(d.type).dasharray)
				.attr('stroke-opacity', d => strokeSchema(d.type).opacity)
				//Center the rectangle
				.attr('x', d => d.x - 30)
				.attr('y', d => d.y - 20);

			// Drag behavior - only for group nodes
			groupNodes.call(d3.drag()
				.on('start', dragstart)
				.on('drag', dragged)
				.on('end', dragend));

			// Node label style
			const label = g.selectAll('.label')
				.data(nodes)
				.enter()
				.append('text')
				.text(function (d) { return d.name; })
				.attr('text-anchor', 'middle')
				.attr('fill', '#000')
				.attr('font-family', 'Arial')
				.attr('font-size', 10);

			// Update element positions when moved
			simulation.on('tick', () => {
				link
					.attr('x1', d => {
						// translate where links begin to have them start at
						// the edge of an element instead of the center of one

						// if link starts from a meter
						if (d.type == 'meter-to-group') {

							// take half of the width of the meter's rectangle element
							const halfWidth = 30;

							// Translate the beginning of the link
							// by the halfwidth, to have it start at the edge
							return d.source.x + halfWidth;
						}
						else {
							// link starts from a group node

							// radius for a group node is set to 20 for all nodes
							const radius = 20;

							// translate link by the radius to have it start from the edge
							return d.source.x + radius;
						}
					})
					.attr('y1', d => d.source.y)
					.attr('x2', d => {
						// Get the x-distance and the y-distance from source to target
						const dx = d.target.x - d.source.x;
						const dy = d.target.y - d.source.y;

						// Calculate the hypotenuse/length the link should be
						const length = Math.sqrt(dx * dx + dy * dy);
						const nodeRadius = 20;

						// Translate link endpoint from node center to node edge by scaling the direction vector by node radius
						return d.target.x - (dx / length) * nodeRadius;

					})
					.attr('y2', d => {
						// Get the x-distance and the y-distance from source to target
						const dx = d.target.x - d.source.x;
						const dy = d.target.y - d.source.y;

						// Calculate the hypotenuse/length the link should be
						const length = Math.sqrt(dx * dx + dy * dy);
						const nodeRadius = 20;

						// Translate link endpoint from node center to node edge by scaling the direction vector by node radius
						return d.target.y - (dy / length) * nodeRadius;
					});

				groupNodes
					.attr('cx', d => d.fx || d.x)
					.attr('cy', d => d.fy || d.y);

				meterNodes
					.attr('x', d => (d.fx || d.x) - 30)
					.attr('y', d => (d.fy || d.y) - 20);

				label
					.attr('x', d => d.fx || d.x)
					.attr('y', d => (d.fy || d.y) - 25);
			});

			// eslint-disable-next-line jsdoc/require-jsdoc
			function dragstart(event: any) {
				if (!event.active) {
					simulation.alphaTarget(0.3).restart();
				}

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
				if (!event.active) {
					simulation.alphaTarget(0);
				}

				if (snapBackEnabled) {
					event.subject.fx = null;
					event.subject.fy = null;

					d3.select(event.subject)
						.transition()
						.duration(2000)
						.ease(d3.easeLinear)
						.tween('position', () => {
							const startX = event.subject.x;
							const startY = event.subject.y;
							const endX = event.subject.originalX;
							const endY = event.subject.originalY;

							return (t: number) => {
								event.subject.x = startX + (endX - startX) * t;
								event.subject.y = startY + (endY - startY) * t;
							};
						})
						.on('end', () => {
							event.subject.fx = event.subject.originalX;
							event.subject.fy = event.subject.originalY;
						});
				} else {
					event.subject.fx = event.x;
					event.subject.fy = event.y;
					nodePositionsRef.current[event.subject.id] = { x: event.x, y: event.y };
				}
			}

			/**
			 * TODO
			 * @param event TODO
			 */
			function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
				zoomTransformRef.current = event.transform;
				g.attr('transform', event.transform.toString());
			}

			// Color Legend
			const legend = g.append('g')
				.attr('transform', `translate(${-width / 2}, ${-height / 2 + 20})`);

			colorSchema.domain().forEach((item, i) => {
				const legendEntry = legend.append('g')
					.attr('transform', `translate(0, ${i * 40})`);

				if (item == MeterNodeType.meter) {
					legendEntry.append('rect')
						.attr('width', 40)
						.attr('height', 25)
						.attr('fill-opacity', 0)
						.attr('stroke', colorSchema(item))
						.attr('stroke-width', 2)
						.attr('stroke-dasharray', '5,5')
						// Center the rectangle
						.attr('x', -5)
						.attr('y', 0);
				}
				else if (item == MeterNodeType.childMeter) {
					legendEntry.append('rect')
						.attr('width', 40)
						.attr('height', 25)
						.attr('fill', colorSchema(item))
						.attr('stroke', 'black')
						.attr('stroke-width', 2)
						// Center the rectangle
						.attr('x', -5)
						.attr('y', 0);
				}
				else if (item == MeterNodeType.deepMeter) {
					legendEntry.append('rect')
						.attr('width', 40)
						.attr('height', 25)
						.attr('fill', colorSchema(item))
						.attr('stroke', 'black')
						.attr('stroke-width', 2)
						// Center the rectangle
						.attr('x', -5)
						.attr('y', 0);
				}
				else if (item == GroupNodeType.unselectedGroup) {
					legendEntry.append('circle')
						.attr('r', 15)
						// Center the circle horizontally
						.attr('cx', 15)
						// Center the circle vertically
						.attr('cy', 15)
						.attr('fill', colorSchema(item))
						.attr('fill-opacity', 1)
						.attr('stroke', 'black')
						.attr('stroke-width', 1)
						.attr('stroke-dasharray', ('5,5'));
				}
				else if (item == GroupNodeType.selectedGroup) {
					legendEntry.append('circle')
						.attr('r', 15)
						// Center the circle horizontally
						.attr('cx', 15)
						// Center the circle vertically
						.attr('cy', 15)
						.attr('fill', colorSchema(item))
						.attr('fill-opacity', 0.5)
						.attr('stroke', 'black')
						.attr('stroke-width', 1);
				}
				else if (item == GroupNodeType.childGroup) {
					legendEntry.append('circle')
						.attr('r', 15)
						// Center the circle horizontally
						.attr('cx', 15)
						// Center the circle vertically
						.attr('cy', 15)
						.attr('fill', colorSchema(item))
						.attr('fill-opacity', 0.5)
						.attr('stroke', 'black')
						.attr('stroke-width', 1);
				}
				else if (item == GroupNodeType.deepGroup) {
					legendEntry.append('circle')
						.attr('r', 15)
						// Center the circle horizontally
						.attr('cx', 15)
						// Center the circle vertically
						.attr('cy', 15)
						.attr('fill', colorSchema(item))
						.attr('fill-opacity', 0.5)
						.attr('stroke', 'black')
						.attr('stroke-width', 1);
				}

				// Text label
				legendEntry.append('text')
					// Position the text to the right of the circle
					.attr('x', 40)
					// Align the text vertically with the circle
					.attr('y', 20)
					.style('fill', '#000')
					.style('font-size', '12px')
					.style('alignment-middle', 'middle')
					// internationalizing color legend text
					.text(translate(`legend.graph.text.${item}`));
			});

			// Calculate SVG dimensions after all elements are created
			setTimeout(() => {
				calculateSvgDimensions();
				requestAnimationFrame(() => {
					// restore opacity now that graphic is built
					d3.select('#sample').style('opacity', '1');
				});
			}, 0);

			// Cleanup function - runs when component unmounts or dependencies change
			return () => {
				const existingSvg = d3.select('#sample svg');
				if (!existingSvg.empty()) {
					const node = existingSvg.node();
					if (node) {
						zoomTransformRef.current = d3.zoomTransform(node as Element);
					}
					existingSvg.remove();
				}
			};
		}, [mergedGroups, allMeters, selectedGroupId, snapBackEnabled]);

		const onGroupSelect = (newSelectionId: string) => {
			// remove "group_" prefix from id
			if (selectedGroupId === Number(newSelectionId.slice(6))) {
				setSelectedGroupId(null);
			} else {
				setSelectedGroupId(Number(newSelectionId.slice(6)));
			}
		};

		// Don't render until deep groups data is loaded but warn user with very basic screen.
		// It should go away quickly so not normally seen.
		if (deepGroupsLoading) {
			return <div><center><h2>{translate('loading')}</h2></center></div>;
		}

		const tooltipStyle = {
			...tooltipBaseStyle,
			//Only an admin is permitted access to the group visuals page
			tooltipVisualGroupView: 'help.admin.groupvisuals'
		};

		return (
			<div>
				<TooltipHelpComponent page='visual-group' />

				<div className='container-fluid'>
					<h1 style={titleStyle}>
						<FormattedMessage id='visual.group'></FormattedMessage>
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='visual-group' helpTextId={tooltipStyle.tooltipVisualGroupView} />
						</div>
					</h1>
				</div>

				<div id='sample' style={{
					position: 'relative', boxSizing: 'border-box', margin: '2rem',
					border: '2px solid black', maxWidth: '100%', height: '75vh', overflowY: 'auto', overflowX: 'auto'
				}}>
					<div style={{
						position: 'absolute', top: 0, left: 0, zIndex: 10, display: 'flex', flexDirection: 'column',
						gap: '4px', padding: '8px', margin: '8px', borderRadius: '4px', alignItems: 'flex-start'
					}}>
						<Label check style={{ marginBottom: 0 }}>
							<Input
								type="checkbox"
								checked={snapBackEnabled}
								onChange={() => {
									setSnapBackEnabled(prev => !prev);
									nodePositionsRef.current = {};
								}}
							/>
							{' ' + translate('visual.group.snap')}
						</Label>
						<div style={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
							<Button id="reset-view" color="secondary" size="sm" style={{ width: 'auto' }}>
								<FormattedMessage id="visual.group.button.reset.view" />
							</Button>
							{!snapBackEnabled && (
								<Button id="reset-layout" color="secondary" size="sm" style={{ width: 'auto' }}>
									<FormattedMessage id="visual.group.button.reset.layout" />
								</Button>
							)}
						</div>
						<div style={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
							<Button id="zoom-in" color="secondary" size="sm" style={{ width: 'auto' }}>+</Button>
							<Button id="zoom-out" color="secondary" size="sm" style={{ width: 'auto' }}>−</Button>
						</div>
					</div>
				</div>
			</div>

		);
	} catch (err) {
		// Check if an Error to avoid TS error.
		if (err instanceof Error && err.message === 'Cycle detected in group hierarchy') {
			// This is an internal error so return a basic screen with info since this is D3 and not Plotly.
			// Same is done above for loading of groups but that one should go away quickly.
			return <div><center><h2>{translate('visual.group.cyclic.error')}</h2></center></div>;
		} else {
			// Something unknown happened so let it ripple up.
			throw err;
		}
	}
};
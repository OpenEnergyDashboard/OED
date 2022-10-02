/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const createGraph = require('ngraph.graph');
const Unit = require('../../models/Unit');
const Conversion = require('../../models/Conversion');
const path = require('ngraph.path');

/**
 * Creates a graph with vertices are units and edges are conversions.
 * @param {*} conn 
 * @returns {Object}
 */
async function createConversionGraph(conn) {
	var graph = createGraph();
	const units = await Unit.getAll(conn);
	for (let i = 0; i < units.length; ++i) {
		graph.addNode(units[i].id, units[i].name);
	}

	const conversions = await Conversion.getAll(conn);
	for (let i = 0; i < conversions.length; ++i) {
		graph.addLink(conversions[i].sourceId, conversions[i].destinationId);
		if (conversions[i].bidirectional) {
			graph.addLink(conversions[i].destinationId, conversions[i].sourceId);
		}
	}

	return graph;
}

/**
 * Returns the list of units on the shortest path from source to destination.
 * @param {*} graph The conversion graph.
 * @param {*} sourceId The source unit's id.
 * @param {*} destinationId The destination unit's id.
 * @returns 
 */
function getPath(graph, sourceId, destinationId) {
	const pathFinder = path.aStar(graph, {
		oriented: true
	});
	// The path is returned in reversed order so we need to reverse it.
	const p = pathFinder.find(sourceId, destinationId).reverse();
	if (p.length <= 1) {
		// Returns null if the path doesn't exist.
		return null;
	}
	return p;
}

/**
 * Returns all shortest paths from a unit to others.
 * @param {*} sourceId The source unit's id.
 * @param {*} graph The conversion graph.
 * @returns 
 */
function getAllPaths(graph, sourceId) {
	let paths = [];
	// Loops through all the unit's ids in the graph.
	graph.forEachNode(destination => {
		const destinationId = destination.id;
		// The shortest path from source to destination.
		const currentPath = getPath(graph, sourceId, destinationId);
		// Checks if the path exists.
		if (currentPath !== null) {
			paths.push(currentPath);
		}
	});
	return paths;
}

module.exports = {
	createConversionGraph,
	getPath,
	getAllPaths
};

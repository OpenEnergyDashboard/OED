/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const migrationList = require('./registerMigration');

/**
 * If current version or version user wants to migrate is not in the migrationList, throw an Error
 * @param curr current version of the database
 * @param to version want to migrate to
 * @param adjListArray adjacency list of version graph
 */
function checkIfFromAndToExist(curr, to, adjListArray) {
	if (!(curr in adjListArray)) {
		throw new Error('Did not find current version in migration list');
	}
	if (!(to in adjListArray)) {
		throw new Error('Did not find to version in migration list');
	}
}

/**
 * Do a breath first search traversal to find the shortest path
 * from the current version to the version user want to migrate
 * It also works for down migration.
 * @param curr current version of the database
 * @param to version want to migrate to
 * @param adjListArray adjacency list of version graph
 * @returns {Array} return an array of indexes to the version that we want to migrate to
 */
function findPathToMigrate(curr, to, adjListArray) {
	const queue = [];
	const path = [];
	const visited = []; // When there is a cycle, make sure it is not infinite.

	checkIfFromAndToExist(curr, to, adjListArray);

	for (const vertex of adjListArray) {
		if (Object.prototype.hasOwnProperty.call(adjListArray, vertex)) {
			visited[vertex] = false;
			path[vertex] = -1;
		}
	}

	queue.push(curr);
	visited[curr] = true;

	while (queue.length > 0) {
		const currentVertexID = queue.shift();
		const currentVertex = adjListArray[currentVertexID];
		const edges = currentVertex.length;
		for (let i = 0; i < edges; i++) {
			const target = currentVertex[i];
			if (!visited[target]) {
				visited[target] = true;
				path[target] = currentVertexID;
				queue.push(target);
			}
		}
	}
	return path;
}

/**
 * Based on the path array, recursively find the correct path to the version wanted to update
 * @param curr current version of the database
 * @param to version want to migrate to
 * @param path array that store the indexes to the version that we want to migrate to
 */
function printPathToMigrate(curr, to, path) {
	if (curr === to) {
		console.log(`${to} `);
	} else if (path[to] === -1) {
		throw new Error('No path found');
	} else {
		printPathToMigrate(curr, path[to], path);
		console.log(`${to} `);
	}
}

const path = findPathToMigrate('0.3.0', '0.1.0', migrationList);
printPathToMigrate('0.3.0', '0.1.0', path);

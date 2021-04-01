/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Migration = require('../models/Migration');
const { compareSemanticVersion } = require('../util');
const { log } = require('../log');


/**
 * @param migrationItems extracted from registerMigration.js
 * @returns {Array} of migration pair
 */
function showPossibleMigrations(migrationItems) {
	return migrationItems.map(item => `\n${item.fromVersion} -> ${item.toVersion}`);
}

/**
 * Create an array of unique versions. For example: [0.1.0, 0.2.0, 0.2.0, 0.3.0] -> [0.1.0, 0.2.0, 0.3.0]
 * @param migrationItems extracted from registerMigration.js
 * @returns {*[]} array of unique versions
 */
function getUniqueVersions(migrationItems) {
	const vertex = [];
	for (const m of migrationItems) {
		// disallow down migration
		if (compareSemanticVersion(m.fromVersion, m.toVersion) === 1) {
			throw new Error(`Migration fromVersion ${m.fromVersion} is more recent than toVersion ${m.toVersion}`);
		} else {
			vertex.push(m.fromVersion);
			vertex.push(m.toVersion);
		}
	}
	return [...new Set(vertex)];
}

/**
 * create an adjacency list (OBJECT) of the migrations
 * @param migrationItems extracted from registerMigration.js
 * @returns {{}}
 */
function createMigrationList(migrationItems) {
	const migrationList = {};
	const uniqueKey = getUniqueVersions(migrationItems);
	uniqueKey.forEach(key => {
		migrationList[key] = [];
	});
	for (const m of migrationItems) {
		migrationList[m.fromVersion].push(m);
	}
	return migrationList;
}

/**
 * If current version or version user wants to migrate is not in the migrationList, throw an Error
 * @param curr current version of the database
 * @param to version want to migrate to
 * @param adjListArray adjacency list of version graph
 */
function ensureIfFromAndToExist(curr, to, adjListArray) {
	if (!(curr in adjListArray)) {
		throw new Error(`Could not find version ${curr} from the registered migration list`);
	}
	if (!(to in adjListArray)) {
		throw new Error(`Could not find version ${to} from the registered migration list`);
	}
}

/**
 * Do a breadth first search traversal to find the shortest path
 * from the current version to the version user wants to migrate to.
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
	ensureIfFromAndToExist(curr, to, adjListArray);
	for (const vertex of Object.keys(adjListArray)) {
		visited[vertex] = false;
		path[vertex] = -1;
	}
	queue.push(curr);
	visited[curr] = true;
	while (queue.length > 0) {
		const currentVertexID = queue.shift();
		const currentVertex = adjListArray[currentVertexID];
		const edges = currentVertex.length;
		for (let i = 0; i < edges; i++) {
			const target = currentVertex[i];
			if (!visited[target.toVersion]) {
				visited[target.toVersion] = true;
				path[target.toVersion] = currentVertexID;
				queue.push(target.toVersion);
			}
		}
	}
	return path;
}

/**
 * Based on the path array, find the correct file to the version wanted to update
 * @param curr current version of the database
 * @param to version want to migrate to
 * @param path to version want to migrate to
 * @returns {Array} of files needed to update database
 */
function getRequiredFilesToMigrate(curr, to, path) {
	// file needed to run database transaction
	const requiredFile = [];
	if (curr === to) {
		return requiredFile;
	}
	if (path[to] === -1) {
		throw new Error('No path found');
	}

	while (curr !== to) {
		requiredFile.unshift({
			fromVersion: path[to],
			toVersion: to
		});
		to = path[to];
	}
	return requiredFile;
}

/**
 * Open a database transaction and migrate the database by calling up() method.
 * Insert row into migration folder
 * @param neededFiles name of files needed to migrate
 * @param allMigrationFiles is all of possible migration files
 * @param conn the database connection to use
 */
async function migrateDatabaseTransaction(neededFiles, allMigrationFiles, conn) {
	try {
		await conn.tx(async t => {
			for (const neededFile of neededFiles) {
				for (const migrationFile of allMigrationFiles) {
					if (neededFile.fromVersion === migrationFile.fromVersion && neededFile.toVersion === migrationFile.toVersion) {
						await migrationFile.up(t);
						const migration = new Migration(undefined, migrationFile.fromVersion, migrationFile.toVersion);
						await migration.insert(t);
					}
				}
			}
		});
	} catch (err) {
		log.error('Error while migrating database', err);
		return undefined;
	}
	return true;
}

/**
 * Migrate the database from current version to next version
 * @param toVersion is the version wanting to migrate to
 * @param migrationItems is the list of migration that users register
 * @param conn is the connection to use.
 */
async function migrateAll(toVersion, migrationItems, conn) {
	const currentVersion = await Migration.getCurrentVersion(conn);
	if (compareSemanticVersion(currentVersion, toVersion) === 0) {
		throw new Error('You have the highest version');
	}
	const list = createMigrationList(migrationItems);
	const path = findPathToMigrate(currentVersion, toVersion, list);
	const requiredFile = getRequiredFilesToMigrate(currentVersion, toVersion, path);
	return await migrateDatabaseTransaction(requiredFile, migrationItems, conn);
}

module.exports = {
	showPossibleMigrations,
	getUniqueVersions,
	migrateAll
};

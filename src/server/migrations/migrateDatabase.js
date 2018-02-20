const migrationList = require('./registerMigration');

// breath first search to find path to migrate databse
function findPathToMigrate(from, to, adjListArray) {
	const queue = [];
	const path = [];
	const visited = [];

	for (const vertex in adjListArray) {
		if (Object.prototype.hasOwnProperty.call(adjListArray, vertex)) {
			visited[vertex] = false;
			path[vertex] = -1;
		}
	}

	queue.push(from);
	visited[from] = true;

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

function printPathToMigrate(s, f, path) {
	if (s === f) {
		console.log(`${f} `);
	} else {
		if (path[f] === -1) {
			console.log('No path');
		} else {
			printPathToMigrate(s, path[f], path);
			console.log(`${f} `);
		}
	}
}

const path = findPathToMigrate(0.1, 0.3, migrationList);
console.log(path);
printPathToMigrate(0.1, 0.3, path);

// console.log(findPathToMigrate(0.1, 0.2, migrationList));
// printPathToMigrate(0.1, 0.2, migrationList);

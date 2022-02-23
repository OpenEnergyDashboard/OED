/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const createGraph = require('ngraph.graph');
const Unit = require('../../models/Unit');
const Conversion = require('../../models/Conversion');

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
    }

    return graph;
}

module.exports = createConversionGraph;

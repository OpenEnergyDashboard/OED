/* createDB.js - CLEAN ORCHESTRATION LAYER */

const { createSchema } = require('../models/database');
const { getConnection } = require('../db');
const { insertStandardUnits, insertStandardConversions } = require('../util/insertData');
const { redoCik } = require('../services/graph/redoCik');

(async function createSchemaWrapper() {
  const conn = getConnection();

  try {
    console.log("Starting schema creation...");

    await createSchema(conn);
    await insertStandardUnits(conn);
    await insertStandardConversions(conn);
    await redoCik(conn);

    console.log("Schema created successfully");

    process.exit(0);

  } catch (err) {
    console.error("Schema creation failed:");
    console.error(err);

    // IMPORTANT: fail fast, no silent recovery
    process.exit(1);
  }
})();
let pg = require('pg');

let config = {
    user: 'capstone',
    database: 'capstone',
    password: 'guest', // server running in docker
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000
};

let pool = new pg.Pool(config);

//catches error from idle host
pool.on('error', (err, client) => {
    console.error('idle client error', err.message, err.stack)
});

exports.pool = pool;
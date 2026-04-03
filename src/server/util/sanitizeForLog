const { canonicalize } = require('./canonicalize');

function sanitizeForLog(input) {
	const normalized = canonicalize(input);

	return normalized
		.replace(/[\r\n\t]/g, '_')
		.replace(/\x1b\[[0-9;]*m/g, '');
}

module.exports = { sanitizeForLog };
// Indicates that files in this folder will be run by mocha and will therefore have mocha global variables.
module.exports = {
	"env": {
		"mocha": true
	},
	"rules" : {
		"import/no-extraneous-dependencies": "off" // There are unit test dependencies in this directory (like chai).
	}
};

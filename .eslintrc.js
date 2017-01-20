module.exports = {
    "extends": "airbnb",
    "plugins": [
        "react",
        "jsx-a11y",
        "import"
    ],
	"rules": {
		"no-tabs": 0, // We're using tabs instead of spaces
		"indent": ["error", "tab"], // We're using ONLY tabs instead of spaces
		"max-len": ["error", {"code": 120, "tabWidth": 4, "ignoreStrings": true}],
		"no-template-curly-in-string": 0, // pg-promise needs curly braces in strings
		"arrow-body-style": ["error", "as-needed"], // Only use braces in => functions when we need to,
		"arrow-parens": ["error", "as-needed"],
		"comma-dangle": ["warn", "only-multiline"], // Comma dangles can be nice multiline, but we don't want them everywhere
		"object-shorthand": "off", // Object shorthand can be a bit arcane.
		"dot-notation": "warn",
		"radix": ["error", "as-needed"]
	}
};

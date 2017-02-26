module.exports = {
    "extends": "airbnb",
    "plugins": [
        "react",
        "jsx-a11y",
        "import"
    ],
	"rules": {
		"no-tabs": 0, // We're using tabs instead of spaces
		"indent": ["error", "tab", { "SwitchCase": 1 }], // We're using ONLY tabs instead of spaces
		"max-len": ["warn", {"code": 150, "tabWidth": 4, "ignoreStrings": true}],
		"no-template-curly-in-string": 0, // pg-promise needs curly braces in strings
		"arrow-body-style": ["error", "as-needed"], // Only use braces in => functions when we need to,
		"arrow-parens": ["error", "as-needed"],
		"comma-dangle": ["warn", "only-multiline"], // Comma dangles can be nice multiline, but we don't want them everywhere
		"object-shorthand": "off", // Object shorthand can be a bit arcane.
		"dot-notation": "warn",
		"radix": ["error", "as-needed"],
		"no-useless-constructor": ["warn"],
		"no-param-reassign": 0,
		"no-plusplus": ["warn", { "allowForLoopAfterthoughts": true }],

		// AirBnB disallows these syntax forms and also ForInStatement and ForOfStatement.
		// We want to use both of those. They play nicely with await and are more readable than .forEach.
		'no-restricted-syntax': [
			'error',
			'LabeledStatement',
			'WithStatement',
		],

		"react/jsx-indent": ["error", "tab"], // Still tabs, not spaces
		"react/no-direct-mutation-state": ["error"],
		"class-methods-use-this": "off",
		"react/prefer-stateless-function": ["warn"], // Stateless functions are usually better than a class when possible
		"react/sort-comp": ["off"],
		"react/sort-prop-types": "off",
		"react/prop-types": "off",
		"react/jsx-space-before-closing": ["warn"],

		"jsx-a11y/img-has-alt": "off",
		"jsx-a11y/img-redundant-alt": "off",
		"jsx-a11y/aria-role": "off",
		"jsx-a11y/no-access-key": "off",
		"jsx-a11y/label-has-for": "off"
	}
};

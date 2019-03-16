/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const { CheckerPlugin } = require('awesome-typescript-loader');

const BUILD_DIR = path.resolve(__dirname, 'src/client/public/app');
const APP_DIR = path.resolve(__dirname, 'src/client/app');

const config = {
    entry: APP_DIR + "/index.tsx",
    output: {
        filename: "bundle.js",
        path: BUILD_DIR
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    // Ignore warnings about bundle size
    performance: {
        hints: false
    },

    module: {
        rules: [
            // All TypeScript ('.ts' or '.tsx') will be handled by 'awesome-typescript-loader'.
            // Also, for development, JavaScript is handled by 'awesome-typescript-loader' and passed to Babel.
            { test: /\.[jt]sx?$/, exclude: /node_modules/, loader: "awesome-typescript-loader" },
            // Any remaining JavaScript ('.js' or '.jsx') will be transpiled by Babel, for production uglification.
            { test: /\/jsx?$/, exclude: /node_modules/, loader: "babel-loader" },
			// CSS stylesheet loader.
			{ test: /\.css$/, loader: 'style-loader!css-loader' },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },
	plugins: [
        new LodashModuleReplacementPlugin(),
		new CheckerPlugin(),
	],
	node: {
		fs: 'empty'
	}
};

if (process.env.NODE_ENV === 'production') {
	config.plugins.push(
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production')
			}
		}),
		new UglifyJsPlugin({ sourceMap: true })
	);
}

module.exports = config;

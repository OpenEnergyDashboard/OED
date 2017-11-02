/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'src/client/public');
const APP_DIR = path.resolve(__dirname, 'src/client/app');
const COMMON_DIR = path.resolve(__dirname, 'src/common');

const config = {
    entry: APP_DIR + "/index.tsx",
    output: {
        filename: "bundle.js",
        path: BUILD_DIR + "/dist"
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
			{ test: /\.tsx?$/, loader: "awesome-typescript-loader" },
			// CSS stylesheet loader.
			{ test: /\.css$/, loader: 'style-loader!css-loader' },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },
	plugins: [
		new LodashModuleReplacementPlugin()
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
		new webpack.optimize.UglifyJsPlugin({ sourceMap: true })
	);
}

module.exports = config;

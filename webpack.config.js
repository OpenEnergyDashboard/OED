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
	entry: ['babel-polyfill', `${APP_DIR}/index.jsx`],
	output: {
		path: BUILD_DIR,
		filename: 'bundle.js'
	},
	resolve: {
		extensions: ['.js', '.jsx']
	},
	module: {
		rules: [
			{
				test: /\.jsx?/,
				include: [APP_DIR, COMMON_DIR],
				loader: 'babel-loader'
			},
			{
				test: /\.css$/,
				loader: 'style-loader!css-loader'
			}
		]
	},
	devtool: 'source-map',
	plugins: [
		new LodashModuleReplacementPlugin()
	]
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

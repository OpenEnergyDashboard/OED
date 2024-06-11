/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'src/client/public/app');
const APP_DIR = path.resolve(__dirname, 'src/client/app');

const config = {
	// Enable sourcemaps for debugging webpack's output.
	devtool: 'source-map',
	entry: {
		application: APP_DIR + '/index.tsx',
	},
	cache: {
		type: 'filesystem'
	},
	resolve: {
		fallback: {
			'buffer': require.resolve('buffer/'),
			'assert': require.resolve('assert/'),
			'stream': require.resolve('stream-browserify'),
			'fs': false
		},
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: ['.css', '.ts', '.tsx', '.js', '.jsx', '.json']
	},

	// Ignore warnings about bundle size
	performance: {
		hints: false
	},
	module: {
		rules: [
			// All TypeScript ('.ts' or '.tsx') and JavaScript ('.js' or '.jsx') will be handled by 'ts-loader'.
			{
				test: /\.[jt]sx?$/,
				exclude: /node_modules/,
				use: [
					'ts-loader',
					/*
					 * When some imports were re-written to satisfy Vite, the re-written
					 * imports broke Webpack. This fixes those imports.
					 */
					{
						loader: 'string-replace-loader',
						options: {
							search: "import moment from 'moment'",
							replace: "import * as moment from 'moment'"
						}
					}
				]
			},
			// CSS stylesheet loader.
			{
				test: /\.css$/, use: [
					{ loader: 'style-loader' },
					{ loader: 'css-loader' }
				]
			},
			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
			{ enforce: 'pre', test: /\.js$/, use: [{ loader: 'source-map-loader' }] }
		]
	},
	output: {
		filename: 'bundle.js',
		path: BUILD_DIR
	},
	plugins: [
		new LodashModuleReplacementPlugin(),
		new NodePolyfillPlugin(),
		new HtmlWebpackPlugin({
			title: 'Custom template',
			template: './src/index-webpack.html',
			filename: '../index.html'
		}),
	]
};

if (process.env.NODE_ENV === 'production') {
	config.plugins.push(
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production')
			}
		}),
		new TerserPlugin({
			terserOptions: {
				sourceMap: true
			}
		})
	);
}

module.exports = config;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'

export default defineConfig({
	root: './src',
	publicDir: './client/public',

	plugins: [
		react(),
		commonjs(),
		/**
		 * splitVendorChunkPlugin automatically creates a vendor chunk for all used node_modules (that are
		 * not specified in manualChunks() below)
		 */
		splitVendorChunkPlugin()],
	build: {
		outDir: './server/public',
		rollupOptions: {
			output: {
				/**
				 * Unfortunately, it seems as through the default chunking strategy is no chunking
				 * strategy: the final build contains a single and massive bundle.js and bundle.css file.
				 * This is bad for page loads, so manually chunk to fix this.
				 */
				manualChunks(/** @type {string} */ id) {
					const afterNodeModules = id.toString().split('node_modules/')[1]

					/**
					 * If afterNodeModules is undefined, then the file is not in node_modules - it's
					 * a local file. For now, don't chunk local files. TODO: route-based chunking
					 */
					if (!afterNodeModules) return

					const moduleName = afterNodeModules.split('/')[0]
					const fileName = afterNodeModules.split('/').reverse()[0]

					// For css, simply make Bootstrap its own bundle
					if (fileName.includes('.css')) {
						if (/^(bootstrap)$/u.test(moduleName)) {
							return moduleName
						}
					}

					// For js, only make the largest libraries their own chunks (>=50kB)
					if (fileName.includes('.js')) {
						if(/^(plotly.js|react-dom|reactstrap|lodash|moment|react-select)$/u.test(moduleName)) {
							return moduleName
						}
					}
				}
			}
		}
	},
	server: {
		port: 9229,
		proxy: {
			'/api': 'http://localhost:3000'
		}
	},
})

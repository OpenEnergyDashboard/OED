/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'

export default defineConfig({
	root: './src',
	publicDir: './client/public',
	plugins: [
		react(),
		commonjs(),
	],
	build: {
		outDir: './client/public',
		emptyOutDir: false,
		minify: false
	},
	server: {
		port: 8085,
		proxy: {
			'/api': 'http://localhost:3000'
		}
	},
})

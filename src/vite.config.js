import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'

export default defineConfig({
	root: './src',
	build: {
		outDir: './server/public',
	},
	publicDir: './client/public',
	plugins: [react(), commonjs()],
	server: {
		port: 9229,
		proxy: {
			'/api': 'http://localhost:3000'
		}
	},
})

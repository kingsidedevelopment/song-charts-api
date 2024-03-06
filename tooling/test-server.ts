import { buildFrontend } from './build-frontend'

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const yeast = require('yeast')
const scriptInsertionPoint = '/// test-server insert {{frontend-script}}'
const buildArtifactPrefix = 'song-charts-frontend-'

async function startTestServer() {
	const artifactId = await buildFrontend()

	// Enables hot swapping frontend script
	// async function getLatestBuild() {
	// 	const segmentLength = buildArtifactNaming.split('-').length
	// 	const builds = await getFiles('./dist')
	// 	if (!builds || builds.length === 0) {
	// 		throw new Error('No builds found')
	// 	}
	// 	const latestBuild = builds.reduce((a, b) => {
	// 		const aId = a.split('-')[segmentLength - 1]
	// 		const bId = b.split('-')[segmentLength - 1]

	// 		const aTimestamp = yeast.decode(aId) as number
	// 		const bTimestamp = yeast.decode(bId) as number

	// 		return aTimestamp > bTimestamp ? a : b
	// 	})

	// 	console.log(`Latest build: ${latestBuild}`)
	// }

	Bun.serve({
		port: 3412,
		hostname: '127.0.0.1',
		async fetch(req) {
			if (req.method !== 'GET') {
				return new Response(null, {
					status: 405,
					statusText: 'Method Not Allowed',
					headers: { 'content-type': 'text/plain' }
				})
			}

			const index = Bun.file('./tests/index.html')

			console.log('Serving index.html for build ' + artifactId)

			const frontendScript = Bun.file(
				`./dist/${buildArtifactPrefix + artifactId}.js`
			)

			const indexExists = await index.exists()
			const frontendScriptExists = await frontendScript.exists()

			if (!indexExists || !frontendScriptExists) {
				return new Response(null, {
					status: 404,
					statusText: 'Not Found',
					headers: { 'content-type': 'text/plain' }
				})
			}

			const frontendScriptText = await frontendScript.text()
			const text = (await index.text()).replace(
				scriptInsertionPoint,
				frontendScriptText
			)

			return new Response(text, {
				headers: { 'content-type': 'text/html' }
			})
		}
	})

	console.log(`Test server running at http://127.0.0.1:3412`)
}

/**
 * @param {string | Buffer | URL} directoryPath
 * @returns {Promise<string[]>} - Array of long file paths
 */
async function getFiles(directoryPath: string) {
	try {
		const fileNames = await readdir(directoryPath)
		const filePaths = fileNames.map(fn => join(directoryPath, fn))
		return filePaths
	} catch (err) {
		console.log(err)
	}
}

startTestServer()

const yeast = require('yeast')

async function buildFrontend() {
	const start = performance.now()
	const artifactId = yeast()
	await Bun.build({
		entrypoints: ['./src/frontend.ts'],
		outdir: './dist',
		target: 'browser',
		naming: `[dir]/song-charts-[name]-${artifactId}.[ext]`
	})
	const time = performance.now() - start
	console.log(`Built frontend in ${time.toFixed(3)}ms`)
	return artifactId
}

export { buildFrontend }

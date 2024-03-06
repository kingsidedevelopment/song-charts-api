import { Client } from 'spotify-api.js'

export type SpotifyTrack = {
	id: string
	queryKey: string
}

const spotifyClient = new Client({
	token: {
		clientID: process.env.SPOTIFY_CLIENT_ID ?? '',
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? ''
	},
	retryOnRateLimit: true,
	refreshToken: true,
	cacheSettings: {
		tracks: true
	},
	onReady() {
		console.log(`Spotify client ready`)
	}
})

export async function getSpotifyTrack(
	queryKey: string,
	songName: string,
	artistName: string
): Promise<SpotifyTrack | null> {
	const query = await spotifyClient.search(`${songName} ${artistName}`, {
		types: ['track'],
		limit: 1,
		market: 'US',
		offset: 0
	})

	if (!query || !query.tracks || !query.tracks.length) {
		console.log(`No track found for ${songName} by ${artistName}`)
		return null
	}

	const { id } = query.tracks[0]

	return { queryKey, id }
}

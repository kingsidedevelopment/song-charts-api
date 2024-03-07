import type { TrackResult } from './index'

type EmbedController = {
	loadUri: (uri: string) => void
	play: () => void
	togglePlay: () => void
	seek: (position: number) => void
	destory: () => void
}
type EmbedControllerEvent = 'ready' | 'playback_update'
type CreateControllerOptions = {
	width: string
	height: string
	uri: string
}
type CreateControllerCallback = (EmbedController: EmbedController) => void
type IFrameApi = {
	createController: (
		element: HTMLElement,
		options: CreateControllerOptions,
		callback: (EmbedController: any) => void
	) => void
}

jQuery(function () {
	const dateForm = document.forms.namedItem('Birthday Form')
	const monthInput = $('#Month')
	const dayInput = $('#Day')
	const yearInput = $('#Year')
	const resultsWrapper = $('#results-wrapper')
	const resultsHeading = $('#results-heading')
	const resultsContainer = $('#results-container')
	const loadingWrapper = $('#loading-results')

	const limit = 12
	const ranking = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

	const resultsTitles = ranking.map(rank => $(`#result-title-${rank}`))
	const resultsArtists = ranking.map(rank => $(`#result-artist-${rank}`))

	const resultsChartTimes = ranking.map(rank =>
		$(`#result-chart-time-${rank}`)
	)
	const resultsPreviewNotAvail = ranking.map(rank =>
		$(`#result-preview-not-available-${rank}`)
	)
	const apiAddress = 'https://arpeggio-production.up.railway.app/top-tracks'
	let spotifyIframeAPI: IFrameApi | null = null

	if (!dateForm) {
		console.log('Date form not found. Refresh the page')
		return
	}

	dateForm.addEventListener('submit', onSubmit)

	// @ts-ignore
	window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
		spotifyIframeAPI = IFrameAPI
		console.log('Spotify iframe API ready')
		// const callback = (EmbedController: EmbedController) => {}
		// IFrameAPI.createController(element, options, callback)
	}

	// hides placeholder results and shows loading
	// web page should prerender these hidden
	// anyway, but this is just for completeness
	loadingView()

	// avoid race updating view
	setTimeout(() => {
		const params = new URLSearchParams(document.location.search)
		const queryDate = params.get('date')
		const nowDate = new Date()

		nowDate.setDate(nowDate.getDate() - 2)

		const formattedNowDate = getFormattedDate(nowDate)
		const date = queryDate ?? formattedNowDate

		fetchAndUpdate(date)
	}, 0)

	function createEmbedController(
		element: HTMLElement,
		options: CreateControllerOptions,
		callback: CreateControllerCallback
	) {
		if (!spotifyIframeAPI) {
			console.error('Spotify iframe API not ready')
			return
		}

		spotifyIframeAPI.createController(element, options, callback)
	}

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault()

		const year = Number(yearInput.val())
		const month = Number(monthInput.val())
		const day = Number(dayInput.val())
		const date = `${year}-${month < 10 ? '0' + month : month}-${
			day < 10 ? '0' + day : day
		}`

		fetchAndUpdate(date)
		loadingView()

		console.log(`Fetching songs for date ${date}`)
	}

	async function loadingView() {
		resultsHeading.hide()
		resultsWrapper.hide()
		resultsContainer.hide()
		loadingWrapper.show()
	}

	async function resultsView() {
		resultsHeading.show()
		resultsWrapper.show()
		resultsContainer.show()
		loadingWrapper.hide()
	}

	async function errorView(message: string) {
		resultsHeading.hide()
		resultsWrapper.hide()
		resultsContainer.hide()
		loadingWrapper.hide()

		console.error(message)
	}

	async function fetchAndUpdate(date: string) {
		const url = new URL(apiAddress)
		url.searchParams.set('date', date)
		url.searchParams.set('limit', String(limit))

		// make page shareable
		history.pushState({ date }, 'date', `?date=${date}`)

		const data = await fetch(url, {
			method: 'get',
			headers: {
				'content-type': 'application/json',
				origin: window.location.origin
			}
		}).then(res => res.json())

		if (!data || !data.songs || data.songs.length === 0) {
			errorView(`Failed to get songs for date ${date}`)
		}

		updateResults(date, data.songs)
		resultsView()
	}

	function updateResults(date: string, songs: TrackResult[]) {
		const formattedDate = date // getFormattedDate(new Date(date))
		for (const { index, title, artist, weeksOnChart, spotifyId } of songs) {
			const rank = index + 1
			resultsTitles[index].text(title)
			resultsArtists[index].text(artist)
			resultsChartTimes[index].text(`${weeksOnChart} weeks on chart`)

			if (spotifyId) {
				updateEmbed(rank, spotifyId)
				resultsPreviewNotAvail[index].hide()
				continue
			}

			resultsPreviewNotAvail[index].show()
		}
		resultsHeading.text(`Top songs for ${convertDateFormat(formattedDate)}`)
	}

	async function updateEmbed(rank: number, trackId: string) {
		const element = $(`#spotify-iframe-${rank}`).get(0)

		if (!element) {
			console.error(`Embed not found for rank ${rank}`)
			return
		}

		const options = {
			width: '100%',
			height: '80',
			uri: `spotify:track:${trackId}`
		}

		const callback = (controller: EmbedController) => {}
		createEmbedController(element, options, callback)
	}

	function getFormattedDate(date: Date) {
		const yyyy = date.getFullYear()
		const m = date.getMonth() + 1
		const d = date.getDate() + 2
		const mm = m < 10 ? '0' + m : m
		const dd = d < 10 ? '0' + d : d

		return `${yyyy}-${mm}-${dd}`
	}

	function convertDateFormat(dateString: string) {
		const date = new Date(dateString)
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}
		return date.toLocaleDateString('en-US', options)
	}
})

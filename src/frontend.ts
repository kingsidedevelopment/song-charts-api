import type { TrackResult } from './index'

type EmbedController = {
	loadUri: (uri: string) => void
	play: () => void
	togglePlay: () => void
	seek: (position: number) => void
	destroy: () => void
	addListener: (event: EmbedControllerEvent, callback: () => void) => void
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
	const submitButton = $('#submit-button')
	const resetButton = $('#reset-button')
	const shareButton = $('#share-button')

	const monthInput = $('#Month')
	const dayInput = $('#Day')
	const yearInput = $('#Year')

	const resultsWrapper = $('#results-wrapper')
	const resultsHeading = $('#results-heading')
	const resultsContainer = $('#results-container')

	const loadingResultsSection = $('#loading-results')
	const noResultsSection = $('#empty-results')
	const errorResultsSection = $('#error-results')
	const resultsSection = $('#results')

	const errorMessage = $('#error-message')
	const resultsAnchor = $('#results-anchor')

	const notificationContainer = $('#notification-container')
	const notificationBlock = $('#notification-block')

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
	const apiAddress =
		'https://song-charts-api-kkvgwykdtq-uk.a.run.app/top-tracks'
	let spotifyIframeAPI: IFrameApi | null = null

	submitButton.get(0)?.addEventListener('click', onSubmit)
	resetButton.get(0)?.addEventListener('click', onReset)
	shareButton.get(0)?.addEventListener('click', onShare)

	// @ts-ignore
	window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
		spotifyIframeAPI = IFrameAPI
		console.log('Spotify iframe API ready')

		onReady()
	}

	// hides placeholder results and shows loading
	// web page should prerender these hidden
	// anyway, but this is just for completeness
	defaultView()

	function onReady() {
		// avoid race updating view
		setTimeout(() => {
			const params = new URLSearchParams(document.location.search)
			const day = params.get('Day')
			const month = params.get('Month')
			const year = params.get('Year')
			const queryDate = `${year}-${month}-${day}`

			if (!day || !month || !year) {
				defaultView()
				return
			}

			loadingView()

			yearInput.val(year)
			monthInput.val(month)
			dayInput.val(day)

			fetchAndUpdate(queryDate)

			resultsAnchor.get(0)?.scrollIntoView({ behavior: 'smooth' })
		}, 0)
	}

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

	function onReset(event: MouseEvent) {
		event.preventDefault()
		window.location.search = ''
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		})
	}

	function onShare(event: MouseEvent) {
		event.preventDefault()
		const params = new URLSearchParams(document.location.search)
		navigator.clipboard.writeText(window.location.toString())
		console.log(`Copied window.location to clipboard`)
		notificationView()
	}

	async function onSubmit(event: MouseEvent) {
		event.preventDefault()

		const year = Number(yearInput.val())
		const month = Number(monthInput.val())
		const day = Number(dayInput.val())
		const date = `${year}-${month < 10 ? '0' + month : month}-${
			day < 10 ? '0' + day : day
		}`

		window.location.search = `Day=${day}&Month=${month}&Year=${year}`

		// fetchAndUpdate(date)
		loadingView()

		console.log(`Fetching songs for date ${date}`)
	}

	async function loadingView() {
		resultsSection.hide()
		noResultsSection.hide()
		errorResultsSection.hide()
		loadingResultsSection.show()
	}

	async function defaultView() {
		resultsSection.hide()
		errorResultsSection.hide()
		loadingResultsSection.hide()
		noResultsSection.show()
	}

	async function resultsView() {
		resultsHeading.show()
		resultsWrapper.show()
		resultsContainer.show()
		resultsSection.show()
		loadingResultsSection.hide()
		noResultsSection.hide()
		errorResultsSection.hide()
	}

	async function errorView(message: string) {
		resultsSection.hide()
		loadingResultsSection.hide()
		noResultsSection.hide()
		errorResultsSection.show()

		errorMessage.text(message)
		console.error(message)
	}

	async function notificationView() {
		notificationContainer.removeClass('notification-collapsed')
		setTimeout(() => {
			notificationContainer.addClass('notification-collapsed')
		}, 3500)
	}

	async function fetchAndUpdate(date: string) {
		const url = new URL(apiAddress)
		const [year, month, day] = date.split('-')
		url.searchParams.set('date', date)
		url.searchParams.set('limit', String(limit))

		// make page shareable
		history.pushState(
			{ year, month, day },
			'yyyy-mm-dd',
			`?Day=${day}&Month=${month}&Year=${year}`
		)

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
		// we want to nest a div because spotify's iFrameAPI
		// replaces the element, and we'd lose the ability to
		// access this embed instance via id
		const element = $(`#spotify-iframe-${rank}`).get(0)
		const child = document.createElement('div')
		element?.appendChild(child)

		if (!element || !child) {
			console.error(`Embed not found for rank ${rank}`)
			return
		}

		const options = {
			width: '100%',
			height: '80',
			uri: `spotify:track:${trackId}`
		}

		const callback = (controller: EmbedController) => {
			controller.addListener('ready', () => {
				element.style.opacity = '1'
				element.parentElement?.querySelector('.embed-loader')?.remove()
			})
		}
		createEmbedController(child, options, callback)
		element.style.opacity = '0'
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

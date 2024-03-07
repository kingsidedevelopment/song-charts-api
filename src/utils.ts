export function validateDateFormat(date: string) {
	try {
		const segments = date.split('-')
		if (segments.length !== 3) {
			return false
		}

		const [year, month, day] = segments

		const nYear = Number(year)
		const nMonth = Number(month)
		const nDay = Number(day)

		if (isNaN(nYear) || isNaN(nMonth) || isNaN(nDay)) {
			return false
		}

		if (nYear < 0 || nMonth < 0 || nDay < 0) {
			return false
		}

		if (nMonth > 12 || nDay > 31) {
			return false
		}

		return true
	} catch (error) {
		return false
	}
}

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export function getNextDayOfWeek(date: Date, dayOfWeek: DayOfWeek) {
	const resultDate = new Date(date.getTime())
	resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7))
	return resultDate
}

export function getCorsHeaders(
	whitelist: string[],
	origin: string | undefined
) {
	const base = {
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	}

	if (!origin) {
		console.log('No origin')
		return base
	}

	if (process.env.SERVER_MODE === 'development') {
		return {
			...base,
			'Access-Control-Allow-Origin': process.env.TEST_ORIGIN || ''
		}
	}

	if (~whitelist.indexOf(origin)) {
		return {
			...base,
			'Access-Control-Allow-Origin': origin
		}
	}
}

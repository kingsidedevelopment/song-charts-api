import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { pgTable, text } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const connectionString = process.env.POSTGRES_URL ?? ''
const queryClient = postgres(connectionString)
const db = drizzle(queryClient)

console.log('Posgres client ready')

const hot100 = pgTable('hot-100-current', {
	chartWeek: text('chart_week').notNull(),
	currentWeek: text('current_week').notNull(),
	title: text('title').notNull(),
	performer: text('performer').notNull(),
	lastWeek: text('last_week').notNull(),
	peakPos: text('peak_pos').notNull(),
	weeksOnChart: text('wks_on_chart').notNull()
})

async function getEntryCount() {
	console.time('Count all entries time')
	const count = await db.execute(sql`SELECT COUNT(*) FROM "hot-100-current"`)
	return count
}

export default db
export { hot100 }

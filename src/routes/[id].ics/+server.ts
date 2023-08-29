import ical from 'ical-generator';
import { Client } from '@notionhq/client';
import type { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

import config from '$lib/config';
import { ACCESS_KEYS, NOTION_TOKEN, LANG, COMPANY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { getFirstContentBlock } from '$lib/notion-utils';

type NotionDatabaseEntry = {
	uid: string;
	created_time: string;
	last_edited_time: string;
	title: string;
	date: {
		start: string;
		end: string | null;
		time_zone: string | null;
	};
	emoji: string | null;
	description: string | null;
	url: string;
}[];

export const trailingSlash = 'never';

const notion = new Client({ auth: NOTION_TOKEN });

export const GET: RequestHandler = async ({ params, url }) => {
	const secret = url.searchParams.get('secret');
	if (!ACCESS_KEYS.split(',').includes(secret)) {
		return new Response('Forbidden', { status: 403 });
	}

	const { id } = params;

	const databaseMetadata = await notion.databases.retrieve({ database_id: id });

	const databaseEntries = [];
	let query: QueryDatabaseResponse | { has_more: true; next_cursor: undefined } = {
		has_more: true,
		next_cursor: undefined
	};
	while (query.has_more) {
		query = await notion.databases.query({
			database_id: id,
			page_size: 100,
			start_cursor: query.next_cursor,
			filter: config.filter
		});
		databaseEntries.push(...query.results);
	}

	const filtered = await Promise.all(
		databaseEntries.map(async (object) => {
			if (object.properties[config.dateProperty].date === null) {
				return [];
			}

			return [
				{
					uid: object.id,
					created_time: object.created_time,
					last_edited_time: object.last_edited_time,
					title: object.properties[config.titleProperty].title[0].text.content,
					date: object.properties[config.dateProperty].date,
					emoji: object.icon && object.icon.type === 'emoji' ? object.icon.emoji : null,
					description: await getFirstContentBlock(notion, object.id),
					url: object.url
				}
			] as NotionDatabaseEntry;
		})
	);

	const calendar = ical({
		name: databaseMetadata.title[0].text.content,
		prodId: { company: COMPANY, language: LANG, product: 'notion-ics' }
	});
	filtered.flat().forEach((event) => {
		const dateStart = new Date(event.date.start);
		const dateEnd = new Date(event.date.end ?? event.date.start);

		const isFullDay =
			event.date.start.length === 10 && (!event.date.end || event.date.end.length === 10);

		calendar.createEvent({
			id: event.uid,
			summary: event.emoji ? `${event.emoji} ${event.title}` : event.title,
			start: dateStart,
			end:
				dateStart === dateEnd || (event.date.end && isFullDay)
					? new Date(dateEnd.getTime() + 86400000)
					: dateEnd,
			allDay: isFullDay,
			description: event.description,
			url: event.url,
			lastModified: new Date(event.last_edited_time),
			created: new Date(event.created_time),
			busystatus: config.busy
		});
	});

	return new Response(calendar.toString(), {
		status: 200,
		headers: {
			'content-type': 'text/calendar'
		}
	});
};

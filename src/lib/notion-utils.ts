import { MAX_BLOCK_PAGE_SIZE } from '$env/static/private';
import type { Client } from '@notionhq/client';
import type {
	BlockObjectResponse,
	PageObjectResponse,
	RichTextItemResponse
} from '@notionhq/client/build/src/api-endpoints';

export const getFirstContentBlock = async (client: Client, blockId: string, blocksPageSize = MAX_BLOCK_PAGE_SIZE) => {
	const blocks = await client.blocks.children.list({
		block_id: blockId,
		page_size: Number(blocksPageSize)
	});

	const partText = [];
	let numberedIndex = 1;

	// TODO: replace this with a map to handle multiple block types in one line
	blocks.results.forEach((block) => {
		const blockObject = block as BlockObjectResponse;

		const type = blockObject.type;
		const richText = blockObject[type].rich_text as RichTextItemResponse[];

		richText?.map((richText) => {
			if (richText?.plain_text) {
				if (type.startsWith('heading')) {
					const headingLevel = Number(type.split('_')[1]);
					partText.push('', `${'#'.repeat(headingLevel)} ${richText.plain_text}`, '');
				} else if (type === 'bulleted_list_item') {
					partText.push(`• ${richText.plain_text}`);
				} else if (type === 'numbered_list_item') {
					partText.push(`${numberedIndex}. ${richText.plain_text}`);
					numberedIndex++;
				} else {
					partText.push(richText.plain_text);
				}
			}
		});

		return partText;
	});

	return partText.join('\n');
};

export const getRelativePageProperties = async (client: Client, pageId: string) => {
	return await client.pages.retrieve({ page_id: pageId }) as PageObjectResponse;
}
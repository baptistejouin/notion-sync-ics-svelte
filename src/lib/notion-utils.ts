import type { Client } from '@notionhq/client';
import type {
	BlockObjectResponse,
	RichTextItemResponse
} from '@notionhq/client/build/src/api-endpoints';

export const getFirstContentBlock = async (client: Client, blockId: string, blocksPageSize = 1) => {
	const blocks = await client.blocks.children.list({
		block_id: blockId,
		page_size: blocksPageSize
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

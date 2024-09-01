import { AsyncLocalStorage } from 'node:async_hooks';
import { ApplicationCommandType, ComponentType, InteractionResponseType, InteractionType } from 'discord-api-types/v10';
import type { APIApplicationCommandInteractionDataIntegerOption, APIInteraction, APIInteractionResponse } from 'discord-api-types/v10';
import { Direction, Game2048 } from './board';
import { verify } from './verify';

const unauthenticated = () => new Response('Unauthenticated', { status: 401 });

export const als = new AsyncLocalStorage<{ ctx: ExecutionContext; interaction: APIInteraction }>();

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== 'POST') return unauthenticated();
		if (!request.headers.get('X-Signature-Ed25519') || !request.headers.get('X-Signature-Timestamp')) return unauthenticated();
		if (!(await verify(request, env.BOT_PUBLIC_KEY))) return unauthenticated();

		const interaction = <APIInteraction>await request.json();

		const response = await als.run({ ctx, interaction }, handle);

		return respond(response);
	},
} satisfies ExportedHandler<Env>;

async function handle(): Promise<APIInteractionResponse> {
	const { interaction } = als.getStore()!;
	switch (interaction.type) {
		case InteractionType.Ping:
			return {
				type: InteractionResponseType.Pong,
			};
		case InteractionType.ApplicationCommand:
			if (interaction.data.type === ApplicationCommandType.ChatInput) {
				const option = interaction.data.options?.[0] as APIApplicationCommandInteractionDataIntegerOption | undefined;
				const game = new Game2048(option?.value);
				return {
					type: InteractionResponseType.ChannelMessageWithSource,
					data: game.toDiscordMessage(),
				};
			}
			break;
		case InteractionType.MessageComponent:
			switch (interaction.data.component_type) {
				case ComponentType.Button: {
					if (interaction.data.custom_id.startsWith('ignore_')) {
						return { type: InteractionResponseType.UpdateMessage, data: {} };
					}
					if (interaction.data.custom_id.startsWith('direction_')) {
						const direction = interaction.data.custom_id.slice('direction_'.length) as Direction;

						const game = Game2048.fromDiscordMessage(interaction.message);
						game[`move${direction}`]();

						return {
							type: InteractionResponseType.UpdateMessage,
							data: game.toDiscordMessage(),
						};
					}
				}
			}
	}
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: 'Unexpected Interaction',
		},
	};
}

const respond = (response: APIInteractionResponse) =>
	new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json' } });

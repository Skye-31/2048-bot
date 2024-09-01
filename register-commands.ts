import assert from 'node:assert';
import { inspect } from 'node:util';
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	RouteBases,
	Routes,
	type APIApplicationCommand,
} from 'discord-api-types/v10';
import dotenv from 'dotenv';

dotenv.config({ path: '.dev.vars' });

assert(process.env.BOT_ID, 'Set BOT_ID');
assert(process.env.BOT_TOKEN, 'Set BOT_TOKEN');

const commands: Omit<APIApplicationCommand, 'id' | 'application_id' | 'version'>[] = [
	{
		type: ApplicationCommandType.ChatInput,
		name: 'start',
		description: 'Start a 2048 game',
		default_member_permissions: null,
		integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
		contexts: [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
		options: [
			{
				type: ApplicationCommandOptionType.Integer,
				name: 'board-size',
				description: 'How big of a 2048 board to use (default: 4)',
				min_value: 4,
				max_value: 8,
				required: false,
			},
		],
	},
];

const res = await fetch(RouteBases.api + Routes.applicationCommands(process.env.BOT_ID), {
	body: JSON.stringify(commands),
	headers: { Authorization: `Bot ${process.env.BOT_TOKEN}`, 'Content-Type': 'application/json' },
	method: 'PUT',
});

console.log(res.status);
console.log(inspect(await res.json(), undefined, Infinity));

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

declare global {
	const process: {
		env: Record<string, string | undefined>;
		exit: (code?: number) => never;
	};
}

dotenv.config({ path: '.dev.vars' });

if (!process.env.BOT_ID) {
	console.error('Set BOT_ID env variable');
	process.exit(1);
}
if (!process.env.BOT_TOKEN) {
	console.error('Set BOT_TOKEN env variable');
	process.exit(1);
}

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
console.log(JSON.stringify(await res.json(), null, '\t'));

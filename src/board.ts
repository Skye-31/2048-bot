import { APIButtonComponent, APIMessage, ButtonStyle, ComponentType, MessageFlags, RouteBases, Routes } from 'discord-api-types/v10';
import type {
	APIActionRowComponent,
	APIButtonComponentWithCustomId,
	APIInteraction,
	APIInteractionResponseCallbackData,
	APIMessageActionRowComponent,
	RESTPostAPIInteractionFollowupJSONBody,
} from 'discord-api-types/v10';
import { als } from '.';

// Credit: https://taftcreates.itch.io/2048-assets
const emojis: Record<string | number, string> = {
	0: `<:Pink:1279904271222968473>`,
	2: `<:2_:1279903105206587393>`,
	4: `<:4_:1279903140560371846>`,
	8: `<:8_:1279903174622449757>`,
	16: `<:16:1279903216011575336>`,
	32: `<:32:1279903228892286987>`,
	64: `<:64:1279903236341497886>`,
	128: `<:256:1279903242012332175>`,
	256: `<:256:1279903242012332175>`,
	512: `<:512:1279903249234788362>`,
	1024: `<:1024:1279903281988112394>`,
	2048: `<:2048:1279903299356721225>`,
	4096: `<:4096:1279903308873601177>`,
	8192: `<:8192:1279903317346091012>`,
	16384: `<:16384:1279903327009771621>`,
	32768: `<:32768:1279903340443996232>`,
	65536: `<:65536:1279903346127536178>`,
	Fallback: `<:Background:1279903382382841966>`,
};

export type Direction = 'Up' | 'Down' | 'Left' | 'Right';

const flippedEmojis: Record<string, string> = {};
for (var key in emojis) {
	flippedEmojis[emojis[key]] = key;
}

export class Game2048 {
	private gridSize: number;
	private grid: number[][];
	private score: number;

	constructor(gridSize = 4) {
		this.gridSize = gridSize;
		this.grid = this.createEmptyGrid();
		this.score = 0;

		this.addRandomTile();
		this.addRandomTile();
	}

	private createEmptyGrid(): number[][] {
		return Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(0));
	}

	private addRandomTile() {
		const emptyCells: { x: number; y: number }[] = [];

		for (let x = 0; x < this.gridSize; x++) {
			for (let y = 0; y < this.gridSize; y++) {
				if (this.grid[x][y] === 0) {
					emptyCells.push({ x, y });
				}
			}
		}

		if (emptyCells.length > 0) {
			const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
			this.grid[x][y] = Math.random() < 0.9 ? 2 : 4;
		}
	}

	private slideRowLeft(row: number[]): number[] {
		const filteredRow = row.filter((val) => val !== 0);
		const mergedRow: number[] = [];

		for (let i = 0; i < filteredRow.length; i++) {
			if (filteredRow[i] === filteredRow[i + 1]) {
				mergedRow.push(filteredRow[i] * 2);
				this.score += filteredRow[i] * 2;
				i++;
			} else {
				mergedRow.push(filteredRow[i]);
			}
		}

		while (mergedRow.length < this.gridSize) {
			mergedRow.push(0);
		}

		return mergedRow;
	}

	private slideLeft() {
		const newGrid = this.grid.map((row) => this.slideRowLeft(row));

		if (!this.gridsEqual(this.grid, newGrid)) {
			this.grid = newGrid;
			this.addRandomTile();
		} else {
			this.addRandomTile();
		}
	}

	private rotateGridClockwise() {
		const newGrid: number[][] = this.createEmptyGrid();
		for (let x = 0; x < this.gridSize; x++) {
			for (let y = 0; y < this.gridSize; y++) {
				newGrid[y][this.gridSize - 1 - x] = this.grid[x][y];
			}
		}
		this.grid = newGrid;
	}

	private rotateGridCounterClockwise() {
		const newGrid: number[][] = this.createEmptyGrid();
		for (let x = 0; x < this.gridSize; x++) {
			for (let y = 0; y < this.gridSize; y++) {
				newGrid[this.gridSize - 1 - y][x] = this.grid[x][y];
			}
		}
		this.grid = newGrid;
	}

	private gridsEqual(grid1: number[][], grid2: number[][]): boolean {
		for (let x = 0; x < this.gridSize; x++) {
			for (let y = 0; y < this.gridSize; y++) {
				if (grid1[x][y] !== grid2[x][y]) return false;
			}
		}
		return true;
	}

	public moveLeft() {
		this.slideLeft();
	}

	public moveRight() {
		this.rotateGridClockwise();
		this.rotateGridClockwise();
		this.slideLeft();
		this.rotateGridClockwise();
		this.rotateGridClockwise();
	}

	public moveUp() {
		this.rotateGridCounterClockwise();
		this.slideLeft();
		this.rotateGridClockwise();
	}

	public moveDown() {
		this.rotateGridClockwise();
		this.slideLeft();
		this.rotateGridCounterClockwise();
	}

	get isGameOver(): boolean {
		if (this.grid.flat().includes(0)) {
			return false;
		}

		for (let x = 0; x < this.gridSize; x++) {
			for (let y = 0; y < this.gridSize; y++) {
				const currentValue = this.grid[x][y];
				if (
					(x < this.gridSize - 1 && currentValue === this.grid[x + 1][y]) ||
					(y < this.gridSize - 1 && currentValue === this.grid[x][y + 1])
				) {
					return false;
				}
			}
		}
		return true;
	}

	public toDiscordMessage(): APIInteractionResponseCallbackData {
		let str = '';
		for (let row of this.grid) {
			str += '\n' + row.map(numberToEmoji).join(' ');
		}

		const { isGameOver, score } = this;

		const components: APIActionRowComponent<APIMessageActionRowComponent>[] = isGameOver
			? []
			: [
					{
						components: [emptyComponent(), directionComponent('Up'), emptyComponent()],
						type: ComponentType.ActionRow,
					},
					{
						components: [
							directionComponent('Left'),
							{
								custom_id: `ignore_score`,
								style: ButtonStyle.Secondary,
								type: ComponentType.Button,
								label: score.toString(),
							},
							directionComponent('Right'),
						],
						type: ComponentType.ActionRow,
					},
					{
						components: [emptyComponent(), directionComponent('Down'), emptyComponent()],
						type: ComponentType.ActionRow,
					},
				];

		if (isGameOver) {
			const { ctx, interaction } = als.getStore()!;
			ctx.waitUntil(
				sendScoreFollowup(interaction, {
					content: `You achieved a total score of ${score}!`,
					flags: MessageFlags.Ephemeral,
				}),
			);
		}

		return { content: str, components, flags: MessageFlags.Ephemeral };
	}

	static fromDiscordMessage(message: APIMessage): Game2048 {
		const contents = message.content.split(/\s+/).map((x) => parseInt(flippedEmojis[x] as string));

		const size = Math.sqrt(contents.length);

		const board: number[][] = [];

		while (contents.length) {
			board.push(contents.splice(0, size));
		}

		const game = new this(size);
		game.grid = board;
		game.score = parseInt((message.components![1].components[1] as APIButtonComponentWithCustomId).label as string);

		return game;
	}
}

function numberToEmoji(item: number): string {
	return emojis[item] ?? emojis['Background'];
}

function directionComponent(direction: Direction): APIButtonComponent {
	return {
		custom_id: `direction_${direction}`,
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
		emoji: {
			name: { Up: '🔼', Down: '🔽', Left: '◀️', Right: '▶️' }[direction],
		},
	};
}

function emptyComponent(): APIButtonComponent {
	return {
		custom_id: `ignore_${Math.random()}`,
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
		label: '\u200b',
	};
}

async function sendScoreFollowup(interaction: APIInteraction, body: RESTPostAPIInteractionFollowupJSONBody) {
	await scheduler.wait(500);
	return fetch(RouteBases.api + Routes.webhook(interaction.id, interaction.token), {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json',
		},
	}).then(async (res) => {
		console.log(res.status);
		if (!res.ok) {
			console.log(await res.text());
		}
	});
}

import { config } from "./config";

interface Endpoints {
	"/singles": {
		player1: { score: number; tag: string };
		player2: { score: number; tag: string };
	};
	"/doubles": {
		team1: {
			score: number;
			player1?: { tag: string };
			player2?: { tag: string };
		};
		team2: {
			score: number;
			player1?: { tag: string };
			player2?: { tag: string };
		};
	};
	"/juice": Record<string, string[]>;
}

export const fetchApi = async <T extends keyof Endpoints>(
	endpoint: T,
): Promise<Endpoints[T]> => {
	const response = await fetch(`${config.apiUrl}${endpoint}`);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return response.json();
};

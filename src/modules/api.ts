import { config } from "./config";

interface ApiSinglesResponse {
	player1: { score: number; tag: string };
	player2: { score: number; tag: string };
}

interface ApiDoublesResponse {
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
}

export type ApiJuiceResponse = Record<string, string[]>;

export const fetchApi = async <
	Endpoint extends "/singles" | "/doubles" | "/juice",
>(
	endpoint: Endpoint,
): Promise<
	Endpoint extends "/singles"
		? ApiSinglesResponse
		: Endpoint extends "/doubles"
			? ApiDoublesResponse
			: ApiJuiceResponse
> => {
	const response = await fetch(`${config.apiUrl}${endpoint}`);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return await response.json();
};

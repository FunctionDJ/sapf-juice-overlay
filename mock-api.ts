import http from "node:http";

const PORT = Number(process.env["PORT"] ?? 3000);
const TARGET_WINS = 3;
const TICK_MS = Number(process.env["MOCK_TICK_MS"] ?? 3500);

// /juice is static and should contain every supported tag from startup.
const JUICE_BY_FRUIT = {
	apple: ["Bonjwa", "Silas"],
	orange: ["Branspeed", "meamking", "Laurster"],
	grape: ["Fiction", "Pipsqueak"],
	cherry: ["Jmook", "Magi"],
};

const ALL_PLAYER_TAGS = Object.values(JUICE_BY_FRUIT).flat();

const pick2RandomPlayers = () =>
	[0, 0].map(
		() => ALL_PLAYER_TAGS[Math.floor(Math.random() * ALL_PLAYER_TAGS.length)],
	) as [string, string];

const state = {
	singles: {
		type: "singles" as const,
		player1: {
			tag: "Branspeed",
			score: 0,
		},
		player2: {
			tag: "Bonjwa",
			score: 0,
		},
		winner: null as "player1" | "player2" | null,
		cooldownTicks: 0,
	},
	doubles: {
		type: "doubles" as const,
		team1: {
			player1: { tag: "Bonjwa" },
			player2: { tag: "Silas" },
			score: 0,
		},
		team2: {
			player1: { tag: "meamking" },
			player2: { tag: "Laurster" },
			score: 0,
		},
		winner: null as "team1" | "team2" | null,
		cooldownTicks: 0,
	},
};

type Match = (typeof state)[keyof typeof state];

function finishIfNeeded(match: Match) {
	if (match.type === "singles") {
		if (
			match.player1.score >= TARGET_WINS ||
			match.player2.score >= TARGET_WINS
		) {
			match.winner =
				match.player1.score > match.player2.score ? "player1" : "player2";
			match.cooldownTicks = 2;
			return true;
		}
	} else {
		if (match.team1.score >= TARGET_WINS || match.team2.score >= TARGET_WINS) {
			match.winner = match.team1.score > match.team2.score ? "team1" : "team2";
			match.cooldownTicks = 2;
			return true;
		}
	}

	return false;
}

function progressWinnerCooldown(match: Match) {
	if (!match.winner) {
		return;
	}

	match.cooldownTicks--;

	if (match.cooldownTicks <= 0) {
		// start next match

		if (match.type === "singles") {
			match.player1.score = 0;
			match.player2.score = 0;
		} else {
			match.team1.score = 0;
			match.team2.score = 0;
		}

		match.winner = null;
		match.cooldownTicks = 0;

		// Rotate singles tags between sets so every fruit bucket can be tested in /singles.
		if (match.type === "singles") {
			const [nextPlayer1Tag, nextPlayer2Tag] = pick2RandomPlayers();
			match.player1.tag = nextPlayer1Tag;
			match.player2.tag = nextPlayer2Tag;
		}
	}
}

function advanceMatch(match: Match) {
	if (match.winner) {
		return;
	}

	if (finishIfNeeded(match)) {
		return;
	}

	if (Math.random() < 0.2) {
		return;
	}

	if (match.type === "singles") {
		const trailingKey =
			match.player1.score <= match.player2.score ? "player1" : "player2";

		const leadingKey = trailingKey === "player1" ? "player2" : "player1";
		const scoreSideKey = Math.random() < 0.6 ? trailingKey : leadingKey;
		const selected = match[scoreSideKey];

		if (selected.score < TARGET_WINS) {
			selected.score += 1;
		}
	} else {
		const trailingKey =
			match.team1.score <= match.team2.score ? "team1" : "team2";

		const leadingKey = trailingKey === "team1" ? "team2" : "team1";
		const scoreSideKey = Math.random() < 0.6 ? trailingKey : leadingKey;
		const selected = match[scoreSideKey];

		if (selected.score < TARGET_WINS) {
			selected.score += 1;
		}
	}

	finishIfNeeded(match);
}

function tick() {
	progressWinnerCooldown(state.singles);
	progressWinnerCooldown(state.doubles);

	if (Math.random() < 0.52) {
		advanceMatch(state.singles);
	} else {
		advanceMatch(state.doubles);
	}
}

setInterval(tick, TICK_MS);

function jsonResponse(
	res: http.ServerResponse,
	payload: unknown,
	statusCode = 200,
) {
	res.writeHead(statusCode, {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
	});
	res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
	const url = new URL(req.url ?? "/", "http://127.0.0.1");

	if (url.pathname === "/singles") {
		jsonResponse(res, {
			bestOf: 5,
			targetWins: TARGET_WINS,
			winner: state.singles.winner,
			player1: state.singles.player1,
			player2: state.singles.player2,
		});
		return;
	}

	if (url.pathname === "/doubles") {
		jsonResponse(res, {
			bestOf: 5,
			targetWins: TARGET_WINS,
			winner: state.doubles.winner,
			team1: state.doubles.team1,
			team2: state.doubles.team2,
		});
		return;
	}

	if (url.pathname === "/juice") {
		jsonResponse(res, JUICE_BY_FRUIT);
		return;
	}

	jsonResponse(res, { error: "Not found" }, 404);
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`Mock API listening at http://127.0.0.1:${String(PORT)}`);
	console.log(`Tick interval: ${String(TICK_MS)}ms`);
});

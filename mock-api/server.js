import http from "node:http";

const PORT = Number(process.env.PORT ?? 3000);
const TARGET_WINS = 3;
const TICK_MS = Number(process.env.MOCK_TICK_MS ?? 3500);
const DEFAULT_DOUBLES_JUICE = "#f6a44b";

const singlesPalette = ["#fecf64", "#f39a2b", "#cc4f1d", "#8ed35a", "#50c2b0"];

const state = {
	singles: {
		setNumber: 1,
		player1: {
			juiceColor: singlesPalette[0],
			score: 0,
		},
		player2: {
			juiceColor: singlesPalette[1],
			score: 0,
		},
		winner: null,
		cooldownTicks: 0,
	},
	doubles: {
		setNumber: 1,
		team1: {
			juiceColor: DEFAULT_DOUBLES_JUICE,
			score: 0,
		},
		team2: {
			juiceColor: DEFAULT_DOUBLES_JUICE,
			score: 0,
		},
		winner: null,
		cooldownTicks: 0,
	},
};

function pickDifferentColor(currentColor) {
	const options = singlesPalette.filter((color) => color !== currentColor);
	return (
		options[Math.floor(Math.random() * options.length)] ?? singlesPalette[0]
	);
}

function startNextSet(match, side1Key, side2Key, withJuiceRotation = false) {
	match.setNumber += 1;
	match[side1Key].score = 0;
	match[side2Key].score = 0;
	match.winner = null;
	match.cooldownTicks = 0;

	if (withJuiceRotation) {
		if (Math.random() < 0.65) {
			match.player1.juiceColor = pickDifferentColor(match.player1.juiceColor);
		}

		if (Math.random() < 0.65) {
			match.player2.juiceColor = pickDifferentColor(match.player2.juiceColor);
		}
	}
}

function finishIfNeeded(match, side1Key, side2Key) {
	const side1 = match[side1Key];
	const side2 = match[side2Key];

	if (side1.score >= TARGET_WINS || side2.score >= TARGET_WINS) {
		match.winner = side1.score > side2.score ? side1Key : side2Key;
		match.cooldownTicks = 2;
		return true;
	}

	return false;
}

function progressWinnerCooldown(match, side1Key, side2Key) {
	if (!match.winner) {
		return;
	}

	match.cooldownTicks -= 1;
	if (match.cooldownTicks <= 0) {
		startNextSet(match, side1Key, side2Key, side1Key === "player1");
	}
}

function advanceMatch(match, side1Key, side2Key) {
	if (match.winner) {
		return;
	}

	if (finishIfNeeded(match, side1Key, side2Key)) {
		return;
	}

	if (Math.random() < 0.2) {
		return;
	}

	const side1 = match[side1Key];
	const side2 = match[side2Key];
	const trailingKey = side1.score <= side2.score ? side1Key : side2Key;
	const leadingKey = trailingKey === side1Key ? side2Key : side1Key;
	const scoreSideKey = Math.random() < 0.6 ? trailingKey : leadingKey;
	const selected = match[scoreSideKey];

	if (selected.score < TARGET_WINS) {
		selected.score += 1;
	}

	finishIfNeeded(match, side1Key, side2Key);
}

function tick() {
	progressWinnerCooldown(state.singles, "player1", "player2");
	progressWinnerCooldown(state.doubles, "team1", "team2");

	if (Math.random() < 0.52) {
		advanceMatch(state.singles, "player1", "player2");
	} else {
		advanceMatch(state.doubles, "team1", "team2");
	}

	if (!state.singles.winner && Math.random() < 0.25) {
		const side = Math.random() < 0.5 ? "player1" : "player2";
		state.singles[side].juiceColor = pickDifferentColor(
			state.singles[side].juiceColor,
		);
	}
}

setInterval(tick, TICK_MS);

function jsonResponse(res, payload, statusCode = 200) {
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
			setNumber: state.singles.setNumber,
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
			setNumber: state.doubles.setNumber,
			winner: state.doubles.winner,
			team1: state.doubles.team1,
			team2: state.doubles.team2,
		});
		return;
	}

	if (url.pathname === "/juice") {
		jsonResponse(res, {
			singles: {
				player1: state.singles.player1.juiceColor,
				player2: state.singles.player2.juiceColor,
			},
			doubles: {
				team1: state.doubles.team1.juiceColor,
				team2: state.doubles.team2.juiceColor,
			},
		});
		return;
	}

	jsonResponse(res, { error: "Not found" }, 404);
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`Mock API listening at http://127.0.0.1:${String(PORT)}`);
	console.log(`Tick interval: ${String(TICK_MS)}ms`);
});

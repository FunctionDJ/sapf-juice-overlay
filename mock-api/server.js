import http from "node:http";

const PORT = Number(process.env.PORT ?? 3000);
const TARGET_WINS = 3;
const TICK_MS = Number(process.env.MOCK_TICK_MS ?? 3500);
const DEFAULT_DOUBLES_JUICE = "apple";

const fruitPalette = ["orange", "apple", "grape", "cherry"];

const state = {
	singles: {
		setNumber: 1,
		player1: {
			juiceFruit: fruitPalette[0],
			score: 0,
		},
		player2: {
			juiceFruit: fruitPalette[1],
			score: 0,
		},
		winner: null,
		cooldownTicks: 0,
	},
	doubles: {
		setNumber: 1,
		team1: {
			juiceFruit: DEFAULT_DOUBLES_JUICE,
			score: 0,
		},
		team2: {
			juiceFruit: DEFAULT_DOUBLES_JUICE,
			score: 0,
		},
		winner: null,
		cooldownTicks: 0,
	},
};

function pickDifferentFruit(currentFruit) {
	const options = fruitPalette.filter((fruit) => fruit !== currentFruit);
	return options[Math.floor(Math.random() * options.length)] ?? fruitPalette[0];
}

function startNextSet(match, side1Key, side2Key, withJuiceRotation = false) {
	match.setNumber += 1;
	match[side1Key].score = 0;
	match[side2Key].score = 0;
	match.winner = null;
	match.cooldownTicks = 0;

	if (withJuiceRotation) {
		if (Math.random() < 0.65) {
			match.player1.juiceFruit = pickDifferentFruit(match.player1.juiceFruit);
		}

		if (Math.random() < 0.65) {
			match.player2.juiceFruit = pickDifferentFruit(match.player2.juiceFruit);
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
		state.singles[side].juiceFruit = pickDifferentFruit(
			state.singles[side].juiceFruit,
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
				player1: state.singles.player1.juiceFruit,
				player2: state.singles.player2.juiceFruit,
			},
			doubles: {
				team1: state.doubles.team1.juiceFruit,
				team2: state.doubles.team2.juiceFruit,
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

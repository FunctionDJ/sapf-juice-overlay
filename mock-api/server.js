import http from "node:http";

const PORT = Number(process.env.PORT ?? 3000);
const TARGET_WINS = 3;
const TICK_MS = Number(process.env.MOCK_TICK_MS ?? 3500);

// /juice is static and should contain every supported tag from startup.
const JUICE_BY_FRUIT = {
	apple: ["Bonjwa", "Silas"],
	orange: ["Branspeed", "meamking", "Laurster"],
	grape: ["Fiction", "Pipsqueak"],
	cherry: ["Jmook", "Magi"],
};

const ALL_PLAYER_TAGS = Object.values(JUICE_BY_FRUIT).flat();

function pickDistinctTagsFromPool(pool, count) {
	if (pool.length <= count) {
		return [...new Set(pool)].slice(0, count);
	}

	const chosen = new Set();
	while (chosen.size < count) {
		const randomTag = pool[Math.floor(Math.random() * pool.length)];
		if (randomTag) {
			chosen.add(randomTag);
		}
	}

	return [...chosen];
}

const state = {
	singles: {
		setNumber: 1,
		player1: {
			tag: "Branspeed",
			score: 0,
		},
		player2: {
			tag: "Bonjwa",
			score: 0,
		},
		winner: null,
		cooldownTicks: 0,
	},
	doubles: {
		setNumber: 1,
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
		winner: null,
		cooldownTicks: 0,
	},
};

function startNextSet(match, side1Key, side2Key) {
	match.setNumber += 1;
	match[side1Key].score = 0;
	match[side2Key].score = 0;
	match.winner = null;
	match.cooldownTicks = 0;

	// Rotate singles tags between sets so every fruit bucket can be tested in /singles.
	if (side1Key === "player1" && side2Key === "player2") {
		const [
			nextPlayer1Tag = match.player1.tag,
			nextPlayer2Tag = match.player2.tag,
		] = pickDistinctTagsFromPool(ALL_PLAYER_TAGS, 2);
		match.player1.tag = nextPlayer1Tag;
		match.player2.tag = nextPlayer2Tag;
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
		startNextSet(match, side1Key, side2Key);
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
		jsonResponse(res, JUICE_BY_FRUIT);
		return;
	}

	jsonResponse(res, { error: "Not found" }, 404);
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`Mock API listening at http://127.0.0.1:${String(PORT)}`);
	console.log(`Tick interval: ${String(TICK_MS)}ms`);
});

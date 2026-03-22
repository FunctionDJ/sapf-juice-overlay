import { fetchApi } from "./api";
import type { Fruit } from "./config";

const juiceData = await fetchApi("/juice");

export const juiceLookup = new Map<string, Fruit>();

for (const [fruitName, tags] of Object.entries(juiceData)) {
	for (const tag of tags) {
		// TS always views object entries keys (here: fruitName) as just "string"
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		juiceLookup.set(tag, fruitName as Fruit);
	}
}

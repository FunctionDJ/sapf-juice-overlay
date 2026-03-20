import { fetchApi } from "./api";

const juiceData = await fetchApi("/juice");

const juiceLookup = new Map<string, string>();

for (const [fruitName, tags] of Object.entries(juiceData)) {
	for (const tag of tags) {
		juiceLookup.set(tag, fruitName);
	}
}

export const getFruitByTag = (tags: (string | undefined)[]) => {
	for (const tag of tags) {
		if (tag === undefined) {
			continue;
		}

		const fruit = juiceLookup.get(tag);
		if (fruit !== undefined) {
			return fruit;
		}
	}

	return null;
};

const configResponse = await fetch("/config.json", { cache: "no-store" });
const configText = await configResponse.text();

setInterval(
	() => {
		void (async () => {
			try {
				const response = await fetch("/config.json", { cache: "no-store" });
				const nextConfigText = await response.text();

				if (nextConfigText !== configText) {
					window.location.reload();
				}
			} catch (error) {
				console.error("Failed to poll /config.json for changes:", error);
			}
		})();
	},
	import.meta.env.DEV ? 1000 : 10000,
);

export {};

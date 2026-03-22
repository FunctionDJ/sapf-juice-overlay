const modeParam = new URLSearchParams(window.location.search).get("mode");

export const mode = ["doubles", "idle"].includes(modeParam ?? "")
	? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		(modeParam as "singles" | "doubles" | "idle")
	: "singles";

export const layoutMode =
	`main-screen-${mode === "doubles" ? "right" : "center"}` as const;

// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
	{ ignores: ["eslint.config.js"] },
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			"@typescript-eslint/strict-boolean-expressions": "error",
			"@typescript-eslint/consistent-return": "error",
			"@typescript-eslint/consistent-type-imports": "error",
			"@typescript-eslint/default-param-last": "error",
			"@typescript-eslint/method-signature-style": "error",
			"@typescript-eslint/no-import-type-side-effects": "error",
			"@typescript-eslint/no-loop-func": "error",
			"@typescript-eslint/no-shadow": "error",
			"@typescript-eslint/no-unsafe-type-assertion": "error",
			"@typescript-eslint/prefer-destructuring": "error",
			"@typescript-eslint/prefer-ts-expect-error": "error",
			"@typescript-eslint/prefer-optional-chain": [
				"error",
				// {
				// 	// resolves conflict with @typescript-eslint/strict-boolean-expressions
				// 	requireNullish: true,
				// },
			],
			"@typescript-eslint/strict-void-return": "error",
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			"@typescript-eslint/no-non-null-assertion": "off",
		},
	},
);

import { defineConfig } from "tsdown";

export default defineConfig({
	root: "src",
	entry: "src/**/*.ts",
	outDir: "dist",
	format: "esm",
	target: "es2024",
	clean: true,
	sourcemap: true
});
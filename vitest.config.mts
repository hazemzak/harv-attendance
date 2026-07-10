import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

// schema.sql is this repo's canonical "apply to a fresh D1" script (same one
// used to set up local/test databases by hand) -- read here (Node side, has
// fs) and injected as a text binding since the worker-side setup file that
// applies it has no filesystem access.
const SCHEMA_SQL = readFileSync("./schema.sql", "utf-8");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: { SCHEMA_SQL },
      },
    }),
  ],
  test: {
    setupFiles: ["./test/apply-schema.ts"],
  },
});

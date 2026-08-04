import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror tsconfig paths so unit tests can import via "@/...".
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    // Unit/static tests live in tests/unit and run with `npm test`.
    // tests/microsoft-integration.test.ts requires a running server + auth and
    // is executed separately via `npm run test:integration`.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});

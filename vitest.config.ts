import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * The engine tests import by relative path, but anything touching the guides or
 * i18n layers uses the "@/" alias the app uses, so the test runner has to
 * resolve it the same way tsconfig does.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

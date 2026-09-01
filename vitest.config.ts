import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    env: {
      VITEST: "true",
    },
    include: ["client/**/*.spec.ts", "client/**/*.spec.tsx", "api/**/*.test.ts"],
    // TiDB Cloud under parallel integration load is often >5s/request.
    testTimeout: 20_000,
    hookTimeout: 90_000,
    fileParallelism: 2,
    maxWorkers: 2,
  },
});

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    setupFiles: ["./setupVitest.ts"],
    environment: "jsdom",
  },
  plugins: [tsconfigPaths()],
});

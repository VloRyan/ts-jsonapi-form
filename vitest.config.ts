import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths"; // <—- import this

export default defineConfig({
  test: {
    setupFiles: ["./setupVitest.ts"],
    environment: "jsdom",
  },
  plugins: [tsconfigPaths()],
});

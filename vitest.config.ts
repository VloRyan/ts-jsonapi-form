import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./setupVitest.ts"],
    environment: "jsdom",
  },
});

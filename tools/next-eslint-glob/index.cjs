"use strict"

// Next's plugin loads this adapter synchronously with CommonJS require().
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { globSync } = require("tinyglobby")

// Only the globSync API consumed by @next/eslint-plugin-next is supported.
// fast-glob matches a directory itself; tinyglobby expands it recursively by default.
exports.globSync = (patterns, options) => globSync(patterns, {
  ...options,
  expandDirectories: false,
})

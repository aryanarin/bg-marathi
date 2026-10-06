const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // Async data-loading effects legitimately call setState in a promise
      // callback and (re)set a loading flag; the React 19 compiler rules flag
      // this stylistically. Keep as warnings, not build-breaking errors.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  { ignores: ["dist/*", ".expo/*", "node_modules/*"] },
]);

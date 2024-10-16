/* eslint-disable no-undef */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      // include any other plugin code...

      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config
    },
  },
});

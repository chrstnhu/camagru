const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["srcs/client/public/srcs/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      complexity: ["warn", 8],
      "max-lines": [
        "warn",
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-lines-per-function": [
        "warn",
        {
          max: 40,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
];

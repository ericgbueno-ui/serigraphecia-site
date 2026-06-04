module.exports = {
  // Lint & Prettify TS and JS files
  "**/*.(ts|tsx|js|jsx)": (filenames) => [
    `npx eslint --fix ${filenames.join(" ")}`,
    `npx prettier --write ${filenames.join(" ")}`,
  ],

  // Prettify only Markdown, CSS, and JSON files
  "**/*.(md|css|json)": (filenames) => `npx prettier --write ${filenames.join(" ")}`,
};

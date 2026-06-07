module.exports = {
  "**/*.{js,mjs,cjs,ts,tsx}": ["prettier --write", "eslint --fix"],
  "**/*.{json,yaml,yml}": ["prettier --write"],
  "**/*.{css,scss,less}": ["prettier --write"],
  "**/*.md": ["prettier --write"],
};

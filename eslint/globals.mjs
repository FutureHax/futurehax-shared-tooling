/**
 * Foundry VTT global variable definitions for ESLint.
 * Import specific sets or spread them all into your config.
 */

export const coreGlobals = {
  game: "readonly",
  ui: "readonly",
  canvas: "readonly",
  CONFIG: "readonly",
  CONST: "readonly",
  foundry: "readonly",
  Hooks: "readonly",
};

export const documentGlobals = {
  Actor: "readonly",
  Item: "readonly",
  ChatMessage: "readonly",
  Roll: "readonly",
};

export const appGlobals = {
  DialogV2: "readonly",
  ApplicationV2: "readonly",
  Dialog: "readonly",
  Application: "readonly",
  FormApplication: "readonly",
};

export const utilityGlobals = {
  TextEditor: "readonly",
  fromUuid: "readonly",
  fromUuidSync: "readonly",
  duplicate: "readonly",
  mergeObject: "readonly",
  setProperty: "readonly",
  getProperty: "readonly",
  hasProperty: "readonly",
  randomID: "readonly",
  debounce: "readonly",
  loadTemplates: "readonly",
  renderTemplate: "readonly",
  Handlebars: "readonly",
};

export const allFoundryGlobals = {
  ...coreGlobals,
  ...documentGlobals,
  ...appGlobals,
  ...utilityGlobals,
};

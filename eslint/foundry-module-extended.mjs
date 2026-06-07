import { createFoundryConfig } from "./foundry-module.mjs";
import { appGlobals } from "./globals.mjs";

/**
 * Extended Foundry module ESLint config that includes legacy Application framework globals
 * (Dialog, Application, FormApplication, renderTemplate).
 * Use for modules that interact with the v1 Application API.
 */
export default createFoundryConfig({
  extraGlobals: appGlobals,
});

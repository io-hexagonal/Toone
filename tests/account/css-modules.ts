/**
 * Lets node:test import components that use CSS modules: every `*.module.css`
 * import becomes an object whose class names are the keys themselves.
 * Import this before any component.
 */
import Module from "node:module";

type Loader = (module: { exports: unknown }, filename: string) => void;
const extensions = (Module as unknown as { _extensions: Record<string, Loader> })._extensions;

extensions[".css"] = (module) => {
  module.exports = new Proxy({}, { get: (_target, key) => (key === "__esModule" ? false : String(key)) });
};

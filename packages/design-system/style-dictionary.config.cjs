/**
 * Style Dictionary v4 config.
 * Consumes design-system/tokens/*.json (W3C DTCG format) and emits:
 *   build/css/tokens.css      — CSS custom properties
 *   build/tailwind/tokens.cjs — Tailwind theme extension
 *   build/ts/tokens.ts        — TypeScript exports
 *
 * Spec: openspec/specs/design-tokens/spec.md
 */
const path = require('node:path');

// glob requires forward slashes even on Windows
const tokensGlob = path.join(__dirname, 'tokens', '**', '*.json').split(path.sep).join('/');

const buildBase = path.join(__dirname, 'build').split(path.sep).join('/') + '/';

/** @type {import('style-dictionary').Config} */
module.exports = {
  log: { warnings: 'warn', verbosity: 'default' },
  // DTCG opt-in: tokens use $type / $value
  usesDtcg: true,
  source: [tokensGlob],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: buildBase + 'css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: { outputReferences: true, selector: ':root' },
        },
      ],
    },
    tailwind: {
      transformGroup: 'js',
      buildPath: buildBase + 'tailwind/',
      files: [
        {
          destination: 'tokens.cjs',
          format: 'javascript/module',
        },
      ],
    },
    ts: {
      transformGroup: 'js',
      buildPath: buildBase + 'ts/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'javascript/es6',
        },
      ],
    },
  },
};

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
      // Stock 'css' transform group MINUS `asset/url`. Our asset tokens carry mark
      // IDs (e.g. `frame.box`) resolved by packages/kirukal/manifest/components.json,
      // not file paths, so url() wrapping would make them unresolvable.
      // Spec: openspec/specs/design-tokens/spec.md — "Drawn asset tokens".
      transforms: [
        'attribute/cti',
        'name/kebab',
        'time/seconds',
        'html/icon',
        'size/rem',
        'color/css',
        'fontFamily/css',
        'cubicBezier/css',
        'strokeStyle/css/shorthand',
        'border/css/shorthand',
        'typography/css/shorthand',
        'transition/css/shorthand',
        'shadow/css/shorthand',
      ],
      buildPath: buildBase + 'css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: { outputReferences: true, selector: ':root' },
        },
      ],
    },
    // Tailwind v4 reads its theme from an `@theme` block, and its namespaces
    // (--color-*, --breakpoint-*, --radius-*, --leading-*, --tracking-*) are the
    // same names Style Dictionary already emits. Emitting straight into @theme is
    // what lets apps stop hand-copying the palette.
    //
    // Two exclusions:
    //   color.absurd.* — assets/illustrations only. Putting them here would mint
    //     `bg-absurd-pink` utilities and invite exactly the UI use the
    //     design-tokens "Absurd-color asset boundary" forbids.
    //   asset.*        — mark IDs, not CSS values; they belong to the kirukal
    //     manifest, not to Tailwind.
    theme: {
      transformGroup: 'css',
      buildPath: buildBase + 'css/',
      files: [
        {
          destination: 'theme.css',
          format: 'css/variables',
          options: { outputReferences: false, selector: '@theme' },
          filter: (token) => {
            const p = token.path;
            if (p[0] === 'asset') return false;
            if (p[0] === 'color' && p[1] === 'absurd') return false;
            return true;
          },
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

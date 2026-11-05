/**
 * The loader's first frame, painted before any of the app has loaded.
 *
 * On a first visit the blank sheet is the first thing on screen; the pen needs
 * React, the loader and a worker before it can draw: a few hundred
 * milliseconds of whatever the page was. This inline script runs in <head>
 * before the body is parsed. It marks <html> with the visitor's paper, and one
 * CSS rule lays that sheet over everything, exactly as the loader will lay it,
 * so the pen's first stroke lands on the paper that was already there. The
 * loader clears the mark when it starts drawing (clearInkBoot); if nothing
 * does, it clears itself.
 *
 * A pseudo-element on <html>, not a node, so React's hydration never sees it.
 */
import { sheetCss } from './paper';

const ATTR = 'data-ink-boot';

/** Only where the loader will show (a first visit): the same rule as app-loader.tsx. */
export const INK_BOOT_SCRIPT = `(function(){try{
if(sessionStorage.getItem('kiruk-loading-seen')==='true')return;
var n='old';try{if(localStorage.getItem('kiruk-dawn')==='new')n='new'}catch(e){}
var d=document.documentElement;
d.setAttribute('${ATTR}',n);
setTimeout(function(){d.removeAttribute('${ATTR}')},9000);
}catch(e){}})();`;

// (the page's scrollbar goes too: nothing fixed can paint over it; the loader takes the gutter away itself once it mounts)
export const INK_BOOT_CSS = `html[${ATTR}]{overflow:hidden;scrollbar-gutter:auto}html[${ATTR}]::after{content:"";position:fixed;inset:0;z-index:2147483000;pointer-events:none;${sheetCss('old')}}html[${ATTR}="new"]::after{${sheetCss('new')}}`;

/** The pen is drawing: the boot sheet can go. */
export function clearInkBoot() {
  if (typeof document !== 'undefined') document.documentElement.removeAttribute(ATTR);
}

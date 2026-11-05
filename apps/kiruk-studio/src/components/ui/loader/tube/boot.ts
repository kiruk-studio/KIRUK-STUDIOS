/**
 * The opening's first frame, painted before any of the app has loaded.
 *
 * On a first visit the tube is the first thing on screen, but the tube needs
 * React, the loader and a worker before it can draw: a few hundred
 * milliseconds of whatever the page was. This inline script runs in <head>,
 * before the body is parsed: it marks <html>, and one CSS rule paints the
 * tube's dark glass with a faint warm glow where the pupil will be (the eye's
 * own framing, framing.ts, repeated in a few lines). The tube clears the mark
 * when it starts painting (clearTubeBoot); if nothing does, it clears itself.
 *
 * A pseudo-element on <html>, not a node, so React's hydration never sees it.
 */

const ATTR = 'data-tube-boot';

/**
 * Only where the loader will show (a first visit, not the paper desk): the
 * same rules as app-loader.tsx and LayoutClientShell.tsx. The framing is
 * eyeShot's: a box round the eye 32 mm wide, 12 mm above it to 10 mm below on
 * a wide screen and 16 mm below on a phone, blended by the window's shape; the
 * pupil sits 0.1 mm right of and 0.3 mm above the globe's centre.
 */
export const TUBE_BOOT_SCRIPT = `(function(){try{
if(sessionStorage.getItem('kiruk-loading-seen')==='true')return;
var w=innerWidth,h=innerHeight,a=w/Math.max(h,1);
var t=Math.min(1,Math.max(0,(a-0.75)/0.35)),s=t*t*(3-2*t);
var top=12,bottom=-16+6*s,span=Math.max(top-bottom,32/a),k=h/span;
var d=document.documentElement;
d.style.setProperty('--tube-boot-x',(w/2+0.1*k)+'px');
d.style.setProperty('--tube-boot-y',(h*(0.5+(top+bottom)/2/span)-0.3*k)+'px');
d.setAttribute('${ATTR}','');
setTimeout(function(){d.removeAttribute('${ATTR}')},9000);
}catch(e){}})();`;

// (the page's scrollbar goes too: nothing fixed can paint over it, and it showed as a white strip;
// the loader takes the gutter away itself once it mounts, dropPageGutter)
export const TUBE_BOOT_CSS = `html[${ATTR}]{overflow:hidden;scrollbar-gutter:auto;background:#f4ecdf}html[${ATTR}]::after{content:"";position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:radial-gradient(circle at var(--tube-boot-x,50%) var(--tube-boot-y,50%),rgba(26,18,14,.10) 0,rgba(26,18,14,.03) 46px,rgba(244,236,223,0) 220px),#f4ecdf}`;

/** The tube is painting: the boot frame can go. */
export function clearTubeBoot() {
  if (typeof document !== 'undefined') document.documentElement.removeAttribute(ATTR);
}

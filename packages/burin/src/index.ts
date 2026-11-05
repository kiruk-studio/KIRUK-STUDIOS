/**
 * @kiruk/burin — kiruk's engraving engine.
 *
 *   core/renderer   one GPU pass: WebGPU, WebGL 2 fallback, drawn on demand
 *   core/textures   baked paper and noise tiles
 *   paper           as made · as found · platemark · held to the light
 *   gpu/lines       burin line fields: engrave, contour, stipple
 *   vector/burin    burin strokes as SVG: swelling lines, guides, scale bars
 *   plate           HTML-in-Canvas ink plate
 *   motion          exact springs, reflexes, blinks, histories
 *   hand            p5.brush media (red chalk, bistre wash, iron-gall quill, lead white) painted
 *                   in a worker and laid into the paper by the compose pass (./hand, ./hand/worker)
 *   subjects/eye    the engraved eye: rig, motion, shader, and its hand-colouring (./eye-hand)
 *
 * spec-link: ideas/studio-dawn/eye.md · skill: .claude/skills/kiruk-burin
 */
export {
  createEyeEngine,
  type EngineInfo,
  type EyeEngine,
  type EyeFrame,
  type HandFrame,
  INK_RGB,
  type Rect,
} from './core/renderer';
export * from './motion/dynamics';
export { PAPER_RGB } from './paper/paper';
export { createHtmlPlate, type HtmlPlate, htmlInCanvasSupported } from './plate/htmlPlate';
export * from './subjects/eye';

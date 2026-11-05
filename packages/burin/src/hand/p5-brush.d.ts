/**
 * Types for the parts of p5.brush's standalone build (3.0.0) the hand uses.
 * The package ships JavaScript only. Signatures follow its docs/standalone.md and
 * llms.txt; angles are in the current angleMode (the hand keeps radians).
 */
declare module 'p5.brush/standalone' {
  /** [x, y] or [x, y, pressure] */
  export type BrushPoint = [number, number] | [number, number, number];

  export type BrushParams = {
    type?: 'default' | 'spray' | 'marker' | 'custom' | 'image';
    weight: number;
    scatter: number;
    sharpness?: number;
    grain?: number;
    opacity: number;
    spacing: number;
    pressure?:
      | [number, number]
      | [number, number, number]
      | ((t: number) => number)
      | { mode?: 'gaussian' | 'custom'; curve: [number, number]; min_max: [number, number] };
    rotate?: 'none' | 'natural' | 'random';
    markerTip?: boolean;
    noise?: number;
    tip?: (surface: TipSurface) => void;
  };

  export type TipSurface = {
    push(): void;
    pop(): void;
    translate(x: number, y: number): void;
    scale(x: number, y?: number): void;
    rotate(radians: number): void;
    fill(value: number | string | number[]): void;
    noFill(): void;
    stroke(value: number | string | number[]): void;
    noStroke(): void;
    strokeWeight(w: number): void;
    rect(x: number, y: number, w: number, h: number): void;
    circle(x: number, y: number, d: number): void;
    ellipse(x: number, y: number, w: number, h: number): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    beginShape(): void;
    vertex(x: number, y: number): void;
    endShape(close?: boolean): void;
  };

  export const DEGREES: string;
  export const RADIANS: string;

  export function load(target: OffscreenCanvas | HTMLCanvasElement): void;
  export function render(): void;
  export function clear(...color: (string | number)[]): void;
  export function push(): void;
  export function pop(): void;
  export function translate(x: number, y: number): void;
  export function rotate(angle: number): void;
  export function scale(x: number, y?: number): void;
  export function angleMode(mode: string): void;
  export function seed(n: number): void;
  export function noiseSeed(n: number): void;

  export function scaleBrushes(factor: number): void;
  export function add(name: string, params: BrushParams): void | Promise<void>;
  export function box(): string[];
  export function pick(name: string): void;
  export function set(name: string, color: string, weight?: number): void;
  export function stroke(color: string): void;
  export function strokeWeight(weight: number): void;
  export function noStroke(): void;
  export function clip(region: [number, number, number, number]): void;
  export function noClip(): void;

  export function fill(color: string, opacity?: number): void;
  export function noFill(): void;
  export function fillBleed(
    strength: number,
    direction?: 'out' | 'in',
    angle?: number | null,
  ): void;
  export function fillTexture(
    texture?: number,
    border?: number,
    scatter?: boolean,
    split?: number,
  ): void;
  export function wash(color: string, opacity?: number): void;
  export function noWash(): void;

  export function hatch(
    dist: number,
    angle: number,
    options?: { rand?: number | false; continuous?: boolean; gradient?: number | false },
  ): void;
  export function hatchStyle(name: string, color: string, weight?: number): void;
  export function noHatch(): void;
  export function mass(
    name: string,
    color: string,
    options?: { precision?: number; strength?: number; gradient?: number; outline?: boolean },
  ): void;
  export function noMass(): void;

  export function field(name: string): void;
  export function noField(): void;
  export function wiggle(intensity: number): void;

  export function line(x1: number, y1: number, x2: number, y2: number): void;
  export function flowLine(x: number, y: number, length: number, dir: number): void;
  export function spline(points: BrushPoint[], curvature?: number): unknown;
  export function polygon(points: BrushPoint[]): unknown;
  export function circle(
    x: number,
    y: number,
    radius: number,
    irregular?: number | boolean,
  ): unknown;
  export function rect(
    x: number,
    y: number,
    w: number,
    h: number,
    mode?: 'corner' | 'center',
  ): void;
  export function arc(x: number, y: number, radius: number, start: number, end: number): unknown;
  export function beginShape(curvature?: number): void;
  export function vertex(x: number, y: number, pressure?: number): void;
  export function endShape(close?: boolean): unknown;
}

/**
 * The hand's textures. Regression: every slot must own its placeholder.
 *
 * three.js shares one sampler between texture nodes whose textures share a uuid
 * (TextureNode.getUniformHash is the texture's uuid; UniformNode.getSharedNode), owned by
 * the first node built. When the slots were built on one shared placeholder, chalk, quill
 * and iris went on sampling the wash, whatever `.value` they were given later.
 *
 * three/webgpu and three/tsl build nodes in node without a renderer, so this runs as is.
 * spec-link: ideas/studio-dawn/hand.md
 */
import { uv } from 'three/tsl';
import { DataTexture } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { createHandTextures, type HandSlot } from '../src/hand/compose';

const SLOTS: HandSlot[] = ['chalk', 'wash', 'ink', 'body', 'iris'];

describe('createHandTextures', () => {
  it('gives every slot a distinct placeholder texture (distinct uuid)', () => {
    const tex = createHandTextures();
    const uuids = SLOTS.map((s) => tex.get(s).uuid);
    expect(new Set(uuids).size).toBe(SLOTS.length);
    for (const s of SLOTS) expect(tex.isEmpty(s)).toBe(true);
  });

  it('the nodes built for different slots never share a uniform', () => {
    const tex = createHandTextures();
    // biome-ignore lint/suspicious/noExplicitAny: TSL nodes are loosely typed
    const nodes = SLOTS.map((s) => tex.sample(s, uv()) as any);
    const hashes = nodes.map((n) => n.getUniformHash());
    expect(new Set(hashes).size).toBe(SLOTS.length);
  });

  it('lead white waits on black, the other media on white', () => {
    const tex = createHandTextures();
    const px = (s: HandSlot) => Array.from((tex.get(s) as DataTexture).image.data as Uint8Array);
    expect(px('body')).toEqual([0, 0, 0, 255]);
    for (const s of ['chalk', 'wash', 'ink', 'iris'] as const)
      expect(px(s)).toEqual([255, 255, 255, 255]);
  });

  it('set swaps every node of a slot, and only that slot; null restores its placeholder', () => {
    const tex = createHandTextures();
    // biome-ignore lint/suspicious/noExplicitAny: TSL nodes are loosely typed
    const a = tex.sample('chalk', uv()) as any;
    // biome-ignore lint/suspicious/noExplicitAny: TSL nodes are loosely typed
    const b = tex.sample('chalk', uv()) as any;
    // biome-ignore lint/suspicious/noExplicitAny: TSL nodes are loosely typed
    const w = tex.sample('wash', uv()) as any;
    const empty = tex.get('chalk');
    const washEmpty = tex.get('wash');
    const sheet = new DataTexture(new Uint8Array(4), 1, 1);
    tex.set('chalk', sheet);
    expect(a.value).toBe(sheet);
    expect(b.value).toBe(sheet);
    expect(w.value).toBe(washEmpty);
    expect(tex.isEmpty('chalk')).toBe(false);
    // A node built after the sheet arrived samples the sheet too.
    // biome-ignore lint/suspicious/noExplicitAny: TSL nodes are loosely typed
    expect((tex.sample('chalk', uv()) as any).value).toBe(sheet);
    tex.set('chalk', null);
    expect(a.value).toBe(empty);
    expect(tex.isEmpty('chalk')).toBe(true);
  });

  it('two hands never share placeholders either', () => {
    const one = createHandTextures();
    const two = createHandTextures();
    for (const s of SLOTS) expect(one.get(s).uuid).not.toBe(two.get(s).uuid);
  });
});

/**
 * three/tsl, untyped, for the eye's node modules.
 *
 * The node generics in @types/three r186 narrow every result (fract() of an
 * untyped vec2 comes back a float, a colour uniform will not pass where a
 * vec3 is wanted), so helpers cannot be composed without a cast at every
 * call. The node modules build graph through this handle instead; the shader
 * compiler, on both backends, is the type check that matters, and the lab
 * compiles every node module on load.
 */

import * as TSL from 'three/tsl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type N = any;

export const T: Record<keyof typeof TSL, N> = TSL as unknown as Record<keyof typeof TSL, N>;

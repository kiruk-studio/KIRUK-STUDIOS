/**
 * One theme for the studio eye. The id is `codex`; the picture technology
 * it borrows is resolved inside the eye (the etching branch), not shown
 * as a year.
 */
export interface ThemeConfig {
  id: string;
  name: string;
  era: string;
  description: string;
  lesson: string;
  heritage: string;
  keyElements: string[];
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    accent: string;
  };
  style: 'sketch' | 'minimal' | 'absurd';
  designTokens: {
    gridSize: number | null;
    gridOpacity: number;
    borderRadius: number;
    shadowStyle: 'none' | 'hard' | 'soft' | 'glow' | 'glass' | 'neumorphic' | 'inset';
    shadowIntensity: number;
    effects: string[];
    letterSpacing: number;
    lineHeight: number;
    animationStyle: 'none' | 'blink' | 'pulse' | 'float' | 'morph' | 'glitch';
  };
}

/** Paper, ink, one rubric. Colour arrives as light, not as a recoloured iris. */
export const CODEX_THEME: ThemeConfig = {
  id: 'codex',
  name: 'kiruk',
  era: 'manuscript',
  description: 'An art and code studio, opened through one eye.',
  lesson: 'The drawing shows what it is. The line shows why it works.',
  heritage: 'Pen on paper.',
  keyElements: ['eye', 'iris', 'pen'],
  preview: '#f4ecdf',
  colors: {
    primary: '#1a120e',
    secondary: '#983a22',
    accent: '#983a22',
    background: '#f4ecdf',
    text: '#1a120e',
  },
  fonts: {
    primary: 'IM Fell English',
    secondary: 'IM Fell English',
    accent: 'JetBrains Mono',
  },
  style: 'sketch',
  designTokens: {
    gridSize: null,
    gridOpacity: 0,
    borderRadius: 0,
    shadowStyle: 'none',
    shadowIntensity: 0,
    effects: [],
    letterSpacing: 0,
    lineHeight: 1.45,
    animationStyle: 'none',
  },
};

export const AVAILABLE_THEMES: ThemeConfig[] = [CODEX_THEME];

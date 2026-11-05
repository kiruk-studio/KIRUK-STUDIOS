/**
 * Studio information architecture, from ideas/studio-dawn/plan.md.
 * Lists stay empty until a piece or an article is real. Client work stays
 * out until consent is true.
 */

export const NAV = [
  { href: '/work', label: 'Work' },
  { href: '/ism', label: 'ISM' },
  { href: '/writing', label: 'Writing' },
  { href: '/contact', label: 'Contact' },
] as const;

export type PieceKind = 'in-house' | 'client' | 'ism';
export type PieceState = 'idea' | 'in-progress' | 'shipped';
export type IsmPath = 'micro-app' | 'collab' | 'open-process';

export type Piece = {
  title: string;
  slug: string;
  kind: PieceKind;
  state: PieceState;
  path?: IsmPath;
  consent?: boolean;
  summary?: string;
};

export type Article = {
  title: string;
  slug: string;
  summary?: string;
};

/** Nothing is listed until it is ready to be public. */
export const PIECES: Piece[] = [];
export const ARTICLES: Article[] = [];

export const workPieces = PIECES.filter(
  (piece) =>
    piece.kind === 'in-house' ||
    (piece.kind === 'client' && piece.consent === true) ||
    (piece.kind === 'ism' && (piece.path === 'micro-app' || piece.path === 'collab')),
);

export const ismPieces = PIECES.filter((piece) => piece.kind === 'ism');

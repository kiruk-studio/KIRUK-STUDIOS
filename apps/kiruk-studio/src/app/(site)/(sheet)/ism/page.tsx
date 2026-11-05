import type { Metadata } from 'next';
import { ismPieces } from '@/lib/studio-ia';

export const metadata: Metadata = { title: 'ISM — kiruk' };

export default function IsmPage() {
  return (
    <main>
      <h1>ISM</h1>
      {ismPieces.length === 0 ? null : (
        <ul className="sheet-links">
          {ismPieces.map((piece) => (
            <li key={piece.slug}>{piece.title}</li>
          ))}
        </ul>
      )}
    </main>
  );
}

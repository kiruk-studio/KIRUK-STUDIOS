import type { Metadata } from 'next';
import { workPieces } from '@/lib/studio-ia';

export const metadata: Metadata = { title: 'Work — kiruk' };

export default function WorkPage() {
  return (
    <main>
      <h1>Work</h1>
      {workPieces.length === 0 ? null : (
        <ul className="sheet-links">
          {workPieces.map((piece) => (
            <li key={piece.slug}>{piece.title}</li>
          ))}
        </ul>
      )}
    </main>
  );
}

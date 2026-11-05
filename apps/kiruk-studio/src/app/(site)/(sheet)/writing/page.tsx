import type { Metadata } from 'next';
import { ARTICLES } from '@/lib/studio-ia';

export const metadata: Metadata = { title: 'Writing — kiruk' };

export default function WritingPage() {
  return (
    <main>
      <h1>Writing</h1>
      {ARTICLES.length === 0 ? null : (
        <ul className="sheet-links">
          {ARTICLES.map((article) => (
            <li key={article.slug}>{article.title}</li>
          ))}
        </ul>
      )}
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Framework — kiruk' };

export default function FrameworkPage() {
  return (
    <main>
      <h1>Framework</h1>
      <p className="sheet-claim">researching, wait a moment</p>
      <p className="sheet-claim">
        It unlocks the other person&apos;s idea like a child would, frames it many ways, and brings
        it to life as a story.
      </p>
      <p className="sheet-kicker">Follow the research</p>
      <ul className="sheet-links">
        <li>
          <Link href="/writing">Writing</Link>
        </li>
        <li>
          <a href="https://github.com/kiruk-studio/KIRUK-STUDIOS">GitHub</a>
        </li>
      </ul>
    </main>
  );
}

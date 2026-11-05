import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact — kiruk' };

export default function ContactPage() {
  return (
    <main>
      <h1>Contact</h1>
      <ul className="sheet-links">
        <li>
          <a href="mailto:arunkumaar.srinivasan@gmail.com">arunkumaar.srinivasan@gmail.com</a>
        </li>
        <li>
          <a href="https://github.com/kiruk-studio/KIRUK-STUDIOS">GitHub</a>
        </li>
        <li>
          <a href="https://instagram.com/kirukism">Instagram</a>
        </li>
      </ul>
    </main>
  );
}

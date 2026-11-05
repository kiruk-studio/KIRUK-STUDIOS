import Link from 'next/link';

/** The subpages keep the single centred sheet; the landing is the full folio. */
export default function SheetLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="sheet-opening">
      {children}
      <footer className="sheet-foot">
        <Link href="/framework">Framework</Link>
        <p className="sheet-colo">kiruk · 2026</p>
      </footer>
    </div>
  );
}

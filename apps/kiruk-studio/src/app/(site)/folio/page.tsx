import type { Metadata } from 'next';
import { Folio } from '@/components/folio/Folio';
import '../folio.css';

// spec-link: ideas/studio-dawn/folio.md — the earlier folio landing, kept at /folio
export const metadata: Metadata = {
  title: 'kiruk — folio',
  description: 'The studio folio: plates drawn on laid paper.',
};

export default function FolioPage() {
  return <Folio />;
}

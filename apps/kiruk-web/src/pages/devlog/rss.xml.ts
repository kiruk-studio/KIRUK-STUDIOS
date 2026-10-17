import { syndicateDevlogs } from '../../lib/devlogs';
import { STUDIO_ORIGIN } from '../../lib/site';

export const prerender = true;

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rfc822(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date(0).toUTCString() : d.toUTCString();
}

export function GET() {
  const items = syndicateDevlogs()
    .map((entry) => {
      const url = `${STUDIO_ORIGIN}${entry.url}`;
      const categories = entry.tags.map((t) => `<category>${xmlEscape(t)}</category>`).join('');
      return [
        '<item>',
        `<title>${xmlEscape(entry.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${rfc822(entry.date)}</pubDate>`,
        entry.summary ? `<description>${xmlEscape(entry.summary)}</description>` : '',
        categories,
        '</item>',
      ]
        .filter(Boolean)
        .join('');
    })
    .join('');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '<title>kiruk devlog</title>',
    `<link>${STUDIO_ORIGIN}/devlog</link>`,
    '<description>Studio process log — scribbles becoming worlds.</description>',
    '<language>en</language>',
    `<atom:link href="${STUDIO_ORIGIN}/devlog/rss.xml" rel="self" type="application/rss+xml"/>`,
    items,
    '</channel>',
    '</rss>',
  ].join('');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

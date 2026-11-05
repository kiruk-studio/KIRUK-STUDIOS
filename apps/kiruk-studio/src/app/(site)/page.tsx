import type { Metadata } from 'next';
import { EyeLanding } from '@/components/eye/EyeLanding';
import './eye.css';

// spec-link: ideas/studio-dawn/eye.md — the landing is one engraved eye
export const metadata: Metadata = {
  title: 'kiruk — scribble, and make something',
  description: 'kiruk is an art + code studio. Kiruk means to scribble, and make something.',
};

export default function Home() {
  return <EyeLanding />;
}

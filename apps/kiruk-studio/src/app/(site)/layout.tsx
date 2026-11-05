import { EyeFrame } from '@/components/studio/EyeFrame';

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <EyeFrame>{children}</EyeFrame>;
}

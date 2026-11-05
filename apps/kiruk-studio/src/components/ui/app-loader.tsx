'use client';

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import InkLoadingPage from '@/components/ui/ink-loading-page';

type LoaderMode = 'none' | 'ink';

interface AppLoaderProps {
  children: React.ReactNode;
  enableLoader?: boolean;
}

function readLoaderMode(): LoaderMode {
  if (typeof globalThis.window === 'undefined') return 'none';
  try {
    if (sessionStorage.getItem('kiruk-loading-seen') === 'true') return 'none';
  } catch {
    // no session storage (a locked-down private window): show the opening every time
  }
  return 'ink';
}

/**
 * The first visit opens on the ink loader (ink-loading-page.tsx): a hand draws the
 * eye, the eye wakes, the visitor goes in. The page under it stays in the tree,
 * booting, and is hidden until the way in begins; then it shows through as the
 * sheet lifts. A refresh in the same session skips the loader.
 */
const AppLoader: React.FC<AppLoaderProps> = ({ children, enableLoader = true }) => {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<LoaderMode>('none');
  const [showContent, setShowContent] = useState(!enableLoader);

  useEffect(() => {
    if (!enableLoader) {
      setMode('none');
      setShowContent(true);
      setHydrated(true);
      return;
    }
    const next = readLoaderMode();
    setMode(next);
    setShowContent(next === 'none');
    setHydrated(true);
  }, [enableLoader]);

  /** The way in has begun: the page shows through as the loader's sheet lifts. */
  const handleReveal = useCallback(() => setShowContent(true), []);

  const handleLoadingComplete = useCallback(() => {
    try {
      sessionStorage.setItem('kiruk-loading-seen', 'true');
    } catch {
      // nothing to remember it in
    }
    setMode('none');
    setShowContent(true);
  }, []);

  if (!hydrated) {
    return (
      <div style={{ visibility: 'hidden' }} aria-hidden>
        {children}
      </div>
    );
  }

  const overlayOpen = enableLoader && mode !== 'none';

  return (
    <>
      {enableLoader && mode === 'ink' && (
        <InkLoadingPage onReveal={handleReveal} onComplete={handleLoadingComplete} />
      )}
      <div
        style={{ visibility: showContent ? 'visible' : 'hidden' }}
        aria-hidden={overlayOpen ? true : undefined}
        inert={overlayOpen ? true : undefined}
      >
        {children}
      </div>
    </>
  );
};

export default AppLoader;

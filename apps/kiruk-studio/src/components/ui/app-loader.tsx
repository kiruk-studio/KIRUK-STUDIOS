'use client';

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import ImmersiveEraLoadingPage from '@/components/ui/immersive-era-loading-page';

type LoaderMode = 'none' | 'eye';

interface AppLoaderProps {
  children: React.ReactNode;
  enableLoader?: boolean;
}

function readLoaderMode(): LoaderMode {
  if (typeof globalThis.window === 'undefined') return 'none';
  if (sessionStorage.getItem('kiruk-loading-seen') === 'true') return 'none';
  return 'eye';
}

/**
 * The eye stays mounted for the visit. The page under it stays in the tree
 * and is hidden until the iris is entered, so a refresh in the same session
 * skips the overlay.
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

  const handleLoadingComplete = useCallback(() => {
    sessionStorage.setItem('kiruk-loading-seen', 'true');
    setMode('none');
    setTimeout(() => setShowContent(true), 80);
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
      {enableLoader && mode === 'eye' && (
        <ImmersiveEraLoadingPage onComplete={handleLoadingComplete} />
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

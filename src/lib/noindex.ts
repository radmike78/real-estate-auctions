import { useEffect } from 'react';

/**
 * Keeps search engines from indexing a page that rendered "not found" for an unknown id (a drill, property or deal
 * packet that doesn't exist). Runs after the app's own robots handling, which clears the tag on every navigation.
 */
export function useNoIndex(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let meta: HTMLMetaElement | null = null;
    const t = window.setTimeout(() => {
      meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]') ?? Object.assign(document.createElement('meta'), { name: 'robots' });
      meta.content = 'noindex';
      if (!meta.parentNode) document.head.appendChild(meta);
    }, 0);
    return () => {
      window.clearTimeout(t);
      meta?.remove();
    };
  }, [active]);
}

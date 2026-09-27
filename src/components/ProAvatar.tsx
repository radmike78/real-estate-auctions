import { useEffect, useState } from 'react';

// An advertiser's approved photo, or their initials.
// The signed directory lists each photo's SHA-256. The browser downloads the photo, checks its hash matches,
// and only then shows it (from a local blob: URL), so a photo swapped on the way here is never displayed.

export const initials = (name: string) => name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const verified = new Map<string, Promise<string | null>>();

function verifiedPhotoUrl(sha: string): Promise<string | null> {
  let p = verified.get(sha);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`/api/pro-photos/${sha}.webp`);
        if (!res.ok) return null;
        const bytes = await res.arrayBuffer();
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
        const hex = Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
        return hex === sha ? URL.createObjectURL(new Blob([bytes], { type: 'image/webp' })) : null;
      } catch {
        return null;
      }
    })();
    verified.set(sha, p);
  }
  return p;
}

export default function ProAvatar({ name, photo, big }: { name: string; photo?: string | null; big?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    setUrl(null);
    if (photo && /^[0-9a-f]{64}$/.test(photo)) void verifiedPhotoUrl(photo).then((u) => current && setUrl(u));
    return () => {
      current = false;
    };
  }, [photo]);
  const size = big ? 84 : 48;
  if (url) return <img className={`avatar photo${big ? ' big' : ''}`} src={url} alt={`Photo of ${name}`} width={size} height={size} />;
  return <div className={`avatar${big ? ' big' : ''}`} aria-hidden>{initials(name)}</div>;
}

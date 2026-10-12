import { workStorage as localStorage } from './workStorage';
// The visitor's email-alerts manage link, remembered in this browser after they open it, so tracking
// another property is one click. It's only a convenience: they can forget it at any time, and every
// alert email carries the same link.

const KEY = 'fsf.alerts.manage.v1';
const TOKEN_RE = /^[a-f0-9]{24}\.[A-Za-z0-9_-]{43}$/;

export function storedManageToken(): string | null {
  try {
    const t = localStorage.getItem(KEY);
    return t && TOKEN_RE.test(t) ? t : null;
  } catch {
    return null;
  }
}

export function rememberManageToken(token: string) {
  try {
    if (TOKEN_RE.test(token)) localStorage.setItem(KEY, token);
  } catch {
    /* private mode: nothing remembered */
  }
}

export function forgetManageToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to forget */
  }
}

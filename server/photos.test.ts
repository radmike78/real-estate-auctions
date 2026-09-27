// Advertiser profile photos: cleaning, the upload rules, admin approval, and what the public can see.
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword, newToken, sha256 } from './auth';
import { pacificDay } from './metrics';
import { PhotoError, processPhoto, sniffPhoto } from './photos';
import { generateSigningKeys, loadPrivateKey } from '../ingest/lib/sign';
import { validateApplication, type ApplicationInput } from '../src/lib/proApplication';

const png = (w = 800, h = 600) => sharp({ create: { width: w, height: h, channels: 3, background: '#3366cc' } }).png().toBuffer();

describe('photo cleaning', () => {
  it('turns an accepted photo into a fresh 400x400 WebP without metadata', async () => {
    const withGps = await sharp({ create: { width: 900, height: 700, channels: 3, background: '#aa3344' } })
      .jpeg()
      .withExif({ IFD0: { Copyright: 'someone else', ImageDescription: 'secret note' } })
      .toBuffer();
    const { image, sha256: hash } = await processPhoto(withGps);
    const meta = await sharp(image).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 400, height: 400 });
    expect(meta.exif).toBeUndefined();
    expect(image.includes(Buffer.from('secret note'))).toBe(false);
    expect(hash).toBe(createHash('sha256').update(image).digest('hex'));
  });

  it('refuses anything that is not a real JPEG, PNG or WebP', async () => {
    expect(sniffPhoto(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(sniffPhoto(Buffer.from('GIF89a......'))).toBeNull();
    await expect(processPhoto(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'))).rejects.toThrow(PhotoError);
    // A PNG signature followed by garbage.
    await expect(processPhoto(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 7)]))).rejects.toThrow(PhotoError);
    // A GIF renamed to look like a JPEG by its first bytes only.
    await expect(processPhoto(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('GIF89a')]))).rejects.toThrow(PhotoError);
    await expect(processPhoto(await png(40, 40))).rejects.toThrow(/at least 100/);
    await expect(processPhoto(Buffer.alloc(0))).rejects.toThrow(PhotoError);
  });
});

const PRO: ApplicationInput = {
  category: 'home_inspector',
  name: 'Robin Photo',
  company: 'Example Inspections',
  licenseId: 'IOS.0012345',
  serviceCities: ['Las Vegas'],
  serviceZips: '',
  services: ['Sewer scope'],
  creditProfiles: [],
  languages: ['English'],
  headline: 'Inspections for auction homes',
  phone: '702-555-0100',
  email: 'robin@example.com',
  website: '',
  bio: 'Pre-purchase and exterior-only inspections for buyers of bank-owned homes.',
  attestLicensed: true,
  attestAccurate: true,
  consentVerification: true,
  attestAdvertising: true,
  attestOriginal: true,
};

describe('profile photos (running server)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-photo-'));
  const keys = generateSigningKeys();
  const app = createApp({
    dbPath: join(dir, 'app.db'),
    dataDir: join(dir, 'data'),
    distDir: null,
    adminUsername: 'admin',
    adminPasswordHash: hashPassword('a-long-admin-password'),
    directorySigningKey: loadPrivateKey(keys.privatePem),
    feedPublicKey: null,
    baseUrl: 'https://fsf.example',
    mailer: { send: async () => {} },
    secureCookies: false,
  });
  let server: Server;
  let base = '';
  let proCookie = '';
  let adminCookie = '';
  const proId = 'b'.repeat(24);

  const upload = (body: Buffer, type = 'image/png', headers: Record<string, string> = {}) =>
    fetch(`${base}/api/pro/photo`, { method: 'POST', headers: { cookie: proCookie, 'content-type': type, 'x-fsf-request': '1', ...headers }, body: new Uint8Array(body) });
  const post = (path: string, cookie: string, body: unknown = {}) =>
    fetch(base + path, { method: 'POST', headers: { cookie, 'content-type': 'application/json', 'x-fsf-request': '1' }, body: JSON.stringify(body) });
  const directory = () => JSON.parse(readFileSync(join(dir, 'data', 'pros.json'), 'utf8')) as { pros: { id: string; photo?: string | null }[] };

  beforeAll(async () => {
    const v = validateApplication(PRO);
    if (!v.ok) throw new Error('fixture invalid');
    const t = new Date().toISOString();
    app.db.insertApplication({ id: proId, profile: v.profile, tokenHash: sha256('x'), tokenExpires: t, now: t });
    app.db.update(proId, {
      status: 'APPROVED',
      verification: { licenseStatus: 'Active', licenseExpires: '2099-01-01', nameMatches: true, typeMatches: true, companyMatches: true, identityConfirmed: true, contentReviewed: true, identityMethod: 'Called the company line from the regulator record.', verifiedAt: pacificDay(new Date()), verifiedBy: 'admin' },
      billing: { plan: 'Monthly listing', paidThrough: '2099-12-31' },
    }, t);
    const pt = newToken();
    app.db.sessions.create(sha256(pt), 'pro', proId, Date.now());
    proCookie = `fsf_pro=${pt}`;
    const at = newToken();
    app.db.sessions.create(sha256(at), 'admin', 'admin', Date.now());
    adminCookie = `fsf_admin=${at}`;
    server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => server?.close());

  it('needs the advertiser session, the app header and an image type', async () => {
    const img = await png();
    expect((await fetch(`${base}/api/pro/photo`, { method: 'POST', headers: { 'content-type': 'image/png', 'x-fsf-request': '1' }, body: new Uint8Array(img) })).status).toBe(401);
    expect((await upload(img, 'image/png', { 'x-fsf-request': '' })).status).toBe(403);
    expect((await upload(img, 'image/svg+xml')).status).toBe(415);
    expect((await upload(Buffer.from('<svg/>'), 'image/png')).status).toBe(422);
    expect((await upload(Buffer.alloc(5 * 1024 * 1024 + 1, 1), 'image/jpeg')).status).toBe(413);
  });

  it('keeps an upload private until an admin approves it, then publishes it in the signed directory', async () => {
    expect((await upload(await png())).status).toBe(200);
    const me = await (await fetch(`${base}/api/pro/me`, { headers: { cookie: proCookie } })).json();
    expect(me.photo.live).toBeNull();
    expect(me.photo.pendingAt).toBeTruthy();
    // The advertiser and the admin can see it; the public can't, and the directory doesn't list it.
    expect((await fetch(`${base}/api/pro/photo/pending`, { headers: { cookie: proCookie } })).headers.get('content-type')).toBe('image/webp');
    expect((await fetch(`${base}/api/admin/applications/${proId}/photo`, { headers: { cookie: adminCookie } })).status).toBe(200);
    const pendingSha = app.db.photos.get(proId, 'pending')!.sha256;
    expect((await fetch(`${base}/api/pro-photos/${pendingSha}.webp`)).status).toBe(404);

    expect((await post(`/api/admin/applications/${proId}/photo/approve`, adminCookie)).status).toBe(200);
    const listed = directory().pros.find((p) => p.id === proId)!;
    expect(listed.photo).toBe(pendingSha);
    const pub = await fetch(`${base}/api/pro-photos/${pendingSha}.webp`);
    expect(pub.status).toBe(200);
    expect(pub.headers.get('cache-control')).toContain('immutable');
    expect(pub.headers.get('x-content-type-options')).toBe('nosniff');
    const bytes = Buffer.from(await pub.arrayBuffer());
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(pendingSha);
  });

  it('keeps the live photo while a replacement waits, drops rejected ones, and lets the advertiser remove theirs', async () => {
    const live = app.db.photos.meta(proId).live;
    expect((await upload(await png(500, 900))).status).toBe(200);
    expect(directory().pros.find((p) => p.id === proId)!.photo).toBe(live);
    expect((await post(`/api/admin/applications/${proId}/photo/reject`, adminCookie)).status).toBe(200);
    expect(app.db.photos.meta(proId)).toEqual({ live, pendingAt: null });
    expect((await post(`/api/admin/applications/${proId}/photo/reject`, adminCookie)).status).toBe(409);

    expect((await post('/api/pro/photo/remove', proCookie, { which: 'live' })).status).toBe(200);
    expect(directory().pros.find((p) => p.id === proId)!.photo).toBeNull();
    expect((await fetch(`${base}/api/pro-photos/${live}.webp`)).status).toBe(404);
    expect(app.db.auditFor(proId).map((a) => a.action)).toEqual(expect.arrayContaining(['PHOTO_UPLOADED', 'PHOTO_APPROVED', 'PHOTO_REJECTED', 'PHOTO_REMOVED']));
  });
});

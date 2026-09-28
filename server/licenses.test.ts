import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword } from './auth';
import { cleanQuery, createLicenseSearch, parseFdic, parseStateBar } from './licenses';

// The shape of the State Bar's Find a Lawyer results (trimmed from a real page).
const attorney = (bar: string, last: string, first: string, extra: { firm?: string; phone?: string; discipline?: string } = {}) => `
<article class="user_chunk " id="u${bar}" data-power="225" >
<pre style="display:none;">Array
(
    [first_name] => ${first}
    [last_name] => ${last}
    [attorney_barnumber] => ${bar}
    [attorney_admissiondate] => 9/25/1998
    [attorney_firmname] => ${extra.firm ?? ''}
    [attorney_phone] => ${extra.phone ?? ''}
    [attorney_address1] => 100 Main St.
    [attorney_address2] => Suite 2
    [attorney_city] => Las Vegas
    [attorney_state] => NV
    [attorney_zipcode] => 89101
    [attorney_cemail] => <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="5c38">[email&#160;protected]</a>
    [attorney_middle] => Q.
    [attorney_membertype] => ATTORNEY Active
)
</pre>
<div class="one_third"><h3>${last}, ${first} Q.</h3></div>
<div class="user_disciplinary one_third"><h4>Disciplinary Actions:</h4>
<ol>${extra.discipline ? `<li>${extra.discipline} [ <a href="#">View Document</a> ]</li>` : '<li class="info-faded nobull">None.</li>'}</ol></div>
</article>`;

describe('State Bar results', () => {
  it('reads each attorney: bar number, status, firm, address, phone and discipline', () => {
    const html = `<html>${attorney('10764', 'Smith', 'Kurt', { firm: 'Smith Legal &amp; Co', phone: '(702) 410-5001', discipline: 'Public Reprimand - Filed 08/15/2018' })}${attorney('413', 'Smith', 'Donald')}</html>`;
    const { results, more } = parseStateBar(html);
    expect(more).toBe(false);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      name: 'Smith, Kurt Q.',
      id: '10764',
      status: 'ATTORNEY Active',
      company: 'Smith Legal & Co',
      phone: '(702) 410-5001',
      address: '100 Main St., Suite 2, Las Vegas, NV 89101',
      discipline: ['Public Reprimand - Filed 08/15/2018'],
      officialUrl: 'https://nvbar.org/for-the-public/find-a-lawyer/?usearch=10764',
    });
    expect(results[1].discipline).toEqual([]);
    // The protected email stays on the State Bar's page.
    expect(JSON.stringify(results)).not.toMatch(/email|cfemail/i);
  });

  it('caps the list and says there are more', () => {
    const html = Array.from({ length: 25 }, (_, i) => attorney(String(100 + i), 'Lee', 'Pat')).join('');
    const { results, more } = parseStateBar(html);
    expect(results).toHaveLength(20);
    expect(more).toBe(true);
  });
});

describe('FDIC results', () => {
  it('lists active banks, Nevada first, with a safe website link', () => {
    const { results } = parseFdic({
      meta: { total: 2 },
      data: [
        { data: { NAME: 'First National Bank of Omaha', CERT: 5452, CITY: 'Omaha', STALP: 'NE', ADDRESS: '1601 Capitol Avenue', ZIP: '68102', WEBADDR: 'www.fnbo.com' } },
        { data: { NAME: 'Nevada State Bank', CERT: 27389, CITY: 'Las Vegas', STALP: 'NV', ADDRESS: '750 E Warm Springs Rd', ZIP: '89119', WEBADDR: 'javascript:alert(1)' } },
      ],
    });
    expect(results[0].name).toBe('Nevada State Bank');
    expect(results[0].website).toBeUndefined();
    expect(results[1].website).toBe('https://www.fnbo.com');
  });
});

describe('search input', () => {
  it('accepts names and numbers, refuses anything else', () => {
    expect(cleanQuery('  José  Smith ')).toBe('José Smith');
    expect(cleanQuery("O'Brien & Co.")).toBe("O'Brien & Co.");
    expect(cleanQuery('10764')).toBe('10764');
    expect(cleanQuery('a')).toBeNull();
    expect(cleanQuery('<script>')).toBeNull();
    expect(cleanQuery('x'.repeat(61))).toBeNull();
    expect(cleanQuery(undefined)).toBeNull();
  });
});

describe('live lookups through the site API', () => {
  it('asks the official source once, then answers repeat searches from the short-term cache', async () => {
    const asked: string[] = [];
    const fakeFetch = (async (u: string | URL) => {
      asked.push(String(u));
      return new Response(`<html>${attorney('10764', 'Smith', 'Kurt')}</html>`, { status: 200, headers: { 'content-type': 'text/html' } });
    }) as typeof fetch;
    const search = createLicenseSearch(fakeFetch);
    expect((await search('attorney', 'Smith')).results).toHaveLength(1);
    await search('attorney', 'smith');
    expect(asked).toHaveLength(1);
    expect(asked[0]).toBe('https://nvbar.org/for-the-public/find-a-lawyer/?usearch=Smith');
  });

  it('serves /api/licenses, validates input, and reports an unreachable source', async () => {
    let down = false;
    const dir = mkdtempSync(join(tmpdir(), 'fsf-lic-'));
    const app = createApp({
      dbPath: join(dir, 'app.db'),
      dataDir: join(dir, 'data'),
      distDir: null,
      adminUsername: 'admin',
      adminPasswordHash: hashPassword('correct horse battery'),
      directorySigningKey: null,
      feedPublicKey: null,
      baseUrl: 'https://fsf.example',
      mailer: { send: async () => {} },
      secureCookies: false,
      trustProxy: false,
      licenseFetch: (async (u: string | URL) => {
        if (down) return new Response('busy', { status: 503 });
        return String(u).startsWith('https://api.fdic.gov/')
          ? new Response(JSON.stringify({ meta: { total: 1 }, data: [{ data: { NAME: 'Test Bank', CERT: 1, STALP: 'NV' } }] }), { status: 200 })
          : new Response(attorney('10764', 'Smith', 'Kurt'), { status: 200 });
      }) as typeof fetch,
    });
    const server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const ok = await fetch(`${base}/api/licenses?kind=attorney&q=Smith`);
    expect(ok.status).toBe(200);
    expect((await ok.json()).results[0].id).toBe('10764');
    expect((await (await fetch(`${base}/api/licenses?kind=bank&q=Test`)).json()).results[0].name).toBe('Test Bank');
    expect((await fetch(`${base}/api/licenses?kind=agent&q=Smith`)).status).toBe(400); // no live lookup for agents
    expect((await fetch(`${base}/api/licenses?kind=attorney&q=%3Cx%3E`)).status).toBe(400);
    down = true;
    expect((await fetch(`${base}/api/licenses?kind=attorney&q=Jones`)).status).toBe(502);
    await new Promise<void>((r) => server.close(() => r()));
    app.db.close();
  });
});

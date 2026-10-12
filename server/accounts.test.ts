import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app';
import { accountEmail } from './accounts';
import { hashPassword, sha256 } from './auth';
import type { Mail } from './mailer';

const password=hashPassword('test-admin-password-long');
const key='9a'.repeat(32);
let server: Server, root: string, base: string, origin: string, app: ReturnType<typeof createApp>;
let mails: Mail[]=[];
let date: Date;
async function call(path: string, body?: unknown, cookie='', extra: Record<string,string>={}) {
  return fetch(`${base}/api/account/${path}`,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json','x-fsf-request':'1',origin}),...(cookie?{cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
}
function cookieOf(r: Response, name: string) { return r.headers.getSetCookie().find(c=>c.startsWith(`${name}=`))!.split(';')[0]; }
async function link(email: string, firstName='Taylor') {
  const r=await call('link',{email,firstName,consent:true}); expect(r.status).toBe(200);
  return {binding:cookieOf(r,'__Host-deedowl_verify'),token:mails.at(-1)!.text.match(/#verify=([A-Za-z0-9_-]{43})/)![1]};
}
async function sign(email: string) {
  const l=await link(email); const r=await call('verify',{token:l.token},l.binding); expect(r.status).toBe(200);
  return {cookie:cookieOf(r,'__Host-deedowl_account'),account:(await r.json()).account, response:r};
}
beforeEach(async()=>{
  root=mkdtempSync(join(tmpdir(),'deedowl-accounts-')); mails=[]; date=new Date('2026-10-12T18:00:00Z');
  server=createServer((req,res)=>void app.handler(req,res));
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=(server.address() as {port:number}).port; base=`http://127.0.0.1:${port}`; origin=`https://127.0.0.1:${port}`;
  app=createApp({dbPath:join(root,'app.db'),dataDir:root,distDir:null,adminUsername:'admin',adminPasswordHash:password,directorySigningKey:null,feedPublicKey:null,baseUrl:origin,secureCookies:true,now:()=>date,mailer:{send:async m=>{mails.push(m);}},accounts:{encryptionKey:key}});
});
afterEach(async()=>{ await new Promise<void>(resolve=>server.close(()=>resolve())); app.db.raw.close(); rmSync(root,{recursive:true,force:true}); });

describe('verified learner account boundary',()=>{
  it('does not create an account before verification, binds links to the requesting browser and consumes them once',async()=>{
    const l=await link('Taylor@EXAMPLE.COM');
    expect((app.db.raw.prepare('SELECT count(*) AS n FROM learner_accounts').get() as {n:number}).n).toBe(0);
    expect((await call('work')).status).toBe(401);
    expect((await call('verify',{token:l.token})).status).toBe(400);
    expect((await call('verify',{token:l.token},'__Host-deedowl_verify=other')).status).toBe(400);
    const r=await call('verify',{token:l.token},l.binding); expect(r.status).toBe(200);
    const c=r.headers.getSetCookie().find(x=>x.startsWith('__Host-deedowl_account='))!;
    expect(c).toContain('HttpOnly'); expect(c).toContain('SameSite=Strict'); expect(c).toContain('; Secure'); expect(c).toContain('Path=/'); expect(c).not.toContain('Domain=');
    expect((await call('verify',{token:l.token},l.binding)).status).toBe(400);
    expect(mails[0].text).toContain('/account#verify='); expect(mails[0].text).not.toContain('?token=');
  });
  it('expires sign-in links and sessions and revokes sign-out',async()=>{
    const l=await link('expired@example.com'); date=new Date(date.getTime()+15*60_000);
    expect((await call('verify',{token:l.token},l.binding)).status).toBe(400);
    const a=await sign('learner@example.com');
    date=new Date(date.getTime()+61*60_000); expect((await call('work',undefined,a.cookie)).status).toBe(401);
    const b=await sign('other@example.com'); expect((await call('logout',{},b.cookie)).status).toBe(200);
    expect((await call('work',undefined,b.cookie)).status).toBe(401);
  });
  it('isolates two owners and refuses forged IDs, unsupported private fields, HTML and stale saves',async()=>{
    const a=await sign('a@example.com'); const b=await sign('b@example.com');
    const data={'deedowl.read.v1':['financing'],'fsf.calc.rent.v1':{monthlyRent:2500,atPrice:285000}};
    expect((await call('work',{owner:a.account.id,revision:0,data},a.cookie)).status).toBe(200);
    const own=await (await call('work',undefined,a.cookie)).json(); expect(own.data).toEqual(data);
    expect((await (await call('work',undefined,b.cookie)).json()).data).toEqual({});
    expect((await call('work',{owner:a.account.id,revision:0,data},b.cookie)).status).toBe(409);
    expect((await call('work',{owner:a.account.id,revision:0,data},a.cookie)).status).toBe(409);
    expect((await call('work',{owner:a.account.id,revision:1,data,accountId:b.account.id},a.cookie)).status).toBe(400);
    for (const bad of [{'ssn':'123-45-6789'},{'deedowl.teamlist.v1':{agent:{name:'Someone'}}},{'fsf.calc.rent.v1':{monthlyRent:2500,creditScore:700}},{'deedowl.analyze.v1':[{id:'x',state:'NV',county:'Clark',name:'<script>alert(1)</script>',kind:'listing',plan:'rent',notes:'hidden',done:[],updatedAt:date.toISOString()}]}]) {
      expect((await call('work',{owner:a.account.id,revision:1,data:bad},a.cookie)).status).toBe(400);
    }
    expect((await (await call('work',undefined,a.cookie)).json()).data).toEqual(data);
    const rows=app.db.raw.prepare('SELECT profile, work FROM learner_accounts').all();
    expect(JSON.stringify(rows)).not.toContain('a@example.com'); expect(JSON.stringify(rows)).not.toContain('monthlyRent');
    const sessions=JSON.stringify(app.db.raw.prepare('SELECT * FROM learner_sessions').all());
    expect(sessions).not.toContain(a.cookie.split('=')[1]); expect(sessions).toContain(sha256(a.cookie.split('=')[1]));
    expect((await call('work/'+a.account.id,undefined,b.cookie)).status).toBe(404);
    expect((await call('work?accountId='+a.account.id,undefined,b.cookie)).status).toBe(200); // query cannot select owner
    expect((await (await call('work?accountId='+a.account.id,undefined,b.cookie)).json()).data).toEqual({});
  });
  it('requires same origin plus custom header, rejects multipart, and gives learners no admin/advertiser privileges',async()=>{
    const a=await sign('a@example.com'); const body={owner:a.account.id,revision:0,data:{}};
    expect((await call('work',body,a.cookie,{origin:'https://evil.example'})).status).toBe(403);
    expect((await call('work',body,a.cookie,{'x-fsf-request':''})).status).toBe(403);
    expect((await call('work',body,a.cookie,{origin:''})).status).toBe(403);
    expect((await call('work',body,a.cookie,{'content-type':'multipart/form-data'})).status).toBe(415);
    expect((await fetch(base+'/api/admin/me',{headers:{cookie:a.cookie}})).status).toBe(401);
    expect((await fetch(base+'/api/pro/me',{headers:{cookie:a.cookie}})).status).toBe(401);
    expect((await call('uploads',{file:'x'},a.cookie)).status).toBe(404);
    expect((await call('work',{owner:a.account.id,revision:0,data:{'unknown':'x'.repeat(132000)}},a.cookie)).status).toBe(413);
  });
  it('does not let an anonymous first-name request overwrite an existing verified profile; deletes all sessions and work',async()=>{
    const a=await sign('a@example.com'); const l=await link('a@example.com','Different');
    const r=await call('verify',{token:l.token},l.binding); const second=cookieOf(r,'__Host-deedowl_account');
    expect((await r.json()).account.firstName).toBe('Taylor');
    expect((await call('delete',{owner:a.account.id,confirm:'DELETE'},second)).status).toBe(200);
    expect((await call('work',undefined,a.cookie)).status).toBe(401); expect((await call('work',undefined,second)).status).toBe(401);
    expect((app.db.raw.prepare('SELECT count(*) AS n FROM learner_accounts').get() as {n:number}).n).toBe(0);
  });
  it('requires fresh verification for account deletion and keeps the normal site available when accounts are disabled',async()=>{
    const a=await sign('a@example.com'); date=new Date(date.getTime()+16*60_000);
    expect((await call('delete',{owner:a.account.id,confirm:'DELETE'},a.cookie)).status).toBe(403);
    const off=createApp({dbPath:join(root,'off.db'),dataDir:root,distDir:null,adminUsername:'admin',adminPasswordHash:password,directorySigningKey:null,feedPublicKey:null,baseUrl:origin});
    const other=createServer((req,res)=>void off.handler(req,res)); await new Promise<void>(resolve=>other.listen(0,'127.0.0.1',resolve));
    const at=`http://127.0.0.1:${(other.address() as {port:number}).port}`;
    try { const f=await (await fetch(at+'/api/features')).json(); expect(f.accounts).toBe(false); expect((await fetch(at+'/healthz')).status).toBe(200); expect((await fetch(at+'/api/account/me')).status).toBe(404); }
    finally { await new Promise<void>(resolve=>other.close(()=>resolve())); off.db.raw.close(); }
  });
});
it('keeps email local parts distinct and rejects header injection and invalid forms',()=>{
  expect(accountEmail('First.Last+tag@EXAMPLE.COM')).toBe('First.Last+tag@example.com');
  expect(accountEmail('first.last+tag@example.com')).not.toBe(accountEmail('First.Last+tag@example.com'));
  expect(accountEmail('x@xn--bcher-kva.example')).toBe('x@xn--bcher-kva.example');
  for(const value of ['a..b@example.com','a@example.com\r\nBcc:evil@example.com','a@-bad.com','a@example..com','<script>@example.com']) expect(accountEmail(value)).toBeNull();
});

it('does not take the guest server down when optional account configuration is invalid',async()=>{
  const log=vi.spyOn(console,'error').mockImplementation(()=>{});
  let off: ReturnType<typeof createApp>|undefined;
  try {
    off=createApp({dbPath:join(root,'bad.db'),dataDir:root,distDir:null,adminUsername:'admin',adminPasswordHash:password,directorySigningKey:null,feedPublicKey:null,baseUrl:origin,mailer:{send:async()=>{}},accounts:{encryptionKey:'invalid'}});
    expect(off.db.ping()).toBe(true); expect(log).toHaveBeenCalled(); expect(JSON.stringify(log.mock.calls)).not.toContain('invalid');
  } finally {off?.db.raw.close();log.mockRestore();}
});

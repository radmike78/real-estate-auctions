// Script control-flow tests with mocked Podman/systemd. Never touch real services or credentials.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, statSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, expect, it } from 'vitest';
const script=resolve('deploy/podman/enable-learner-accounts.sh');
let root:string, bin:string, quadlet:string, keys:string, unit:string, env:string;
const baseUnit='[Container]\nImage=ghcr.io/example/site:latest\nContainerName=forced-sale-finder-web\nEnvironmentFile=forced-sale-finder.env\nVolume=existing-volume:/data\n[Service]\nRestart=always\n';
const baseEnv='BASE_URL=https://deedowl.test\nMAIL_FROM=DeedOwl <test@example.test>\nBACKUP_KEEP=7\nOTHER_SETTING=keep-me\n';
const keyFile=()=>join(keys,'learner-account-key.hex');
function put(file:string, text:string, mode=0o600){writeFileSync(file,text,{mode});}
function run(check=false,extra:Record<string,string>={}){
  return spawnSync('bash',[script,...(check?['--check']:[])],{encoding:'utf8',timeout:30000,env:{...process.env,PATH:`${bin}:${process.env.PATH}`,FSF_KEY_DIR:keys,FSF_QUADLET_DIR:quadlet,MOCK_ROOT:root,...extra}});
}
beforeEach(()=>{
  root=mkdtempSync(join(tmpdir(),'deedowl-account-setup-')); bin=join(root,'bin');quadlet=join(root,'quadlet');keys=join(root,'keys');
  mkdirSync(bin);mkdirSync(quadlet);mkdirSync(join(root,'server','data'),{recursive:true});
  put(join(root,'server','accounts.ts'),'// account implementation present');
  unit=join(quadlet,'forced-sale-finder-web.container');env=join(quadlet,'forced-sale-finder.env');put(unit,baseUnit);put(env,baseEnv);
  const db=spawnSync('python3',['-c','import sqlite3,sys; sqlite3.connect(sys.argv[1]).close()',join(root,'server','data','app.db')]);expect(db.status).toBe(0);
  put(join(bin,'id'),'#!/bin/sh\nprintf "%s\\n" "${MOCK_UID:-1000}"\n',0o700);
  put(join(bin,'sleep'),'#!/bin/sh\nexit 0\n',0o700);
  put(join(bin,'systemctl'),`#!/usr/bin/env python3
import os,pathlib,sys
r=pathlib.Path(os.environ['MOCK_ROOT']);a=sys.argv[1:]
with (r/'calls').open('a') as f:f.write('systemctl '+ ' '.join(a)+'\\n')
if 'restart' in a:
 p=r/'restarts';n=int(p.read_text())+1 if p.exists() else 1;p.write_text(str(n))
 if os.environ.get('MOCK_RESTART_FAIL')=='1' and n==1:sys.exit(1)
sys.exit(0)
`,0o700);
  put(join(bin,'podman'),`#!/usr/bin/env python3
import hashlib,os,pathlib,subprocess,sys
r=pathlib.Path(os.environ['MOCK_ROOT']);a=sys.argv[1:];secret=r/'secret'
with (r/'calls').open('a') as f:f.write('podman '+ ' '.join(a[:3])+'\\n')
if a[:2]==['secret','inspect']:sys.exit(0 if secret.exists() else 1)
if a[:2]==['secret','create']:secret.write_text(pathlib.Path(a[-1]).read_text());sys.exit(0)
if a[0]=='inspect':print('sha256:existing-image');sys.exit(0)
if a[0]=='run':
 e=dict(os.environ);e['ACCOUNT_ENCRYPTION_KEY']=secret.read_text()
 e['EXPECTED_KEY_HASH']=next(x.split('=',1)[1] for x in a if x.startswith('EXPECTED_KEY_HASH='))
 sys.exit(subprocess.run(['node','-e',a[-1]],env=e,cwd=r).returncode)
if a[0]=='exec':
 code=a[-1]
 if 'node:sqlite' in code:
  e=dict(os.environ);e['BASE_URL']='https://deedowl.test';e['DB_PATH']=str(r/'server/data/app.db');e['MAIL_FROM']='test@example.test'
  if os.environ.get('MOCK_NO_MAIL')!='1':e['RESEND_API_KEY']='fake-test-provider'
  else:e.pop('RESEND_API_KEY',None);e.pop('POSTMARK_SERVER_TOKEN',None)
  if (r/'current-key').exists():e['ACCOUNT_ENCRYPTION_KEY']=(r/'current-key').read_text().strip()
  else:e.pop('ACCOUNT_ENCRYPTION_KEY',None)
  sys.exit(subprocess.run(['node','--no-warnings','-e',code],env=e,cwd=r,input=sys.stdin.buffer.read()).returncode)
 if '/api/features' in code:
  e=(r/'quadlet/forced-sale-finder.env').read_text();u=(r/'quadlet/forced-sale-finder-web.container').read_text()
  sys.exit(0 if 'LEARNER_ACCOUNTS=1' in e and 'Secret=fsf-account-encryption-key,type=env,target=ACCOUNT_ENCRYPTION_KEY' in u and os.environ.get('MOCK_PROBE_FAIL')!='1' else 1)
 sys.exit(0)
sys.exit(1)
`,0o700);
});
afterEach(()=>rmSync(root,{recursive:true,force:true}));
it('performs a read-only prerequisite check without creating a key, secret or configuration',()=>{
  const r=run(true);expect(r.status,r.stderr).toBe(0);expect(existsSync(keys)).toBe(false);expect(existsSync(join(root,'secret'))).toBe(false);
  expect(readFileSync(unit,'utf8')).toBe(baseUnit);expect(readFileSync(env,'utf8')).toBe(baseEnv);
});
it('enables only the web service, keeps settings, creates private keys and safely reuses them',()=>{
  const r=run();expect(r.status,r.stderr).toBe(0);
  const key=readFileSync(keyFile(),'utf8').trim();expect(key).toMatch(/^[a-f0-9]{64}$/);expect(r.stdout+r.stderr).not.toContain(key);
  expect(statSync(keyFile()).mode&0o777).toBe(0o600);expect(statSync(keys).mode&0o777).toBe(0o700);
  expect(readFileSync(env,'utf8')).toContain('OTHER_SETTING=keep-me');expect(readFileSync(env,'utf8')).toContain('LEARNER_ACCOUNTS=1');
  expect(readFileSync(unit,'utf8')).toContain('Volume=existing-volume:/data');
  const again=run();expect(again.status,again.stderr).toBe(0);expect(readFileSync(keyFile(),'utf8').trim()).toBe(key);
  const calls=readFileSync(join(root,'calls'),'utf8');expect(calls).not.toContain('forced-sale-finder-ingest');expect(calls.match(/podman secret create/g)).toHaveLength(1);
  expect(readFileSync(unit,'utf8').match(/^Secret=fsf-account-encryption-key/gm)).toHaveLength(1);
});
it('refuses missing email setup before generating a key or modifying settings',()=>{
  const r=run(false,{MOCK_NO_MAIL:'1'});expect(r.status).not.toBe(0);expect(existsSync(keyFile())).toBe(false);expect(readFileSync(env,'utf8')).toBe(baseEnv);
});
it('never generates a replacement key for existing account data',()=>{
  const db=spawnSync('python3',['-c',"import sqlite3,sys; d=sqlite3.connect(sys.argv[1]);d.execute('CREATE TABLE learner_accounts (id TEXT, profile TEXT)');d.execute('INSERT INTO learner_accounts VALUES (?,?)',('a','encrypted'));d.commit()",join(root,'server','data','app.db')]);expect(db.status).toBe(0);
  const r=run();expect(r.status).not.toBe(0);expect(r.stderr).toContain('will not generate a replacement');expect(existsSync(keyFile())).toBe(false);
});
it('refuses an existing key mismatch without replacing either key or restarting',()=>{
  mkdirSync(keys);put(keyFile(),'a7'.repeat(32));put(join(root,'secret'),'b8'.repeat(32));
  const r=run();expect(r.status).not.toBe(0);expect(readFileSync(keyFile(),'utf8')).toBe('a7'.repeat(32));expect(readFileSync(join(root,'secret'),'utf8')).toBe('b8'.repeat(32));
  expect(existsSync(join(root,'restarts'))).toBe(false);expect(readFileSync(unit,'utf8')).toBe(baseUnit);
});
it.each([{MOCK_PROBE_FAIL:'1'},{MOCK_RESTART_FAIL:'1'}] as Record<string,string>[])('rolls configuration back on restart/feature-check failure while retaining the key (%o)',extra=>{
  const r=run(false,extra);expect(r.status).not.toBe(0);expect(r.stderr).toContain('Previous configuration restored');
  expect(readFileSync(unit,'utf8')).toBe(baseUnit);expect(readFileSync(env,'utf8')).toBe(baseEnv);expect(existsSync(keyFile())).toBe(true);expect(existsSync(join(root,'secret'))).toBe(true);
  expect(readFileSync(join(root,'restarts'),'utf8')).toBe('2');
});
it('selects system-wide systemctl for a root installation',()=>{
  const r=run(false,{MOCK_UID:'0'});expect(r.status,r.stderr).toBe(0);const calls=readFileSync(join(root,'calls'),'utf8');expect(calls).toContain('systemctl restart forced-sale-finder-web.service');expect(calls).not.toContain('systemctl --user');
});
it('refuses existing direct key overrides',()=>{
  put(env,baseEnv+'ACCOUNT_ENCRYPTION_KEY=do-not-change\n');const r=run();expect(r.status).not.toBe(0);expect(existsSync(keyFile())).toBe(false);expect(readFileSync(env,'utf8')).toContain('do-not-change');
});

it('refuses a symlink key file without changing its target',()=>{
  mkdirSync(keys);const target=join(root,'existing-key');put(target,'a7'.repeat(32));symlinkSync(target,keyFile());
  const r=run();expect(r.status).not.toBe(0);expect(readFileSync(target,'utf8')).toBe('a7'.repeat(32));expect(readFileSync(unit,'utf8')).toBe(baseUnit);
});

it.each([true,false])('checks actual encrypted-profile compatibility with the candidate key (matches: %s)',matches=>{
  mkdirSync(keys);put(keyFile(),'a7'.repeat(32));put(join(root,'secret'),'a7'.repeat(32));
  const code=`const {DatabaseSync}=require('node:sqlite');const c=require('crypto');const key=c.createHmac('sha256',Buffer.from('${matches ? 'a7' : 'b8'}'.repeat(32),'hex')).update('deedowl-account-encryption-v1').digest();const iv=Buffer.alloc(12,1);const e=c.createCipheriv('aes-256-gcm',key,iv);e.setAAD(Buffer.from('profile:fixture-id'));const data=Buffer.concat([e.update('{}'),e.final()]);const profile=Buffer.concat([iv,e.getAuthTag(),data]).toString('base64');const db=new DatabaseSync(process.argv[1]);db.exec('CREATE TABLE learner_accounts (id TEXT, profile TEXT)');db.prepare('INSERT INTO learner_accounts VALUES (?,?)').run('fixture-id',profile);db.close();`;
  const init=spawnSync('node',['--no-warnings','-e',code,join(root,'server','data','app.db')]);expect(init.status).toBe(0);
  const r=run();if(matches)expect(r.status,r.stderr).toBe(0);else {expect(r.status).not.toBe(0);expect(readFileSync(env,'utf8')).toBe(baseEnv);expect(existsSync(join(root,'restarts'))).toBe(false);}
});

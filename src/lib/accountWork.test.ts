import { afterEach, beforeEach, expect, it } from 'vitest';
import { workStorage, openWorkspace } from './workStorage';
import { cloudFromStorage, projectCloudWork, validCloudWork } from './cloudWork';
import { makeBackup } from './progressBackup';
import { answerTask, CHAPTERS, emptyJourney, JOURNEY_KEY, cleanJourney } from '../practice/dealJourney';
import { loadDeals } from './analyze';
class Memory implements Storage {
  data=new Map<string,string>();
  get length(){return this.data.size;} key(i:number){return [...this.data.keys()][i]??null;}
  getItem(k:string){return this.data.get(k)??null;} setItem(k:string,v:string){this.data.set(k,v);} removeItem(k:string){this.data.delete(k);} clear(){this.data.clear();}
}
let guest: Memory;
beforeEach(()=>{guest=new Memory(); Object.assign(globalThis,{localStorage:guest}); openWorkspace(null);});
afterEach(()=>openWorkspace(null));
it('keeps guest, account A and account B work isolated without writing account data to device storage',()=>{
  guest.setItem('deedowl.read.v1','["markets"]');
  guest.setItem('deedowl.state.v1','NV');
  openWorkspace('accountA',{'deedowl.read.v1':['financing']});
  expect(workStorage.getItem('deedowl.read.v1')).toBe('["financing"]');
  workStorage.setItem('deedowl.analyze.v1','[{"name":"Account A property"}]');
  expect(guest.getItem('deedowl.analyze.v1')).toBeNull();
  expect(makeBackup().data['deedowl.read.v1']).toBe('["financing"]');
  expect(workStorage.getItem('deedowl.state.v1')).toBe('NV');
  openWorkspace('accountB',{}); expect(workStorage.getItem('deedowl.read.v1')).toBeNull(); expect(workStorage.getItem('deedowl.analyze.v1')).toBeNull();
  openWorkspace(null); expect(workStorage.getItem('deedowl.read.v1')).toBe('["markets"]'); expect(workStorage.getItem('deedowl.analyze.v1')).toBeNull();
});
it('does not clear guest work when clearing an account workspace',()=>{
  guest.setItem('deedowl.read.v1','["markets"]'); openWorkspace('accountA',{'deedowl.read.v1':['financing']});
  workStorage.clear(); expect(guest.getItem('deedowl.read.v1')).toBe('["markets"]'); expect(workStorage.length).toBe(0);
});
it('projects only property and number fields, refuses direct extra fields, and restores the actual saved numbers',()=>{
  const d={id:'deal-1',name:'Example property',state:'NV',county:'Clark',kind:'listing',plan:'rent',notes:'private note',done:[],updatedAt:'2026-10-12T18:00:00.000Z',locationConfirmed:true};
  workStorage.setItem('deedowl.analyze.v1',JSON.stringify([d]));
  workStorage.setItem('deedowl.cash.v1',JSON.stringify({savings:99999})); workStorage.setItem('deedowl.teamlist.v1','{"name":"Do not sync"}');
  workStorage.setItem('fsf.calc.rent.deal-1.v1',JSON.stringify({monthlyRent:2500,ratePct:7,cashAvailable:110000,creditScore:700,notes:'exclude'}));
  workStorage.setItem('fsf.bid.mode.v1','quick'); workStorage.setItem('fsf.calc.strategy.v1','rent');
  workStorage.setItem('fsf.calc.rent.deal-1.v1.region','2.55'); workStorage.setItem('fsf.calc.rent.deal-1.v1.typed.v1','["monthlyRent","ratePct","cashAvailable"]');
  const safe=cloudFromStorage(workStorage);
  expect(validCloudWork(safe)).toBe(true); expect(JSON.stringify(safe)).not.toMatch(/private note|Do not sync|savings|creditScore|notes/);
  expect(validCloudWork({...safe,ssn:'123-45-6789'})).toBe(false);
  openWorkspace('accountA',safe); expect(loadDeals()[0]).toMatchObject({name:'Example property',notes:'',state:'NV',county:'Clark'});
  expect(workStorage.getItem('fsf.bid.mode.v1')).toBe('quick'); expect(workStorage.getItem('fsf.calc.strategy.v1')).toBe('rent');
  expect(workStorage.getItem('fsf.calc.rent.deal-1.v1.region')).toBe('2.55'); expect(JSON.parse(workStorage.getItem('fsf.calc.rent.deal-1.v1')!)).toEqual({monthlyRent:2500,ratePct:7,cashAvailable:110000});
});
it('preserves reflection self-review completion without uploading written content or inventing a written answer',()=>{
  const chapter=CHAPTERS.find(c=>c.tasks.some(t=>t.kind==='reflection'))!;
  let p=emptyJourney();
  for(const task of chapter.tasks){
    const answer=task.kind==='reflection' ? 'My private reflection connects a financial result, a risk, and a professional source to consult.' : task.kind==='choice' ? task.options!.findIndex(o=>o.accepted) : task.kind==='number' ? task.expected! : task.checks!;
    p=answerTask(p,chapter,task,answer);
  }
  expect(p.completed).toContain(chapter.id);
  const safe=projectCloudWork({[JOURNEY_KEY]:p}); expect(validCloudWork(safe)).toBe(true); expect(JSON.stringify(safe)).not.toContain('My private reflection');
  const restored=cleanJourney(safe[JOURNEY_KEY]); expect(restored.completed).toContain(chapter.id);
  for(const task of chapter.tasks.filter(t=>t.kind==='reflection')) expect(restored.answers[`${chapter.id}/${task.id}`]).toBeUndefined();
});
it('refuses oversized, malicious or sensitive property labels without silently deleting a saved deal',()=>{
  for(const name of ['<img src=x onerror=alert(1)>','123-45-6789','x'.repeat(121)]) {
    workStorage.setItem('deedowl.analyze.v1',JSON.stringify([{id:'x',name,state:'NV',county:'Clark',kind:'listing',plan:'rent',done:[],updatedAt:'2026-10-12T18:00:00.000Z'}]));
    expect(()=>cloudFromStorage(workStorage)).toThrow(/property labels/);
  }
  expect(validCloudWork({'fsf.calc.rent.v1':{monthlyRent:Infinity}})).toBe(false);
  expect(validCloudWork({'fsf.calc.rent.v1':{bankAccount:123456}})).toBe(false);
});

it('rejects deeply nested hostile values without recursion errors or accepting extra fields',()=>{
  let nested: unknown = 'x'; for(let i=0;i<20000;i++) nested={unexpected:nested};
  expect(validCloudWork({unknown:nested})).toBe(false);
  expect(validCloudWork({'fsf.calc.rent.v1':{monthlyRent:nested}})).toBe(false);
  expect(validCloudWork(JSON.parse('{"__proto__":{"polluted":true}}'))).toBe(false);
  expect(({} as Record<string,unknown>).polluted).toBeUndefined();
});

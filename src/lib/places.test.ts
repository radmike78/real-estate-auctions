import { describe, expect, it } from 'vitest';
import { matchPlaces, type Place } from './places';
import { STATES } from './regions';
import nv from '../data/places/nv.json';
import ca from '../data/places/ca.json';
import az from '../data/places/az.json';
import ut from '../data/places/ut.json';
import tx from '../data/places/tx.json';

const ALL: Record<string, Place[]> = { NV: nv, CA: ca, AZ: az, UT: ut, TX: tx };

describe('places (Census 2020)', () => {
  it('covers each state, every county is one of the state’s counties, and every place has one', () => {
    expect([nv.length, ca.length, az.length, ut.length, tx.length]).toEqual([133, 1611, 467, 333, 1860]);
    for (const s of STATES) {
      for (const p of ALL[s.code]) {
        expect(p.counties.length).toBeGreaterThan(0);
        for (const c of p.counties) expect(s.counties).toContain(c);
      }
    }
  });

  it('has known cities in the right counties', () => {
    const find = (st: string, name: string) => ALL[st].filter((p) => p.name === name);
    expect(find('NV', 'Henderson')).toEqual([expect.objectContaining({ counties: ['Clark'], population: 317610 })]);
    expect(find('NV', 'Reno')[0].counties).toEqual(['Washoe']);
    expect(find('AZ', 'Peoria')[0].counties).toEqual(['Maricopa', 'Yavapai']);
    expect(find('UT', 'Draper')[0].counties.sort()).toEqual(['Salt Lake', 'Utah']);
    expect(find('CA', 'Paradise').map((p) => p.counties[0]).sort()).toEqual(['Butte', 'Mono']); // same name, two counties
    expect(find('TX', 'Houston')[0].counties.sort()).toEqual(['Fort Bend', 'Harris', 'Montgomery', 'Waller']);
    expect(find('TX', 'El Paso')[0]).toEqual(expect.objectContaining({ counties: ['El Paso'], population: 678815 }));
  });

  it('matches what someone types: names starting with it first, bigger and incorporated places first', () => {
    expect(matchPlaces(nv, 'hen')[0].name).toBe('Henderson');
    expect(matchPlaces(nv, 'las v')[0].name).toBe('Las Vegas');
    expect(matchPlaces(ca, 'la canada')[0].name).toBe('La Cañada Flintridge'); // accents don't matter
    expect(matchPlaces(nv, '')).toEqual([]);
    expect(matchPlaces(ca, 'san', 5)).toHaveLength(5);
  });
});

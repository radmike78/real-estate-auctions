// The states DeedOwl covers, and their counties (Find Deals asks for both).

export type StateCode = 'NV' | 'CA' | 'AZ' | 'UT';

export interface StateInfo {
  code: StateCode;
  name: string;
  counties: string[];
}

export const STATES: StateInfo[] = [
  {
    code: 'NV',
    name: 'Nevada',
    counties: ['Carson City', 'Churchill', 'Clark', 'Douglas', 'Elko', 'Esmeralda', 'Eureka', 'Humboldt', 'Lander', 'Lincoln', 'Lyon', 'Mineral', 'Nye', 'Pershing', 'Storey', 'Washoe', 'White Pine'],
  },
  {
    code: 'CA',
    name: 'California',
    counties: [
      'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 'Del Norte', 'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo',
      'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada',
      'Orange', 'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino', 'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo',
      'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou', 'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama',
      'Trinity', 'Tulare', 'Tuolumne', 'Ventura', 'Yolo', 'Yuba',
    ],
  },
  {
    code: 'AZ',
    name: 'Arizona',
    counties: ['Apache', 'Cochise', 'Coconino', 'Gila', 'Graham', 'Greenlee', 'La Paz', 'Maricopa', 'Mohave', 'Navajo', 'Pima', 'Pinal', 'Santa Cruz', 'Yavapai', 'Yuma'],
  },
  {
    code: 'UT',
    name: 'Utah',
    counties: [
      'Beaver', 'Box Elder', 'Cache', 'Carbon', 'Daggett', 'Davis', 'Duchesne', 'Emery', 'Garfield', 'Grand', 'Iron', 'Juab', 'Kane', 'Millard', 'Morgan',
      'Piute', 'Rich', 'Salt Lake', 'San Juan', 'Sanpete', 'Sevier', 'Summit', 'Tooele', 'Uintah', 'Utah', 'Wasatch', 'Washington', 'Wayne', 'Weber',
    ],
  },
];

export const stateByCode = (c: string) => STATES.find((s) => s.code === c);
/** "Carson City" is a consolidated city-county; the rest are "X County". */
export const countyName = (county: string) => (county === 'Carson City' ? 'Carson City' : `${county} County`);

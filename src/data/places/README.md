# Places (cities, towns and Census-designated places)

One file per state (`nv.json`, `ca.json`, `az.json`, `ut.json`): every Census 2020 place in the state, with its type
(city, town, CDP, metro township), the county or counties it lies in (the word "County" left off), and its 2020
population. Used by the "Where are you buying?" picker (`src/lib/places.ts`). Public-domain U.S. Census Bureau data:

- Place-to-county lists, 2020 codes (file dated 2023-02-17):
  `https://www2.census.gov/geo/docs/reference/codes2020/place_by_cou/st32_nv_place_by_county2020.txt`
  (and `st06_ca_…`, `st04_az_…`, `st49_ut_…`).
- Population: Census 2020 redistricting data (PL 94-171, dated 2021-08-12), place records in each state's file:
  `https://www2.census.gov/programs-surveys/decennial/2020/data/01-Redistricting_File--PL_94-171/Nevada/nv2020.pl.zip`
  (and California, Arizona, Utah).

Counts: NV 133, CA 1,611, AZ 467, UT 333. A few places span two counties (e.g. Peoria AZ, Draper UT); some names
repeat within a state in different counties (e.g. Paradise CA), so the picker always shows the county.

To rebuild: download those files into one folder and run `python3 scripts/places/build.py` there, then split
`places.json` by state into this folder.

-- Production schema (PostgreSQL 15+ with PostGIS) for the forced-sale discovery platform.
-- Not used by the prototype yet; src/types.ts mirrors these tables.
--
-- Design rules:
--   * Every fact links to a source_document so the UI can show agency, URL, instrument #,
--     recorded date, last-verified time and confidence.
--   * A lien never implies a sale: purchasability comes only from an enforcement event
--     (notice of sale, levy, tax-sale listing) recorded in sale_event / sale.
--   * The system never stores a "title is clear" verdict. lien_assessment holds screening
--     outcomes, and human review is required for low-confidence matches.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

CREATE TYPE sale_type AS ENUM (
  'TAX_DEED', 'TAX_LIEN_CERTIFICATE', 'TRUSTEE_SALE', 'JUDICIAL_FORECLOSURE', 'HOA_FORECLOSURE',
  'SHERIFF_EXECUTION', 'FEDERAL_TAX_SEIZURE', 'GOVERNMENT_FORFEITURE', 'REO', 'PROBATE_PARTITION'
);

CREATE TYPE acquisition_status AS ENUM (
  'ONLINE_BIDDING', 'IN_PERSON_AUCTION', 'SEALED_BID', 'BROKER_OFFER', 'COURT_CONFIRMATION_REQUIRED',
  'LIEN_CERTIFICATE_ONLY', 'PRE_FORECLOSURE_NOT_YET_PURCHASABLE', 'SALE_CANCELLED_OR_POSTPONED',
  'STATUS_REQUIRES_CONFIRMATION', 'NOT_FOR_SALE_LIEN_ONLY'
);

CREATE TYPE lien_type AS ENUM (
  'PROPERTY_TAX', 'FIRST_DEED_OF_TRUST', 'SECOND_DEED_OF_TRUST', 'HOA_SUPERPRIORITY', 'HOA_SUBPRIORITY',
  'FEDERAL_TAX', 'STATE_TAX', 'JUDGMENT', 'MECHANICS', 'CODE_ENFORCEMENT', 'MUNICIPAL_UTILITY', 'OTHER'
);

CREATE TYPE event_type AS ENUM (
  'TAX_DELINQUENT', 'LIEN_RECORDED', 'LIEN_RELEASED', 'NOTICE_OF_DEFAULT', 'NOTICE_OF_SALE', 'LIS_PENDENS',
  'LEVY', 'SALE_SCHEDULED', 'SALE_POSTPONED', 'SALE_CANCELLED', 'SOLD', 'BANKRUPTCY_FILED',
  'BANKRUPTCY_DISMISSED', 'DEEDED_TO_TRUSTEE', 'DEED_RECORDED'
);

-- Where data comes from, including the terms-of-use review required before automated collection.
CREATE TABLE data_source (
  id              serial PRIMARY KEY,
  agency          text NOT NULL,                 -- e.g. 'Clark County Recorder'
  jurisdiction    text NOT NULL,                 -- e.g. 'NV-Clark'
  base_url        text,
  access_method   text NOT NULL CHECK (access_method IN ('api', 'bulk_file', 'csv', 'pdf', 'html', 'manual', 'commercial_feed')),
  terms_reviewed_at date,                        -- NULL = do not ingest automatically
  terms_notes     text,
  active          boolean NOT NULL DEFAULT false
);

-- One row per retrieved document or record (notice PDF, CSV row, API payload).
CREATE TABLE source_document (
  id              bigserial PRIMARY KEY,
  data_source_id  int NOT NULL REFERENCES data_source(id),
  url             text,
  instrument_number text,
  recorded_date   date,
  retrieved_at    timestamptz NOT NULL DEFAULT now(),
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  content_sha256  text,                          -- dedupe; raw file lives in object storage
  storage_key     text,                          -- s3://bucket/key of the original
  ocr_text        text,
  confidence      confidence_level NOT NULL DEFAULT 'medium',
  UNIQUE (data_source_id, instrument_number)
);

CREATE TABLE parcel (
  id              bigserial PRIMARY KEY,
  jurisdiction    text NOT NULL,                 -- 'NV-Clark'
  apn             text NOT NULL,
  situs_address   text,
  city            text,
  state           char(2) NOT NULL,
  zip             text,
  county          text NOT NULL,
  legal_description text,
  owner_of_record text,
  property_type   text,
  beds            smallint,
  baths           numeric(3,1),
  living_sqft     int,
  lot_sqft        int,
  year_built      smallint,
  assessed_value  numeric(12,2),
  est_market_value numeric(12,2),
  last_sale_date  date,
  last_sale_price numeric(12,2),
  occupancy       text,
  zoning          text,
  flood_zone      text,
  geom            geometry(MultiPolygon, 4326),
  centroid        geometry(Point, 4326),
  source_document_id bigint REFERENCES source_document(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jurisdiction, apn)
);
CREATE INDEX parcel_centroid_gix ON parcel USING gist (centroid);
CREATE INDEX parcel_zip_idx ON parcel (zip);
CREATE INDEX parcel_city_state_idx ON parcel (lower(city), state);
CREATE INDEX parcel_address_trgm ON parcel USING gin (situs_address gin_trgm_ops);

CREATE TABLE lien (
  id              bigserial PRIMARY KEY,
  parcel_id       bigint NOT NULL REFERENCES parcel(id),
  type            lien_type NOT NULL,
  holder          text,
  original_amount numeric(14,2),
  current_amount  numeric(14,2),
  recorded_date   date,
  released        boolean NOT NULL DEFAULT false,
  released_by_document_id bigint REFERENCES source_document(id),
  source_document_id bigint NOT NULL REFERENCES source_document(id),
  match_confidence confidence_level NOT NULL DEFAULT 'medium',
  needs_review    boolean NOT NULL DEFAULT false -- uncertain parcel match -> human queue
);
CREATE INDEX lien_parcel_idx ON lien (parcel_id) WHERE NOT released;

CREATE TABLE sale_event (
  id              bigserial PRIMARY KEY,
  parcel_id       bigint NOT NULL REFERENCES parcel(id),
  type            event_type NOT NULL,
  event_date      date NOT NULL,
  description     text,
  source_document_id bigint NOT NULL REFERENCES source_document(id)
);
CREATE INDEX sale_event_parcel_idx ON sale_event (parcel_id, event_date);

CREATE TABLE sale (
  id              bigserial PRIMARY KEY,
  parcel_id       bigint NOT NULL REFERENCES parcel(id),
  sale_type       sale_type NOT NULL,
  status          acquisition_status NOT NULL,
  foreclosing_lien_id bigint REFERENCES lien(id),
  conducted_by    text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  location        text,
  official_url    text,                          -- deep link to the official sale; we never take bids
  minimum_bid     numeric(14,2),
  deposit         text,
  registration_deadline timestamptz,
  payment_methods text[],
  final_payment_deadline timestamptz,
  buyer_premium_pct numeric(5,2),
  deed_type       text,
  redemption_period text,
  eligibility     text,
  postponements   int NOT NULL DEFAULT 0,
  source_document_id bigint NOT NULL REFERENCES source_document(id),
  last_verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sale_upcoming_idx ON sale (starts_at) WHERE status NOT IN ('SALE_CANCELLED_OR_POSTPONED', 'NOT_FOR_SALE_LIEN_ONLY');

-- Output of the rules engine, versioned so a rule change can be re-run and audited.
CREATE TABLE lien_assessment (
  id              bigserial PRIMARY KEY,
  sale_id         bigint NOT NULL REFERENCES sale(id),
  lien_id         bigint NOT NULL REFERENCES lien(id),
  outcome         text NOT NULL CHECK (outcome IN ('FORECLOSING', 'LIKELY_EXTINGUISHED', 'LIKELY_SURVIVES', 'UNCERTAIN')),
  reason          text NOT NULL,
  rules_version   text NOT NULL,
  assessed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sale_id, lien_id, rules_version)
);

-- Saved searches / alerts (Phase 5).
CREATE TABLE alert (
  id              bigserial PRIMARY KEY,
  user_id         uuid NOT NULL,
  query           jsonb NOT NULL,                -- same shape as the frontend Filters
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_sent_at    timestamptz
);

-- Every poll of a source, used to learn its real update cadence and to prove freshness.
CREATE TABLE source_check (
  id              bigserial PRIMARY KEY,
  data_source_id  int NOT NULL REFERENCES data_source(id),
  checked_at      timestamptz NOT NULL DEFAULT now(),
  outcome         text NOT NULL CHECK (outcome IN ('changed', 'not_modified', 'unchanged', 'quarantined', 'schema_drift', 'error')),
  content_sha256  text,
  http_etag       text,
  rows_parsed     int,
  rows_rejected   int,
  message         text
);
CREATE INDEX source_check_recent_idx ON source_check (data_source_id, checked_at DESC);

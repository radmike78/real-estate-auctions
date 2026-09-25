import type { SourceRef } from '../types';
import { fmtDate, fmtDateTime } from '../lib/status';

// Provenance for a single fact: agency, document number, recorded date, last verified, confidence.
export default function SourceTag({ source }: { source: SourceRef }) {
  const title = [
    source.agency,
    source.documentNumber && `Doc #${source.documentNumber}`,
    source.recordedDate && `Recorded ${fmtDate(source.recordedDate)}`,
    `Verified ${fmtDateTime(source.lastVerified)}`,
    `Confidence: ${source.confidence}`,
  ]
    .filter(Boolean)
    .join(' · ');
  const body = (
    <>
      <span className={`conf conf-${source.confidence}`} aria-hidden />
      {source.documentNumber ?? source.agency}
    </>
  );
  return source.url ? (
    <a className="source" href={source.url} target="_blank" rel="noreferrer" title={title}>{body}</a>
  ) : (
    <span className="source" title={title}>{body}</span>
  );
}

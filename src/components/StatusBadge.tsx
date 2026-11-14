import type { AcquisitionStatus } from '../types';
import { STATUS } from '../lib/status';

/** `label` overrides the status name (a bank-owned home taking offers online is an offer, not an auction). */
export default function StatusBadge({ status, label }: { status: AcquisitionStatus; label?: string }) {
  const s = STATUS[status];
  return <span className={`badge tone-${s.tone}`}>{label ?? s.label}</span>;
}

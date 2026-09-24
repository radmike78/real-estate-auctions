import type { AcquisitionStatus } from '../types';
import { STATUS } from '../lib/status';

export default function StatusBadge({ status }: { status: AcquisitionStatus }) {
  const s = STATUS[status];
  return <span className={`badge tone-${s.tone}`}>{s.label}</span>;
}

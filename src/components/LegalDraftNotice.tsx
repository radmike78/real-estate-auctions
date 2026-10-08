import { LEGAL_REVIEWED, hasPlaceholders } from '../lib/siteInfo';

/** Shown on the Privacy Policy and Terms until the business details are filled in and an attorney has reviewed them. */
export default function LegalDraftNotice() {
  if (LEGAL_REVIEWED && !hasPlaceholders()) return null;
  return (
    <div className="caution" role="note">
      <strong>Draft under legal review.</strong> This page is being finalized.{hasPlaceholders() ? ' Details shown in [brackets] will be filled in before launch.' : ''}
    </div>
  );
}

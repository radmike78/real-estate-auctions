import { VERIFIED_NOTICE } from '../lib/proVerification';

/** Shown at the top of every advertiser profile: the listing is a paid ad, never an endorsement. */
export default function PaidAdNotice() {
  return (
    <p className="paid-ad-notice" role="note">
      <strong>This is a paid advertisement.</strong> This professional pays DeedOwl to advertise. We don't endorse, recommend or refer you to anyone
      specifically. {VERIFIED_NOTICE} Compare more than one professional, and choose the one
      that's right for you.
    </p>
  );
}

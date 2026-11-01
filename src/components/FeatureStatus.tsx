import { loadSiteFeatures, type SiteFeatures } from '../lib/siteFeatures';
import OwlNote from './OwlNote';

/** While the site checks which services are on: a quiet line. If the check fails: the owl, a plain message and a retry. */
export default function FeatureStatus({ features, what = 'Sign-up isn’t' }: { features: SiteFeatures | null; what?: string }) {
  if (!features?.unavailable) return <div className="notice" role="status">Checking service availability…</div>;
  return (
    <OwlNote>
      <strong>{what} available right now.</strong> We couldn’t load its status. Meanwhile, everything else on DeedOwl works: <a href="#/learn">lessons</a>, <a href="#/practice">practice</a> and <a href="#/analyze">Analyze a deal</a>.
      <span className="owl-note-retry"><button type="button" className="btn btn-secondary" onClick={() => { void loadSiteFeatures(); }}>Try again</button></span>
    </OwlNote>
  );
}

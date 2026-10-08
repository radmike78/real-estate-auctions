import { loadSiteFeatures, type SiteFeatures } from '../lib/siteFeatures';
export default function FeatureStatus({ features }: { features: SiteFeatures | null }) {
  return <div className="notice" role="status">{features?.unavailable ? <>We couldn’t check service availability. Please try again. <button type="button" className="linkish" onClick={() => { void loadSiteFeatures(); }}>Try again</button></> : 'Checking service availability…'}</div>;
}

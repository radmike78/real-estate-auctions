import { loadSiteFeatures, type SiteFeatures } from '../lib/siteFeatures';
export default function FeatureStatus({ features }: { features: SiteFeatures | null }) {
  return <div className="notice" role="status">{features?.unavailable ? <>We couldn’t load sign-up status right now. <button type="button" className="linkish" onClick={() => { void loadSiteFeatures(); }}>Try again</button></> : 'Checking service availability…'}</div>;
}

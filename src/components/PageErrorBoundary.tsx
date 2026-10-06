import { Component, type ReactNode } from 'react';

/**
 * Keeps the header, menu and footer working when one page fails to draw (a bug or unexpected saved data): the owl
 * explains, instead of a blank screen. Keyed by the address in App, so going to another page starts fresh.
 */
export default class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Page failed to draw:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page empty-page" id="content">
        <img className="owl-empty" src="/logo.svg" alt="" width={128} height={128} />
        <h1>This page didn’t load</h1>
        <p>Something went wrong showing it. Your saved deals and notes are still in this browser. Try again, or go to another page.</p>
        <p className="row">
          <button type="button" className="btn" onClick={() => window.location.reload()}>Try again</button> <a className="btn btn-secondary" href="#/">Go to the home page</a>
        </p>
      </main>
    );
  }
}

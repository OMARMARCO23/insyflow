import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function Ga4RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!window.gtag) return;
    // Build a consistent page_location for hash routing
    const page_path = location.pathname + location.search + location.hash;
    const page_location = `${window.location.origin}/#${location.pathname}${location.search}${location.hash}`;
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_path,
      page_location,
    });
  }, [location]);

  return null;
}
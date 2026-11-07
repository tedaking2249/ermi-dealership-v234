import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Opening a page starts at the top. A link like /#contact scrolls to that section instead.
function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    // The section may appear a moment after the page loads, so look for it a few times
    const timer = setInterval(() => {
      const target = document.getElementById(id);
      tries += 1;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        clearInterval(timer);
      } else if (tries > 25) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [pathname, hash]);

  return null;
}

export default ScrollToHash;
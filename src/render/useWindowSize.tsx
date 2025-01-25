import { useLayoutEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export const useWindowSize = () => {
  const [windowSize, setWindowSizeNow] = useState([window.innerWidth, window.innerHeight]);

  const setWindowSize = useDebouncedCallback((value) => setWindowSizeNow(value), 200, { leading: true });

  useLayoutEffect(() => {
    function updateSize() {
      if (window.innerWidth !== windowSize[0] || window.innerHeight !== windowSize[1]) {
        setWindowSize([window.innerWidth, window.innerHeight]);

        // force a rerender after the resize is done
        setTimeout(() => {
          setWindowSizeNow([window.innerWidth, window.innerHeight]);
        }, 25);
      }
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return windowSize;
};

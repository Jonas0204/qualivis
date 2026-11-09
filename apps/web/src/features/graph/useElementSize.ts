import { type RefObject, useLayoutEffect, useState } from 'react';

export type ElementSize = { width: number; height: number };

/** Inner size (clientWidth/clientHeight) of the element; `undefined` until it is measured. */
export const useElementSize = (ref: RefObject<Element | null>): ElementSize | undefined => {
  const [size, setSize] = useState<ElementSize>();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const measure = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setSize(current =>
        current?.width === width && current.height === height ? current : { width, height }
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};

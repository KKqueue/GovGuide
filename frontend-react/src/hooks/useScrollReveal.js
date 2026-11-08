import { useEffect, useRef, useState } from "react";

const callbacks = new WeakMap();
let shared;

function getObserver() {
  if (!shared) {
    shared = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const cb = callbacks.get(e.target);
            if (cb) cb();
            shared.unobserve(e.target);
            callbacks.delete(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "40px" }
    );
  }
  return shared;
}

export default function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = getObserver();
    callbacks.set(el, () => setVisible(true));
    obs.observe(el);
    return () => {
      obs.unobserve(el);
      callbacks.delete(el);
    };
  }, []);

  return [ref, visible];
}

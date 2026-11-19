import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const isFirst = useRef(true);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const main = document.getElementById("main-content");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
      main.removeAttribute("tabindex");
    }
  }, [pathname]);
  return null;
}

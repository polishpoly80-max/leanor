import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { NAV_LINKS, SITE } from "../../data/siteContent.js";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // 0..1 reading progress, drives the scroll-progress hairline.
  const [progress, setProgress] = useState(0);
  // Geometry of the active link, used to slide the highlight behind it.
  const [pill, setPill] = useState(null);
  const { pathname } = useLocation();

  const linksRef = useRef(null);
  const ticking = useRef(false);

  // Close the mobile menu whenever navigation happens.
  useEffect(() => setOpen(false), [pathname]);

  // Lock scrolling while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Tighten the bar once the page has moved, so the blur + shadow read as "lifted",
  // and track how far through the document we are. rAF-throttled to one read
  // per frame, since this fires on every scroll event.
  useEffect(() => {
    const read = () => {
      ticking.current = false;
      const y = window.scrollY;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 8);
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Park the highlight over whichever link matches the current route.
  const syncPill = useCallback(() => {
    const list = linksRef.current;
    if (!list) return;
    const active = list.querySelector(".nav__link--active");
    if (!active) {
      setPill(null);
      return;
    }
    const listBox = list.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    setPill({
      x: box.left - listBox.left,
      y: box.top - listBox.top,
      w: box.width,
      h: box.height,
    });
  }, []);

  // Measure after paint so fonts and layout have settled, and again whenever
  // the route changes. Layout is cheap here: one getBoundingClientRect per frame.
  useLayoutEffect(() => {
    syncPill();
  }, [syncPill, pathname, open]);

  useEffect(() => {
    window.addEventListener("resize", syncPill);
    return () => window.removeEventListener("resize", syncPill);
  }, [syncPill]);

  return (
    <header
      className={scrolled ? "nav nav--scrolled" : "nav"}
      style={{ "--progress": progress }}
    >
      <nav className="container nav__inner" aria-label="Main navigation">
        <Link to="/" className="brand">
          <span className="brand__mark" aria-hidden="true">
            LF
          </span>
          <span className="brand__text">
            <strong>{SITE.name}</strong>
            <small>Info Share</small>
          </span>
        </Link>

        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span className="nav__burger" aria-hidden="true" data-open={open} />
        </button>

        {/* `data-open` only takes effect on small screens (see layout.css). */}
        <ul
          id="primary-navigation"
          className="nav__links"
          data-open={open}
          ref={linksRef}
        >
          <li
            className="nav__pill"
            data-ready={pill ? "true" : "false"}
            style={
              pill
                ? {
                    "--pill-x": `${pill.x}px`,
                    "--pill-y": `${pill.y}px`,
                    "--pill-w": `${pill.w}px`,
                    "--pill-h": `${pill.h}px`,
                  }
                : undefined
            }
            aria-hidden="true"
          />
          {NAV_LINKS.map((link, index) => (
            <li key={link.to} style={{ "--i": index }}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  isActive ? "nav__link nav__link--active" : "nav__link"
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className="nav__cta" style={{ "--i": NAV_LINKS.length }}>
            <Link to="/admin" className="btn btn--ghost btn--sm">
              Admin inbox
            </Link>
          </li>
        </ul>
      </nav>

      {/* Reading progress, decorative only. */}
      <span className="nav__progress" aria-hidden="true" />
    </header>
  );
}
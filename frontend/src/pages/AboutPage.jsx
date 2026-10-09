import { Link } from "react-router-dom";
import PageHead from "../components/ui/PageHead.jsx";
import Icon from "../components/ui/Icon.jsx";
import { Reveal } from "../hooks/useReveal.jsx";
import { PRIVACY_POINTS, SITE } from "../data/siteContent.js";

export default function AboutPage() {
  return (
    <>
      <PageHead
        eyebrow="About"
        title="One secure channel for your information"
        lead={`${SITE.fullName} is a single submission channel operated by the ${SITE.owner}: one public form where you provide your details, and one private inbox where the Foundation reads them.`}
      />

      <section className="section">
        <div className="container split">
          <Reveal className="stack">
            <div>
              <h2>What this site does</h2>
              <p className="lead-copy">
                Information tends to arrive in the wrong places — part in a message,
                part in an email, part never at all. This site replaces that with one
                structured form: the same fields for everyone, validated the same
                way, stored in the same shape.
              </p>
              <p className="lead-copy">
                Behind it sits a small FastAPI service. It re-checks every
                submission on the server, files it, and issues a reference number.
                The interface is a React application served by the same API, so
                there is one thing to run and one thing to host.
              </p>
            </div>

            <div className="grid grid--pair">
              <div className="stat-tile">
                <strong>01</strong>
                <span>form for everything</span>
              </div>
              <div className="stat-tile">
                <strong>00</strong>
                <span>third parties involved</span>
              </div>
            </div>
          </Reveal>

          <Reveal className="card" delay={90}>
            <h3>Good to know</h3>
            <ul className="checklist" style={{ marginTop: "1rem" }}>
              <li>Bank and password fields are optional — only supply them on request.</li>
              <li>Two ID card photographs are accepted, front and back.</li>
              <li>You receive a reference number the moment your submission is filed.</li>
              <li>You may request deletion of your record at any time.</li>
            </ul>
            <p style={{ marginTop: "1.5rem" }}>
              <Link to="/submit" className="btn btn--primary">
                Go to the form
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- privacy */}
      <section className="section section--soft" id="privacy">
        <div className="container" style={{ maxWidth: "840px" }}>
          <Reveal className="section-head">
            <span className="eyebrow">Privacy</span>
            <h2>How your information is handled</h2>
            <p>In short: it is collected, it is filed, and nobody else reads it.</p>
          </Reveal>

          <Reveal className="card" delay={80}>
            <ul className="checklist">
              {PRIVACY_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <hr className="divider" style={{ margin: "1.5rem 0" }} />

            <div className="notice notice--warning">
              <Icon name="shield" size={17} />
              <span>
                This site handles passwords and identification photographs. It must
                only ever be served over HTTPS, and the inbox password must be set
                before the site is made public.
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
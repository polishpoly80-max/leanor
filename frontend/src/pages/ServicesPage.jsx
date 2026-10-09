import { Link } from "react-router-dom";
import PageHead from "../components/ui/PageHead.jsx";
import Icon from "../components/ui/Icon.jsx";
import { Reveal } from "../hooks/useReveal.jsx";
import { LIMITS, SERVICES } from "../data/siteContent.js";

export default function ServicesPage() {
  return (
    <>
      <PageHead
        eyebrow="What you can send"
        title="Everything the form accepts"
        lead="Only your name, email address and the consent statement are required. Include anything else that applies to your situation."
      />

      <section className="section">
        <div className="container">
          <div className="grid grid--3">
            {SERVICES.map((service, i) => (
              <Reveal
                key={service.title}
                delay={i * 70}
                className={service.accent ? "feature feature--accent" : "feature"}
              >
                <span className="feature__icon">
                  <Icon name={service.icon} size={22} />
                </span>
                <h3>{service.title}</h3>
                <p>{service.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--brand">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Technical limits</span>
            <h2>What the server enforces</h2>
            <p>
              These are validated on every submission, whether or not the browser
              caught them first.
            </p>
          </Reveal>

          <div className="grid grid--3">
            {LIMITS.map(([value, label], i) => (
              <Reveal key={label} delay={i * 60}>
                <div className="stat-tile">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container split">
          <Reveal className="card">
            <h3>Before you submit</h3>
            <ul className="checklist" style={{ marginTop: "1rem" }}>
              <li>Check the page address shows a padlock before entering passwords.</li>
              <li>Photograph your ID flat, evenly lit and in focus.</li>
              <li>Have your account and reference details to hand.</li>
              <li>Save the reference number once the form confirms.</li>
            </ul>
          </Reveal>

          <Reveal className="card" delay={90}>
            <h3>Handling sensitive data</h3>
            <p style={{ marginTop: "0.75rem", color: "var(--text-muted)" }}>
              Passwords and identification images are the most sensitive parts of
              this form. They are optional, and should only be supplied when the
              Foundation has asked for them directly.
            </p>
            <div className="notice" style={{ marginTop: "1rem" }}>
              <Icon name="shield" size={17} />
              <span>
                If you are unsure whether a request is genuine, contact the Foundation
                through its official channel before sending anything.
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal className="section cta">
        <div className="container">
          <h2>Ready to send yours?</h2>
          <p>It takes about two minutes and gives you a reference number immediately.</p>
          <p className="cta__actions">
            <Link to="/submit" className="btn btn--ghost">
              Open the form
            </Link>
          </p>
        </div>
      </Reveal>
    </>
  );
}
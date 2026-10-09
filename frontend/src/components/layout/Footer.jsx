import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { SITE } from "../../data/siteContent.js";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <h4>{SITE.name}</h4>
            <p>{SITE.tagline}.</p>
          </div>

          <div>
            <h4>Pages</h4>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/services">What you can send</Link>
              </li>
              <li>
                <Link to="/submit">Submit information</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>Administrator</h4>
            <ul>
              <li>
                <Link to="/admin">Admin inbox</Link>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Privacy</h4>
            <ul>
              <li>
                <Link to="/about#privacy">How your data is handled</Link>
              </li>
            </ul>
            <p className="footer__note">
              <Icon name="shield" size={15} />
              Only the Foundation can read your submission.
            </p>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {new Date().getFullYear()} {SITE.name}. Built with FastAPI and React.
          </span>
          <span>Sensitive data — never submit over an unsecured connection.</span>
        </div>
      </div>
    </footer>
  );
}
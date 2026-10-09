import { Link } from "react-router-dom";
import PageHead from "../components/ui/PageHead.jsx";
import Icon from "../components/ui/Icon.jsx";

export default function NotFoundPage() {
  return (
    <>
      <PageHead eyebrow="Error 404" title="That page does not exist" />
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <span className="empty-state__icon">
              <Icon name="search" size={34} />
            </span>
            <p>
              The link you followed is broken or the page has been moved. Everything
              else is still where you left it.
            </p>
            <Link to="/" className="btn btn--primary">
              Return to the home page
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
import PageHead from "../components/ui/PageHead.jsx";
import SubmissionForm from "../components/form/SubmissionForm.jsx";
import { SITE } from "../data/siteContent.js";

export default function SubmitPage() {
  return (
    <>
      <PageHead
        eyebrow="Submit"
        title="Send your information"
        lead={`Everything goes straight to ${SITE.owner} as a single record. Only your full name, email address and the consent statement are required.`}
      />

      <section className="section section--soft">
        <div className="container" style={{ maxWidth: "900px" }}>
          <SubmissionForm />
        </div>
      </section>
    </>
  );
}
import AdminInbox from "../components/admin/AdminInbox.jsx";
import AdminLogin from "../components/admin/AdminLogin.jsx";
import PageHead from "../components/ui/PageHead.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminPage() {
  const { status, isAuthenticated } = useAuth();

  return (
    <>
      <PageHead
        eyebrow="Owner"
        title="Admin inbox"
        lead="Everything submitted through the public form, newest first. Sign in to read it."
      />

      <section className="section section--soft">
        <div className="container" style={{ maxWidth: "960px" }}>
          {status === "checking" && <p className="hint">Checking session…</p>}

          {status !== "checking" &&
            (isAuthenticated ? <AdminInbox /> : <AdminLogin />)}
        </div>
      </section>
    </>
  );
}
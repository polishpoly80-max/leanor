import { useCallback, useEffect, useState } from "react";
import { deleteSubmission, fetchStats, fetchSubmissions } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Icon from "../ui/Icon.jsx";
import SubmissionCard from "./SubmissionCard.jsx";

export default function AdminInbox() {
  const { token, signOut } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [submissions, summary] = await Promise.all([
        fetchSubmissions(token),
        fetchStats(token).catch(() => null),
      ]);
      setItems(submissions);
      setStats(summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm("Permanently delete this submission and all its images?")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteSubmission(id, token);
      setItems((current) => current.filter((item) => item.id !== id));
      setStats((current) =>
        current ? { ...current, total: Math.max(0, current.total - 1) } : current,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div>
      <div className="admin-bar">
        <div className="admin-bar__stats">
          <div>
            <strong>{stats?.total ?? items.length}</strong>
            <span>submissions</span>
          </div>
          <div>
            <strong>{stats?.with_pictures ?? "—"}</strong>
            <span>with images</span>
          </div>
          <div>
            <strong>{stats?.storage ?? "—"}</strong>
            <span>storage</span>
          </div>
        </div>

        <div className="admin-bar__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={load}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" /> Loading
              </>
            ) : (
              "Refresh"
            )}
          </button>
          <button type="button" className="btn btn--subtle btn--sm" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <p className="alert alert--error" role="alert" style={{ marginBottom: "1rem" }}>
          <span className="alert__icon">
            <Icon name="shield" size={17} />
          </span>
          <span>{error}</span>
        </p>
      )}

      {loading && items.length === 0 && (
        <p className="hint">
          <span className="spinner" aria-hidden="true" /> Loading submissions…
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon">
            <Icon name="inbox" size={34} />
          </span>
          <h3>No submissions yet</h3>
          <p>
            When someone completes the public form it will appear here within a
            second or two.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="inbox">
          {items.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onDelete={handleDelete}
              busy={deletingId === submission.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
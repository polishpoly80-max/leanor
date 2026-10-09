import { useRef, useState } from "react";
import Icon from "../ui/Icon.jsx";
import {
  ACCEPT_ATTR,
  MAX_FILE_BYTES,
  MAX_FILE_MB,
  checkFile,
  sameFile,
} from "./pictureUtils.js";

/**
 * Multi-photo dropzone with previews.
 *
 * The whole panel is a <label> wrapping the file input, so tapping anywhere
 * opens the picker natively — no programmatic .click(), which mobile browsers
 * (and Safari) refuse to honour on a hidden input.
 */
export default function PictureUploader({
  pictures,
  setPictures,
  onChange,
  maxFiles,
  error,
  title = "Photos",
  hint,
}) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);

  function handleFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const problems = [];
    const accepted = [];

    setPictures((current) => {
      const next = [...current];

      for (const file of incoming) {
        const problem = checkFile(file, MAX_FILE_BYTES);
        if (problem) {
          problems.push(problem);
          continue;
        }
        if (next.some((pic) => sameFile(pic.file, file))) continue; // already added
        if (next.length >= maxFiles) {
          problems.push(`Maximum ${maxFiles} photos allowed.`);
          break;
        }
        next.push({ file, preview: URL.createObjectURL(file) });
        accepted.push(file);
      }
      return next;
    });

    setLocalError(problems.join(" "));
    onChange(problems.length > 0 ? problems.join(" ") : "");
  }

  function removeAt(index) {
    setPictures((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((_, i) => i !== index);
    });
  }

  function clearAll() {
    setPictures((current) => {
      current.forEach((pic) => URL.revokeObjectURL(pic.preview));
      return [];
    });
    setLocalError("");
  }

  const message = localError || error;
  const full = pictures.length >= maxFiles;

  return (
    <div className="stack">
      <label
        className={dragging ? "dropzone dropzone--dragging" : "dropzone"}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <span className="dropzone__icon">
          <Icon name="upload" size={26} />
        </span>

        <span className="dropzone__title">{title}</span>
        <span className="dropzone__hint">
          Tap here to choose from your device, or drag files in
        </span>

        {/* Visually hidden, not [hidden] — this keeps it focusable and tappable. */}
        <input
          ref={inputRef}
          className="dropzone__input"
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = ""; // allow re-picking the same file
          }}
        />

        <span className="dropzone__meta">
          PNG, JPEG, GIF or WEBP · up to {MAX_FILE_MB} MB each ·{" "}
          <strong>
            {pictures.length}/{maxFiles}
          </strong>{" "}
          selected
        </span>
      </label>

      {message && <em className="error-text">{message}</em>}
      {hint && !message && <p className="hint">{hint}</p>}

      {pictures.length > 0 && (
        <>
          <div className="preview-grid">
            {pictures.map((pic, index) => (
              <figure className="preview" key={`${pic.file.name}-${pic.file.size}`}>
                <img src={pic.preview} alt={pic.file.name} />
                <button
                  type="button"
                  className="preview__remove"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove ${pic.file.name}`}
                >
                  <Icon name="close" size={13} />
                </button>
                <figcaption className="preview__name">{pic.file.name}</figcaption>
              </figure>
            ))}
          </div>

          <button type="button" className="link-btn" onClick={clearAll}>
            Remove all photos
          </button>
        </>
      )}

      {full && (
        <p className="hint">
          That is the maximum of {maxFiles}. Remove one to add another.
        </p>
      )}
    </div>
  );
}

export { MAX_FILE_BYTES, MAX_FILE_MB };
import { useState } from "react";
import Icon from "../ui/Icon.jsx";
import { ACCEPT_ATTR, MAX_FILE_MB, checkFile } from "./pictureUtils.js";

/**
 * A single-image slot (used for the two ID card photographs).
 * Same label-based picker as PictureUploader so tapping always opens the
 * file chooser, including on mobile Safari.
 */
export default function ImageSlot({ label, hint, value, onSelect, onClear, error }) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");

  function take(fileList) {
    const file = Array.from(fileList || [])[0];
    if (!file) return;

    const problem = checkFile(file);
    if (problem) {
      setLocalError(problem);
      onClear();
      return;
    }
    setLocalError("");
    onSelect({ file, preview: URL.createObjectURL(file) });
  }

  const message = localError || error;

  return (
    <div className={value ? "slot slot--filled" : "slot"}>
      <span className="slot__label">{label}</span>

      <label
        className={
          dragging
            ? "dropzone dropzone--dragging dropzone--compact"
            : "dropzone dropzone--compact"
        }
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          take(event.dataTransfer.files);
        }}
      >
        {value ? (
          <>
            <img className="slot__preview" src={value.preview} alt={label} />
            <span className="dropzone__title">
              <Icon name="check" size={15} /> Uploaded
            </span>
            <span className="dropzone__hint">Tap to replace</span>
          </>
        ) : (
          <>
            <span className="dropzone__icon">
              <Icon name="card" size={22} />
            </span>
            <span className="dropzone__title">Tap to upload</span>
            <span className="dropzone__hint">
              {hint || `PNG, JPEG, GIF or WEBP · up to ${MAX_FILE_MB} MB`}
            </span>
          </>
        )}

        <input
          className="dropzone__input"
          type="file"
          accept={ACCEPT_ATTR}
          onChange={(event) => {
            take(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {value && (
        <button type="button" className="link-btn slot__clear" onClick={onClear}>
          Remove
        </button>
      )}
      {message && <em className="error-text">{message}</em>}
    </div>
  );
}
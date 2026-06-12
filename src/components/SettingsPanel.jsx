import { useRef, useState } from "react";

// localStorage keys backed up / restored by export & import. Object-shaped keys
// hold per-week maps; the rest hold arrays.
const BACKUP_KEYS = [
  { key: "mealsByWeek", shape: "object" },
  { key: "shoppingItemsByWeek", shape: "object" },
  { key: "shoppingListMetaByWeek", shape: "object" },
  { key: "staples", shape: "array" },
  { key: "inventory", shape: "array" },
  { key: "recipes", shape: "array" },
];

function isPlainObject(value) {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

// A backup is valid when it is an object and every key it does contain matches
// the expected array / object shape. Missing keys are allowed (older backups).
function validateBackup(parsed) {
  if (!isPlainObject(parsed)) return false;

  const presentKeys = BACKUP_KEYS.filter(({ key }) =>
    Object.prototype.hasOwnProperty.call(parsed, key)
  );

  if (presentKeys.length === 0) return false;

  return presentKeys.every(({ key, shape }) =>
    shape === "array"
      ? Array.isArray(parsed[key])
      : isPlainObject(parsed[key])
  );
}

function SettingsPanel({
  onImport,
  user,
  cloud,
  onSignOut,
  resetStockToStarterList,
  onResetWelcome,
}) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null);

  function exportData() {
    const backup = {};

    BACKUP_KEYS.forEach(({ key }) => {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        backup[key] = JSON.parse(saved);
      }
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `meal-planner-backup-${today}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setStatus({ tone: "ok", message: "Backup downloaded." });
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    // Allow re-importing the same file twice in a row.
    event.target.value = "";

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      let parsed;

      try {
        parsed = JSON.parse(reader.result);
      } catch {
        setStatus({
          tone: "error",
          message: "That file isn't valid JSON.",
        });
        return;
      }

      if (!validateBackup(parsed)) {
        setStatus({
          tone: "error",
          message: "That file doesn't look like a meal planner backup.",
        });
        return;
      }

      const shouldImport = window.confirm(
        "Importing this backup will overwrite all current meals, shopping lists, stock and recipes on this device. Continue?"
      );

      if (!shouldImport) {
        setStatus(null);
        return;
      }

      onImport(parsed);
      setStatus({ tone: "ok", message: "Backup restored." });
    };

    reader.onerror = () => {
      setStatus({ tone: "error", message: "Couldn't read that file." });
    };

    reader.readAsText(file);
  }

  return (
    <div className="settings-panel">
      {cloud && user && (
        <section className="settings-group">
          <strong>Account</strong>
          <p className="small-text">
            Signed in as {user.email || "your account"}. Your data syncs across
            your devices automatically.
          </p>

          <div className="settings-actions">
            <button type="button" className="secondary" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </section>
      )}

      <details className="settings-advanced">
        <summary>Advanced</summary>

        <section className="settings-group">
          <strong>Export &amp; import data</strong>
          <p className="small-text">
            {cloud
              ? "Your data is backed up to your account and synced across your devices automatically. You can still export a manual snapshot, or import one to restore or move data."
              : "Export a snapshot of your data to a file, or import one to restore it."}
          </p>

          <div className="settings-actions">
            <button type="button" className="secondary" onClick={exportData}>
              Export data
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Import data
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="settings-file-input"
              onChange={handleFileChange}
            />
          </div>

          {status && (
            <p
              className={`small-text settings-status ${
                status.tone === "error" ? "settings-status-error" : ""
              }`}
              role="status"
            >
              {status.message}
            </p>
          )}
        </section>

        {resetStockToStarterList && (
          <section className="settings-group">
            <strong>Restore default stock list</strong>
            <p className="small-text">
              Replace your stock list with the app's default set. Removes any
              custom stock items and marks the default items as in stock.
            </p>

            <div className="settings-actions">
              <button
                type="button"
                className="secondary"
                onClick={resetStockToStarterList}
              >
                Restore default stock list
              </button>
            </div>
          </section>
        )}

        <section className="settings-group">
          <strong>Welcome guide</strong>
          <p className="small-text">
            Re-show the getting started card on the home screen.
          </p>

          <div className="settings-actions">
            <button
              type="button"
              className="secondary"
              onClick={onResetWelcome}
            >
              Reset welcome card
            </button>
          </div>
        </section>
      </details>
    </div>
  );
}

export default SettingsPanel;

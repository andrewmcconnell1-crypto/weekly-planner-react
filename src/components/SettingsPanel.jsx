import { useRef, useState } from "react";
import {
  UserCog,
  Users,
  ShoppingBasket,
  Utensils,
  Minus,
  Plus,
  DatabaseBackup,
  RotateCcw,
  History,
  LifeBuoy,
  Share2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Download,
  Check,
} from "lucide-react";

import HouseholdSettings from "./HouseholdSettings";
import AccountSettings from "./AccountSettings";
import ProfileAvatar from "./ProfileAvatar";
import SettingsSection from "./SettingsSection";
import { profileIdentity } from "../utils/profile";
import { appBaseUrl } from "../lib/household";

const APP_VERSION = "1.0.0";

// localStorage keys backed up / restored by export & import. Object-shaped keys
// hold per-week maps; the rest hold arrays.
const BACKUP_KEYS = [
  { key: "mealsByWeek", shape: "object" },
  { key: "shoppingItemsByWeek", shape: "object" },
  { key: "shoppingListMetaByWeek", shape: "object" },
  { key: "removalAcksByWeek", shape: "object" },
  { key: "recurringCheckedByWeek", shape: "object" },
  { key: "shoppingChecked", shape: "object" },
  { key: "manualShoppingItems", shape: "array" },
  { key: "staples", shape: "array" },
  { key: "inventory", shape: "array" },
  { key: "recipes", shape: "array" },
  { key: "settings", shape: "object" },
];

// "a" | "a and b" | "a, b and c"
function formatList(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

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
  guest,
  household,
  pendingJoinCode,
  onJoinedHousehold,
  onUpdateName,
  onUpdatePassword,
  onSignOut,
  keepStandingList = true,
  defaultServings = 4,
  onSetDefaultServings,
  theme = "system",
  onSetTheme,
  install,
  onSetKeepStandingList,
  onOpenShoppingHelp,
  resetStockToStarterList,
  resetStaplesToStarterList,
  getRecoverySnapshots,
  onRestoreSnapshot,
  onResetWelcome,
  onReplayTour,
}) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  // Read the recovery points once when the panel opens; refresh after a restore.
  const [snapshots, setSnapshots] = useState(
    () => getRecoverySnapshots?.() ?? []
  );

  async function shareApp() {
    const url = appBaseUrl();
    const text = "Weekly meal planner — plan meals and build a shopping list.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Weekly meal planner", text, url });
        return;
      } catch {
        // Cancelled or unsupported — fall back to copying the link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied.");
      window.setTimeout(() => setShareStatus(null), 2000);
    } catch {
      // Clipboard blocked; nothing else to do.
    }
  }

  function handleRestoreSnapshot(snapshot) {
    const when = new Date(snapshot.takenAt).toLocaleString();
    const ok = window.confirm(
      `Restore this recovery point from ${when}? It replaces your current meals, lists, stock and recipes with that saved copy.`
    );
    if (!ok) return;
    if (onRestoreSnapshot(snapshot.id)) {
      setSnapshots(getRecoverySnapshots?.() ?? []);
      setStatus({ tone: "ok", message: "Recovery point restored." });
    }
  }

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
        "Restore this backup? Each section it contains (meals, shopping lists, stock, recipes) replaces what you have now. Sections the backup doesn't have are left untouched."
      );

      if (!shouldImport) {
        setStatus(null);
        return;
      }

      const result = onImport(parsed);
      const kept = result?.kept ?? [];
      setStatus({
        tone: "ok",
        message:
          kept.length > 0
            ? `Backup restored. Your ${formatList(kept)} ${
                kept.length === 1 ? "wasn't" : "weren't"
              } in the backup, so ${
                kept.length === 1 ? "it was" : "they were"
              } kept as-is.`
            : "Backup restored.",
      });
    };

    reader.onerror = () => {
      setStatus({ tone: "error", message: "Couldn't read that file." });
    };

    reader.readAsText(file);
  }

  const identity = profileIdentity(user, guest);
  const accountStatus = cloud
    ? "Synced across your devices"
    : guest
      ? "Exploring without an account — changes aren't saved"
      : "Saved on this device";

  return (
    <div className="settings-panel">
      <section className="settings-profile">
        <ProfileAvatar identity={identity} size="lg" />

        <div className="settings-profile-main">
          <strong className="settings-profile-name">
            {identity.displayName || identity.email || identity.name}
          </strong>
          {identity.displayName && identity.email && (
            <span className="settings-profile-email">{identity.email}</span>
          )}
          <span className="settings-profile-status">{accountStatus}</span>
        </div>

        {cloud && (
          <button type="button" className="secondary" onClick={onSignOut}>
            Sign out
          </button>
        )}
      </section>

      {cloud && user && onUpdateName && (
        <SettingsSection
          icon={UserCog}
          title="Account"
          subtitle="Your name and password"
        >
          <AccountSettings
            user={user}
            onUpdateName={onUpdateName}
            onUpdatePassword={onUpdatePassword}
          />
        </SettingsSection>
      )}

      {cloud && household && (
        <SettingsSection
          icon={Users}
          title="Household sharing"
          subtitle="Share one plan with your partner"
          defaultOpen={Boolean(pendingJoinCode)}
        >
          <HouseholdSettings
            household={household}
            cloud={cloud}
            pendingJoinCode={pendingJoinCode}
            onJoined={onJoinedHousehold}
          />
        </SettingsSection>
      )}

      {onSetKeepStandingList && (
        <SettingsSection
          icon={ShoppingBasket}
          title="Shopping"
          subtitle="How your list is built"
        >
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={keepStandingList}
              onChange={(event) =>
                onSetKeepStandingList(event.target.checked)
              }
            />
            <span>
              <span className="settings-toggle-title">
                I use a saved grocery list
              </span>
              <span className="small-text">
                e.g. a saved Woolworths or Coles list your recurring buys live
                on. The Shop page then shows a per-trip “Using your saved list?”
                switch — on for an online order (your recurring buys stay off the
                list and you get a “take off your saved list” section), off when
                shopping fresh (recurring buys are added to the list). Turn this
                off if you don't keep a saved list — recurring buys are then
                always part of the one list.
              </span>
            </span>
          </label>

          {onOpenShoppingHelp && (
            <div className="settings-actions">
              <button
                type="button"
                className="secondary"
                onClick={onOpenShoppingHelp}
              >
                How shopping works
              </button>
            </div>
          )}
        </SettingsSection>
      )}

      {onSetTheme && (
        <SettingsSection
          icon={Palette}
          title="Appearance"
          subtitle="Light, dark or match your device"
        >
          <div
            className="theme-toggle"
            role="radiogroup"
            aria-label="Theme"
          >
            {[
              { value: "light", label: "Light", Icon: Sun },
              { value: "dark", label: "Dark", Icon: Moon },
              { value: "system", label: "System", Icon: Monitor },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                className={`theme-option ${theme === value ? "active" : ""}`}
                onClick={() => onSetTheme(value)}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </SettingsSection>
      )}

      {onSetDefaultServings && (
        <SettingsSection
          icon={Utensils}
          title="Planner"
          subtitle="Defaults for new recipes"
        >
          <div className="settings-stepper-row">
            <span className="settings-stepper-label">
              <span className="settings-toggle-title">Default servings</span>
              <span className="small-text">
                How many people a new recipe serves to start with.
              </span>
            </span>

            <span className="settings-stepper" role="group" aria-label="Default servings">
              <button
                type="button"
                className="settings-stepper-button"
                aria-label="Fewer servings"
                disabled={defaultServings <= 1}
                onClick={() => onSetDefaultServings(defaultServings - 1)}
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className="settings-stepper-value">{defaultServings}</span>
              <button
                type="button"
                className="settings-stepper-button"
                aria-label="More servings"
                disabled={defaultServings >= 99}
                onClick={() => onSetDefaultServings(defaultServings + 1)}
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </span>
          </div>
        </SettingsSection>
      )}

      <SettingsSection
        icon={DatabaseBackup}
        title="Backup & data"
        subtitle="Export or import a copy"
      >
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
      </SettingsSection>

      {(resetStockToStarterList || resetStaplesToStarterList) && (
        <SettingsSection
          icon={RotateCcw}
          title="Restore defaults"
          subtitle="Reset stock or recurring buys"
        >
          {resetStockToStarterList && (
            <div className="settings-reset-block">
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
            </div>
          )}

          {resetStaplesToStarterList && (
            <div className="settings-reset-block">
              <p className="small-text">
                Replace your recurring buys with the app's default weekly list.
                Removes any custom recurring items.
              </p>
              <div className="settings-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={resetStaplesToStarterList}
                >
                  Restore default recurring buys
                </button>
              </div>
            </div>
          )}
        </SettingsSection>
      )}

      {snapshots.length > 0 && (
        <SettingsSection
          icon={History}
          title="Recovery points"
          subtitle="Roll back an accidental change"
        >
          <p className="small-text">
            Snapshots saved on this device when you open the app and before any
            restore or reset. Roll back to one to undo an accidental change.
          </p>

          <ul className="recovery-list">
            {snapshots.map((snapshot) => (
              <li key={snapshot.id} className="recovery-row">
                <span className="recovery-row-main">
                  <strong>{snapshot.label}</strong>
                  <span className="small-text">
                    {new Date(snapshot.takenAt).toLocaleString()}
                  </span>
                </span>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleRestoreSnapshot(snapshot)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}

      <SettingsSection
        icon={LifeBuoy}
        title="About & help"
        subtitle={`Weekly meal planner · v${APP_VERSION}`}
      >
        <p className="small-text">
          Replay the walkthrough, re-show the getting-started card, or share the
          app with someone.
        </p>

        <div className="settings-actions">
          {onReplayTour && (
            <button type="button" className="secondary" onClick={onReplayTour}>
              Take the tour again
            </button>
          )}

          <button type="button" className="secondary" onClick={onResetWelcome}>
            Reset welcome card
          </button>

          <button
            type="button"
            className="secondary with-icon"
            onClick={shareApp}
          >
            <Share2 size={15} aria-hidden="true" />
            Share this app
          </button>

          {install && !install.isStandalone && (
            <button
              type="button"
              className="secondary with-icon"
              aria-expanded={
                install.canPromptInstall ? undefined : showInstallHelp
              }
              onClick={() => {
                if (install.canPromptInstall) {
                  install.promptInstall();
                } else {
                  setShowInstallHelp((value) => !value);
                }
              }}
            >
              <Download size={15} aria-hidden="true" />
              Install app
            </button>
          )}
        </div>

        {install?.isStandalone && (
          <p className="small-text settings-installed">
            <Check size={15} aria-hidden="true" />
            Installed on this device
          </p>
        )}

        {showInstallHelp && install && !install.isStandalone && (
          <p className="small-text settings-status">
            {install.isIOS
              ? "In Safari, tap the Share button, then choose “Add to Home Screen.”"
              : "Open your browser menu and choose “Install app” (or “Add to Home screen”)."}
          </p>
        )}

        {shareStatus && (
          <p className="small-text settings-status" role="status">
            {shareStatus}
          </p>
        )}

        <p className="small-text settings-version">Version {APP_VERSION}</p>
      </SettingsSection>
    </div>
  );
}

export default SettingsPanel;

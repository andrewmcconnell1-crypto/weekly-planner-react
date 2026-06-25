import { lazy, Suspense } from "react";
import { ChevronLeft } from "lucide-react";

import ErrorBoundary from "./ErrorBoundary";
import PanelError from "./PanelError";

const SettingsPanel = lazy(() => import("./SettingsPanel"));

export default function SettingsScreen({
  closeSettings,
  onImport,
  user,
  cloud,
  onSignOut,
  keepStandingList,
  onSetKeepStandingList,
  onOpenShoppingHelp,
  resetStockToStarterList,
  resetStaplesToStarterList,
  getRecoverySnapshots,
  onRestoreSnapshot,
  onResetWelcome,
}) {
  return (
    <section className="screen settings-screen">
      <button type="button" className="back-button" onClick={closeSettings}>
        <ChevronLeft size={18} aria-hidden="true" />
        Back
      </button>

      <ErrorBoundary fallback={(reset) => <PanelError onRetry={reset} />}>
        <Suspense fallback={null}>
          <SettingsPanel
            onImport={onImport}
            user={user}
            cloud={cloud}
            onSignOut={onSignOut}
            keepStandingList={keepStandingList}
            onSetKeepStandingList={onSetKeepStandingList}
            onOpenShoppingHelp={onOpenShoppingHelp}
            resetStockToStarterList={resetStockToStarterList}
            resetStaplesToStarterList={resetStaplesToStarterList}
            getRecoverySnapshots={getRecoverySnapshots}
            onRestoreSnapshot={onRestoreSnapshot}
            onResetWelcome={onResetWelcome}
          />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}

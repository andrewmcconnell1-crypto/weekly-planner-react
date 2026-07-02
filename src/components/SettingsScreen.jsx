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
  guest,
  household,
  pendingJoinCode,
  onJoinedHousehold,
  onUpdateName,
  onUpdatePassword,
  onSignOut,
  keepStandingList,
  onSetKeepStandingList,
  defaultServings,
  onSetDefaultServings,
  theme,
  onSetTheme,
  install,
  onOpenShoppingHelp,
  resetStockToStarterList,
  resetStaplesToStarterList,
  getRecoverySnapshots,
  onRestoreSnapshot,
  onResetWelcome,
  onReplayTour,
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
            guest={guest}
            household={household}
            pendingJoinCode={pendingJoinCode}
            onJoinedHousehold={onJoinedHousehold}
            onUpdateName={onUpdateName}
            onUpdatePassword={onUpdatePassword}
            onSignOut={onSignOut}
            keepStandingList={keepStandingList}
            onSetKeepStandingList={onSetKeepStandingList}
            defaultServings={defaultServings}
            onSetDefaultServings={onSetDefaultServings}
            theme={theme}
            onSetTheme={onSetTheme}
            install={install}
            onOpenShoppingHelp={onOpenShoppingHelp}
            resetStockToStarterList={resetStockToStarterList}
            resetStaplesToStarterList={resetStaplesToStarterList}
            getRecoverySnapshots={getRecoverySnapshots}
            onRestoreSnapshot={onRestoreSnapshot}
            onResetWelcome={onResetWelcome}
            onReplayTour={onReplayTour}
          />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}

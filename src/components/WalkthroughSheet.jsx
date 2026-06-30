import { useEffect, useRef, useState } from "react";
import { X, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { useDialogFocus } from "../hooks/useDialogFocus";
import { WALKTHROUGH_STEPS } from "./walkthroughSteps";

const SWIPE_THRESHOLD = 48;

// An animated, swipeable getting-started tour. Each step pairs a small looping
// "demo" animation (WalkthroughScenes) with a line of copy; the active scene is
// keyed on the step index so its reveal animation replays on every navigation.
// Modelled on the other bottom sheets: backdrop/sheet markup, focus trap, scroll
// lock, Escape, and a 220ms exit animation before unmount.
function WalkthroughSheet({ onClose, onStartPlanning }) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const dialogRef = useRef(null);
  const touchStartX = useRef(null);

  useDialogFocus(dialogRef);

  const total = WALKTHROUGH_STEPS.length;
  const current = WALKTHROUGH_STEPS[step];
  const isLast = step === total - 1;
  const Scene = current.Scene;

  function requestClose() {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  }

  function goNext() {
    if (isLast) {
      onStartPlanning();
      return;
    }
    setStep((value) => Math.min(value + 1, total - 1));
  }

  function goBack() {
    setStep((value) => Math.max(value - 1, 0));
  }

  // Capture-phase Escape + arrow keys, with stopImmediatePropagation so that if
  // this sheet is ever stacked over another, the keys act only on this one.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        requestClose();
      } else if (event.key === "ArrowRight") {
        event.stopImmediatePropagation();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.stopImmediatePropagation();
        goBack();
      }
    }

    window.addEventListener("keydown", handleKey, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isLast]);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  function onTouchStart(event) {
    touchStartX.current = event.changedTouches[0].clientX;
  }

  function onTouchEnd(event) {
    if (touchStartX.current == null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta <= -SWIPE_THRESHOLD) goNext();
    else if (delta >= SWIPE_THRESHOLD) goBack();
  }

  return (
    <div
      className={`sheet-backdrop ${closing ? "closing" : ""}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`sheet walkthrough-sheet ${closing ? "closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="How it works"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>How it works</strong>
            <span>A quick tour</span>
          </div>

          <button
            type="button"
            className="sheet-close"
            aria-label="Close"
            onClick={requestClose}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div
          className="sheet-body walkthrough-body"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="walkthrough-stage" key={current.id}>
            <Scene />
          </div>

          <div className="walkthrough-copy">
            <p className="section-kicker">{current.kicker}</p>
            <h3>{current.title}</h3>
            <p>{current.body}</p>
          </div>
        </div>

        <div className="walkthrough-footer">
          <div
            className="walkthrough-dots"
            role="tablist"
            aria-label="Tour steps"
          >
            {WALKTHROUGH_STEPS.map((item, index) => (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={index === step}
                aria-label={`Step ${index + 1}: ${item.title}`}
                className={`walkthrough-dot ${index === step ? "active" : ""}`}
                onClick={() => setStep(index)}
              />
            ))}
          </div>

          <div className="walkthrough-actions">
            <button
              type="button"
              className="secondary with-icon"
              onClick={step === 0 ? requestClose : goBack}
            >
              {step === 0 ? (
                "Skip"
              ) : (
                <>
                  <ArrowLeft size={15} aria-hidden="true" />
                  Back
                </>
              )}
            </button>

            <button
              type="button"
              className="primary-button with-icon"
              onClick={goNext}
            >
              {isLast ? (
                <>
                  <Sparkles size={15} aria-hidden="true" />
                  Start planning
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={15} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalkthroughSheet;

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { useDialogFocus } from "../hooks/useDialogFocus";

// Explains the (non-obvious) shopping model: stock vs recurring buys vs meals,
// how the generated list is a "top-up" of a standing grocery list, and the
// options for people who shop differently.
function ShoppingHelpSheet({ keepStandingList = true, onClose }) {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const dialogRef = useRef(null);

  useDialogFocus(dialogRef);

  // Play the sheet's exit animation, then unmount.
  function requestClose() {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  }

  // Lock background scroll and close on Escape while the sheet is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") requestClose();
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // Clear any pending close timer if the sheet unmounts first.
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  return (
    <div
      className={`sheet-backdrop ${closing ? "closing" : ""}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`sheet ${closing ? "closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="How shopping works"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>How shopping works</strong>
            <span>Where your list comes from</span>
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

        <div className="sheet-body help-body">
          <p>
            The app builds your weekly shopping list from three things you set
            up once and keep tweaking:
          </p>

          <ul className="help-list">
            <li>
              <strong>Meals</strong> — the recipes you plan for the week. Their
              ingredients are added to the list.
            </li>
            <li>
              <strong>Stock</strong> — staples you keep at home (spices, oils,
              tins). Anything in stock is skipped, so you don't re-buy it. When
              you run out, mark it out of stock and it joins the list as a
              restock.
            </li>
            <li>
              <strong>Recurring buys</strong> — things you get most weeks (milk,
              bread, fruit). How these show up depends on how you're shopping
              this trip (see below).
            </li>
          </ul>

          <p>
            It's one list spanning this week and next, ordered by{" "}
            <strong>Priority</strong> (urgent at the top) — or switch to{" "}
            <strong>By aisle</strong> for one flat list to walk the shop.
          </p>

          <h3 className="help-heading">Two ways to shop</h3>

          <p>
            <strong>Using my saved list</strong> (e.g. an online Woolworths or
            Coles order). Your recurring buys are already on that saved list, so
            they're left off here. Instead you get a{" "}
            <strong>“Take off your saved list”</strong> section — the recurring
            items to remove this week because you've paused them or you're
            already covered by stock.
          </p>

          <p>
            <strong>Shopping fresh</strong> (in store, or anywhere you're not
            using a saved list). Now your recurring buys are added to the list so
            you pick up everything in one go.
          </p>

          <p className="small-text help-current">
            {keepStandingList
              ? "You have a saved list, so the Shop page shows the Using saved list / Shopping fresh toggle. Switch it per trip — it remembers your last choice."
              : "You don't keep a saved list, so every shop is one complete list with recurring buys included. You can change this in Settings."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShoppingHelpSheet;

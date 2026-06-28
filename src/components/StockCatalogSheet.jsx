import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";

import { ingredientCatalog } from "../data/ingredientCatalog";
import { catalogItemStatus, groupCatalogByAisle } from "../utils/catalogUtils";
import { normaliseItemName } from "../utils/itemUtils";
import { useDialogFocus } from "../hooks/useDialogFocus";

// Browse the common-items catalog and activate the ones you keep, instead of
// typing each by hand or adding the whole starter list. Search-first, grouped by
// aisle; each row shows its status (in stock / out / not added) and a + Add on
// the ones you don't have yet.
function StockCatalogSheet({ inventory = [], onActivate, onClose }) {
  const [closing, setClosing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const closeTimerRef = useRef(null);
  const dialogRef = useRef(null);

  useDialogFocus(dialogRef);

  function requestClose() {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 220);
  }

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

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  const search = normaliseItemName(searchText);
  const matches = search
    ? ingredientCatalog.filter((item) =>
        normaliseItemName(item.name).includes(search)
      )
    : ingredientCatalog;
  const groups = groupCatalogByAisle(matches);

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
        aria-label="Browse common items"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <strong>Common items</strong>
            <span>Add the ones you keep — in or out of stock</span>
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

        <div className="sheet-body catalog-body">
          <input
            type="text"
            className="catalog-search"
            placeholder="Search common items..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          {groups.length === 0 ? (
            <p className="empty-state">No matching items.</p>
          ) : (
            groups.map((group) => (
              <div className="catalog-aisle" key={group.aisle}>
                <p className="section-kicker">{group.aisle}</p>

                <ul className="clean-list">
                  {group.items.map((item) => {
                    const status = catalogItemStatus(item.name, inventory);

                    return (
                      <li key={item.name} className="catalog-row">
                        <span className="catalog-name">{item.name}</span>

                        {status === "off" ? (
                          <span className="catalog-actions">
                            <button
                              type="button"
                              className="catalog-add"
                              aria-label={`Add ${item.name} as in stock`}
                              onClick={() =>
                                onActivate(item.name, item.category, true)
                              }
                            >
                              <Plus size={15} aria-hidden="true" />
                              In stock
                            </button>

                            <button
                              type="button"
                              className="catalog-add-out"
                              aria-label={`Add ${item.name} as out of stock`}
                              onClick={() =>
                                onActivate(item.name, item.category, false)
                              }
                            >
                              Out
                            </button>
                          </span>
                        ) : (
                          <span
                            className={`catalog-status catalog-status-${status}`}
                          >
                            {status === "in" ? (
                              <>
                                <Check size={14} aria-hidden="true" />
                                In stock
                              </>
                            ) : (
                              "Out — on your list"
                            )}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default StockCatalogSheet;

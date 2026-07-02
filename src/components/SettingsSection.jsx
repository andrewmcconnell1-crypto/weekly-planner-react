import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

// A collapsible settings card: an icon + title summary row that expands to
// reveal its content with a smooth height transition. Controlled (rather than a
// native <details>) so the open/close animates via a grid-rows transition,
// which native disclosure can't do cross-browser.
function SettingsSection({ icon: Icon, title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();

  return (
    <section className={`settings-section ${open ? "open" : ""}`}>
      <button
        type="button"
        className="settings-section-summary"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((value) => !value)}
      >
        {Icon && (
          <span className="settings-section-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}

        <span className="settings-section-titles">
          <strong>{title}</strong>
          {subtitle && <span className="settings-section-sub">{subtitle}</span>}
        </span>

        <ChevronDown
          className="settings-section-chevron"
          size={18}
          aria-hidden="true"
        />
      </button>

      <div className="settings-section-reveal" id={regionId} role="region">
        <div className="settings-section-body">
          <div className="settings-section-inner">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default SettingsSection;

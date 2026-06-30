import { ChevronDown } from "lucide-react";

// A collapsible settings card: an icon + title summary row that expands to
// reveal its content. Native <details> so it's accessible and needs no state.
function SettingsSection({ icon: Icon, title, subtitle, defaultOpen = false, children }) {
  return (
    <details className="settings-section" open={defaultOpen}>
      <summary className="settings-section-summary">
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
      </summary>

      <div className="settings-section-body">{children}</div>
    </details>
  );
}

export default SettingsSection;

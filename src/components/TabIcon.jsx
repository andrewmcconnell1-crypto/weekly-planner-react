// The bottom nav's four icons, drawn in the same 1.7-stroke hand style as the
// recipe glyphs (DishGlyph) so the app's most-seen row of pixels belongs to
// its own visual family rather than a stock icon set. The Kitchen tab reuses
// the pot from the dish glyphs on purpose — it's the same object everywhere.

const TABS = {
  home: (
    <>
      <path d="M4 11.3 12 4.2l8 7.1" />
      <path d="M6.2 10v8.3a2 2 0 0 0 2 2h7.6a2 2 0 0 0 2-2V10" />
      <path d="M10.3 20.3v-4.9a1.7 1.7 0 0 1 3.4 0v4.9" />
    </>
  ),
  plan: (
    <>
      <rect x="4" y="6" width="16" height="14.3" rx="2.6" />
      <path d="M8.2 3.7v3.6M15.8 3.7v3.6M4 10.8h16" />
      <circle cx="8.6" cy="14.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="14.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="17.6" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.6" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  recipes: (
    <>
      <path d="M12 6.6v13.2" />
      <path d="M12 6.6C10 5.1 6.8 5 4.6 5.7v12.5c2.2-0.7 5.4-0.6 7.4 0.9" />
      <path d="M12 6.6c2-1.5 5.2-1.6 7.4-0.9v12.5c-2.2-0.7-5.4-0.6-7.4 0.9" />
    </>
  ),
  shop: (
    <>
      <path d="M4.5 9.7h15l-1.7 8.7a2.4 2.4 0 0 1-2.4 1.9H8.6a2.4 2.4 0 0 1-2.4-1.9Z" />
      <path d="M8.6 9.7 12 3.9l3.4 5.8" />
      <path d="M9.7 13.4l.4 3.4M14.3 13.4l-.4 3.4M12 13.4v3.4" />
    </>
  ),
  kitchen: (
    <>
      <path d="M4.5 11.5h15" />
      <path d="M6 11.5v3.5a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-3.5" />
      <path d="M2.5 11.5h2M19.5 11.5h2" />
      <path d="M7 11.5a5 3.4 0 0 1 10 0" />
      <path d="M12 6.6v-1" />
    </>
  ),
};

function TabIcon({ tab }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TABS[tab]}
    </svg>
  );
}

export default TabIcon;

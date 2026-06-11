function WeekControls({
  activePreset,
  onThisWeek,
  onNextWeekPreset,
  onPreviousWeek,
  onNextWeek,
}) {
  return (
    <div className="week-controls">
      <button
        type="button"
        className="week-arrow"
        aria-label="Previous week"
        onClick={onPreviousWeek}
      >
        ‹
      </button>

      <div className="week-preset-tabs" aria-label="Week shortcuts">
        <button
          type="button"
          className={activePreset === "current" ? "active" : ""}
          onClick={onThisWeek}
        >
          This week
        </button>

        <button
          type="button"
          className={activePreset === "next" ? "active" : ""}
          onClick={onNextWeekPreset}
        >
          Next week
        </button>
      </div>

      <button
        type="button"
        className="week-arrow"
        aria-label="Next week"
        onClick={onNextWeek}
      >
        ›
      </button>
    </div>
  );
}

export default WeekControls;

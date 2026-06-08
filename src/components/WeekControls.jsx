function WeekControls({
  activePreset,
  onThisWeek,
  onNextWeekPreset,
  onPreviousWeek,
  onNextWeek,
}) {
  return (
    <div className="week-controls">
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

      <div className="week-stepper" aria-label="Move by one week">
        <button type="button" className="secondary" onClick={onPreviousWeek}>
          Back 1 week
        </button>

        <button type="button" className="secondary" onClick={onNextWeek}>
          Forward 1 week
        </button>
      </div>
    </div>
  );
}

export default WeekControls;

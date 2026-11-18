import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import {
  buildSchedule,
  fmtTime,
  minutesLabel,
  totalDuration,
} from "../lib/itinerary";

export default function DayPlan() {
  const {
    places,
    itinerary,
    startTime,
    setStartTime,
    removeFromPlan,
    clearPlan,
    moveItem,
    setDuration,
    applyRecommendedOrder,
    travelMinutes,
  } = useApp();

  const items = useMemo(
    () =>
      itinerary
        .map((it) => ({
          ...it,
          place: places.find((p) => p.id === it.placeId),
        }))
        .filter((it) => it.place),
    [itinerary, places]
  );

  const schedule = useMemo(
    () => buildSchedule(items, startTime, travelMinutes),
    [items, startTime, travelMinutes]
  );

  const total = useMemo(() => totalDuration(schedule), [schedule]);

  const recommend = () => {
    applyRecommendedOrder();
  };

  const printable = () => {
    window.print();
  };

  return (
    <div className="page plan-page">
      <div className="page-title">
        <h1>My day plan</h1>
        <p>Build an ordered, time-aware itinerary for a single day.</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-emoji">🗺️</div>
          <h3>Your day plan is empty</h3>
          <p>Add a place from the catalogue to start planning your trip.</p>
          <Link to="/catalogue" className="btn btn-primary">
            Browse the catalogue
          </Link>
        </div>
      ) : (
        <>
          <div className="plan-controls glass">
            <div className="start-control">
              <label htmlFor="start">Day start time</label>
              <input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="plan-summary">
              <span className="summary-item">
                <strong>{items.length}</strong> stops
              </span>
              <span className="summary-item">
                <strong>{minutesLabel(total)}</strong> total
              </span>
              {total > 720 && (
                <span className="summary-warn">⚠️ Exceeds 12 hours</span>
              )}
            </div>
            <div className="plan-actions">
              <button className="btn btn-outline btn-sm" onClick={recommend}>
                ✨ Recommend order
              </button>
              <button className="btn btn-outline btn-sm" onClick={printable}>
                🖨 Print / export
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (confirm("Clear the entire itinerary?")) clearPlan();
                }}
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="plan-table glass">
            <div className="plan-header">
              <span>#</span>
              <span>Stop</span>
              <span>Duration</span>
              <span>Travel</span>
              <span>Start</span>
              <span>End</span>
              <span>Reorder</span>
              <span></span>
            </div>

            {schedule.map((it, i) => (
              <div className="plan-row" key={it.placeId}>
                <span className="seq">{i + 1}</span>
                <span className="stop">
                  {it.place.image ? (
                    <img src={it.place.image} alt="" style={{width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px'}} />
                  ) : (
                    <span className="stop-emoji">{it.place.emoji}</span>
                  )}
                  <span>
                    <Link to={`/place/${it.placeId}`} className="stop-name">
                      {it.place.name}
                    </Link>
                    <span className="stop-meta">
                      {it.place.category} · {it.place.distanceKm} km
                    </span>
                  </span>
                </span>
                <span className="editable-dur">
                  <input
                    type="number"
                    min={10}
                    max={480}
                    value={it.durationMin}
                    onChange={(e) => setDuration(it.placeId, e.target.value)}
                  />
                  <span>min</span>
                </span>
                <span className="travel">
                  {it.travel > 0 ? `~${it.travel} min` : "—"}
                  <span className="est-note">est.</span>
                </span>
                <span>{fmtTime(it.start)}</span>
                <span>{fmtTime(it.end)}</span>
                <span className="reorder">
                  <button
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveItem(i, 1)}
                    disabled={i === schedule.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </span>
                <span className="row-remove">
                  <button
                    className="icon-btn"
                    onClick={() => removeFromPlan(it.placeId)}
                    aria-label="Remove stop"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>

          <p className="est-disclaimer">
            Travel times are estimates for planning only and not guaranteed ETAs.
          </p>
        </>
      )}
    </div>
  );
}

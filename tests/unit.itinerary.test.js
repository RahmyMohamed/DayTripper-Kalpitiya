/**
 * DayTripper Kalpitiya — unit tests for the pure itinerary engine.
 * Run with: node --test tests/
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  travelMinutes,
  recommendedOrder,
  minutesLabel,
  fmtTime,
  parseClock,
  buildSchedule,
  totalDuration,
} from "../src/lib/itinerary.js";

const places = [
  { id: "a", distanceKm: 1.0 },
  { id: "b", distanceKm: 5.5 },
  { id: "c", distanceKm: 12.0 },
  { id: "d", distanceKm: 2.5 },
];
const byId = (id) => places.find((p) => p.id === id);

test("TC-U-01 travelMinutes scales distance at 0.5 km/min", () => {
  assert.equal(travelMinutes(0, 5), 10); // 5 km / 0.5 = 10 min
  assert.equal(travelMinutes(0, 12.5), 25);
});

test("TC-U-02 travelMinutes never returns less than the 10-minute floor", () => {
  assert.equal(travelMinutes(3, 3.1), 10);
  assert.equal(travelMinutes(0, 0), 10);
});

test("TC-U-03 travelMinutes is symmetric in the absolute gap", () => {
  assert.equal(travelMinutes(1, 6), travelMinutes(6, 1));
});

test("TC-U-04 recommendedOrder sorts stops by ascending distance", () => {
  assert.deepEqual(recommendedOrder(["c", "a", "d", "b"], byId), [
    "a",
    "d",
    "b",
    "c",
  ]);
});

test("TC-U-05 recommendedOrder does not mutate the input array", () => {
  const input = ["c", "a"];
  recommendedOrder(input, byId);
  assert.deepEqual(input, ["c", "a"]);
});

test("TC-U-06 minutesLabel formats sub-hour, exact hour and mixed durations", () => {
  assert.equal(minutesLabel(45), "45 min");
  assert.equal(minutesLabel(60), "1 h");
  assert.equal(minutesLabel(135), "2 h 15 min");
  assert.equal(minutesLabel(0), "");
});

test("TC-U-07 fmtTime renders 24-hour clock times", () => {
  assert.equal(fmtTime(0), "00:00");
  assert.equal(fmtTime(8 * 60), "08:00");
  assert.equal(fmtTime(8 * 60 + 45), "08:45");
});

test("TC-U-08 parseClock converts 'HH:MM' to minutes since midnight", () => {
  assert.equal(parseClock("08:00"), 480);
  assert.equal(parseClock("13:30"), 810);
});

test("TC-U-09 buildSchedule chains visits with travel gaps and correct start/end", () => {
  const items = [
    { placeId: "a", durationMin: 60, place: places[0] },
    { placeId: "d", durationMin: 45, place: places[3] },
  ];
  const schedule = buildSchedule(items, "08:00");
  assert.equal(schedule[0].travel, 0);
  assert.equal(schedule[0].start, 480);
  assert.equal(schedule[0].end, 540);
  // gap a(1.0 km) -> d(2.5 km) = 1.5 km / 0.5 = 3 min -> floored to 10 min
  assert.equal(schedule[1].travel, 10);
  assert.equal(schedule[1].start, 550);
  assert.equal(schedule[1].end, 595);
});

test("TC-U-10 buildSchedule honours the user start time", () => {
  const items = [{ placeId: "a", durationMin: 30, place: places[0] }];
  const schedule = buildSchedule(items, "13:15");
  assert.equal(schedule[0].start, 795);
  assert.equal(schedule[0].end, 825);
});

test("TC-U-11 totalDuration spans first start to last end", () => {
  const items = [
    { placeId: "a", durationMin: 60, place: places[0] },
    { placeId: "d", durationMin: 45, place: places[3] },
  ];
  const schedule = buildSchedule(items, "08:00");
  assert.equal(totalDuration(schedule), 595 - 480);
  assert.equal(totalDuration([]), 0);
});

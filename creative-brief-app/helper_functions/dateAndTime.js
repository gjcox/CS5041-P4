export const seasons = ["winter", "spring", "summer", "autumn"];

/** Approximate daylight hours taken from https://www.scotlandinfo.eu/daylight-hours-sunrise-and-sunset-times/. Accessed 03/05/2023. */
export const seasonalDawnDusk = [
  { dawn: 8 * 60 + 45, dusk: 16 * 60 + 25 }, // daylight 8:45-16:25 in winter
  { dawn: 6 * 60 + 20, dusk: 20 * 60 + 30 }, // daylight 6:20-20:30 in spring
  { dawn: 5 * 60 + 0, dusk: 22 * 60 + 0 }, // daylight 5:00-22:00 in summer
  { dawn: 7 * 60 + 55, dusk: 18 * 60 + 25 }, // daylight 7:55-18:25 in autumn
];

/**
 * Converts a Date object into a time of day representation as minutes from midnight.
 *
 * @param {Date} date
 * @returns a number between 0 and 1440.
 */
export function getMinuteTime(date) {
  var hours = date.getHours();
  var mins = date.getMinutes();
  return 60 * hours + mins;
}

/**
 * Converts minute time into an HH:mm string.
 *
 * @param {number} minuteTime time measured as minutes since midnight
 * @returns an HH:mm string.
 */
export function getTimeFromMinutes(minuteTime) {
  let hour = "" + Math.round(minuteTime / 60);
  let minutes = "" + (minuteTime % 60);
  return `${hour.padStart(2, 0)}:${minutes.padStart(2, 0)}`;
}

/**
 * Determines what season a month belongs to.
 * N.B. Months and seasons are indexed from 0.
 *
 * @param {number} month a given month.
 * @returns 0 for winter, 1 for spring, 2 for summer and 3 for autumn.
 */
export function getSeason(month) {
  if ([11, 0, 1].includes(month)) {
    return 0; // winter
  } else if ([2, 3, 4].includes(month)) {
    return 1; // spring
  } else if ([5, 6, 7].includes(month)) {
    return 2; // summer
  } else if ([8, 9, 10].includes(month)) {
    return 3; // autumn
  }
}

/**
 *
 * @param {*} season 0, 1, 2, or 3
 * @param {*} time minutes from midnight
 * @param {*} marginOfError hours either side of dawn/dusk
 * @returns
 */
export function checkNearDawnDusk(season, time, marginOfError) {
  let dawn = seasonalDawnDusk[season].dawn;
  let dusk = seasonalDawnDusk[season].dusk;
  if (
    Math.min(Math.abs(time - dawn), Math.abs(time - dusk)) <
    marginOfError * 60
  ) {
    return true;
  }
}

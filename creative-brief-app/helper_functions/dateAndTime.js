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
    let minutes = "" + minuteTime % 60;
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

export const seasons = ['winter', 'spring', 'summer', 'autumn']

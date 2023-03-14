/**
 * Get current time in seconds, formatted to 3 numbers behind commas precision
 *
 * @param {[number, number]} hrtime High resolution time, should be
 * `process.hrtime()`
 * @returns {string} time string, in seconds.
 */
export function toSecond(hrtime: [number, number]): string {
    return (hrtime[0] + hrtime[1] / 1e9).toFixed(3);
}

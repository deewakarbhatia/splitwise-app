function parseAmount(raw) {
    if (raw === null || raw === undefined || raw === '') return null;
    let cleaned = String(raw).replace(/,/g, '').trim();
    let num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    return Math.round(num * 100) / 100;
}
module.exports = { parseAmount };
const NAME_ALIASES = {
  'priya': 'Priya',
  'priya s': 'Priya',
  'rohan': 'Rohan'
};

function normalizeName(rawName) {
  if (!rawName) return null;

  const trimmed = rawName.trim();
  const key = trimmed.toLowerCase();

  return NAME_ALIASES[key] || trimmed;
}

module.exports = { normalizeName };
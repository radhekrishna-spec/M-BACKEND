function splitTextSmart(text, limit = 665) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // EXACT APP SCRIPT SAME
  if (text.length <= limit) {
    return [text];
  }

  const words = text.split(/\s+/);

  let parts = [];
  let buffer = '';

  words.forEach((word) => {
    const candidate = (buffer + ' ' + word).trim();

    if (candidate.length <= limit) {
      buffer = candidate;
    } else {
      if (buffer.trim()) {
        parts.push(buffer.trim());
      }
      buffer = word;
    }
  });

  if (buffer.trim()) {
    parts.push(buffer.trim());
  }

  // EXACT SAME LAST PART REBALANCE LOGIC
  if (parts.length > 1) {
    let last = parts[parts.length - 1];

    if (last.length < limit * 0.3) {
      let prevWords = parts[parts.length - 2].split(' ');

      while (
        prevWords.length &&
        parts[parts.length - 1].length < limit * 0.45 &&
        parts[parts.length - 2].length > limit * 0.65
      ) {
        const moved = prevWords.pop();

        parts[parts.length - 1] = moved + ' ' + parts[parts.length - 1];

        parts[parts.length - 2] = prevWords.join(' ');
      }
    }
  }

  return parts.filter((p) => p.trim().length > 0);
}

module.exports = {
  splitTextSmart,
};

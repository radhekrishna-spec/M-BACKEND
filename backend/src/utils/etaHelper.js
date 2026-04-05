function getPostTimes(queueCount) {
  if (queueCount <= 3) return [9, 13, 21];
  if (queueCount <= 6) return [9, 12, 15, 17, 19, 22];
  if (queueCount <= 10) return [9, 11, 13, 15, 17, 19, 21, 22];

  return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
}

function getEstimatedPostTime(queueAhead) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const slots = getPostTimes(Math.max(queueAhead + 1, 1));

  const nextSlots = slots.filter((hour) => {
    if (hour > currentHour) return true;
    return hour === currentHour && currentMinute <= 5;
  });

  const selectedHour =
    queueAhead < nextSlots.length
      ? nextSlots[queueAhead]
      : slots[queueAhead % slots.length];

  const suffix = selectedHour >= 12 ? 'PM' : 'AM';
  const hour12 = selectedHour > 12 ? selectedHour - 12 : selectedHour;

  return `Around ${hour12}:00 ${suffix}`;
}

module.exports = { getEstimatedPostTime };

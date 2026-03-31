let confessionNo = 0;

async function getNextConfessionNo() {
  confessionNo += 1;
  return confessionNo;
}

module.exports = { getNextConfessionNo };

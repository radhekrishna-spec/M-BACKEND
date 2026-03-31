const { createCanvas } = require('canvas');

async function createSlidePNG(text, confessionNo, partNo) {
  const width = 1080;
  const height = 1350;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';

  ctx.fillText(`Confession #${confessionNo}`, width / 2, 80);

  // confession text
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';

  const lines = wrapText(ctx, text, 850);

  let y = 220;

  for (const line of lines) {
    ctx.fillText(line, width / 2, y);
    y += 55;
  }

  // footer
  ctx.font = '28px Arial';
  ctx.fillText(`Part ${partNo}`, width / 2, height - 60);

  return canvas.toBuffer('image/png');
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const testLine = line + word + ' ';
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && line !== '') {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }

  lines.push(line.trim());

  return lines;
}

module.exports = { createSlidePNG };

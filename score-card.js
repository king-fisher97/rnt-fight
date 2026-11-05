// RNT Fighter scorecard — image generation and device sharing only.
import { drawRosterBody, drawRosterPoseHead } from './rnt-art.js?v=20261104-nine10';

const SPECIAL_FACES = {
  blackjoseph: 'assets/score-black-joseph.png',
  blackblaise: 'assets/score-black-blaise.png',
  alexjones: 'assets/score-alex-jones.png'
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load ' + url));
    image.src = url;
  });
}

function cover(g, image, x, y, w, h) {
  const scale = Math.max(w / image.width, h / image.height);
  const sw = w / scale, sh = h / scale;
  g.drawImage(image, (image.width-sw)/2, (image.height-sh)/2,
    sw, sh, x, y, w, h);
}

function contain(g, image, x, y, w, h) {
  const scale = Math.min(w / image.width, h / image.height);
  const dw = image.width * scale, dh = image.height * scale;
  g.drawImage(image, x+(w-dw)/2, y+(h-dh)/2, dw, dh);
}

function outlined(g, text, x, y, size, color, maxWidth) {
  g.font = `900 ${size}px Impact, "Arial Black", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(5, size * .14);
  g.strokeStyle = '#080509';
  g.strokeText(String(text), x, y, maxWidth);
  g.fillStyle = color;
  g.fillText(String(text), x, y, maxWidth);
}

function telegramName() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (user?.username) return '@' + user.username;
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  return name || 'RNT PLAYER';
}

export async function createScoreCard({fighterId, fighterName, score, wins}) {
  const bg = await loadImage('assets/score-background.png');
  const face = SPECIAL_FACES[fighterId]
    ? await loadImage(SPECIAL_FACES[fighterId]) : null;

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 675;
  const g = canvas.getContext('2d');

  cover(g, bg, 0, 0, 1200, 675);
  g.fillStyle = 'rgba(9,4,11,.62)';
  g.fillRect(0, 0, 1200, 675);

  // Existing fighter artwork; playable character files are untouched.
  g.save();
  g.beginPath();
  g.rect(15, 65, 570, 560);
  g.clip();
  g.translate(290, 615);
  g.scale(3.15, 3.15);
  const pose = {
    lean:0, crouch:0,
    fa:[16,-104,30,-96], ba:[-14,-102,-30,-92],
    lf:[16,-10], lb:[-18,-8], hy:-125
  };
  drawRosterBody(g, fighterId, pose);
  if (!face) drawRosterPoseHead(g, fighterId, pose);
  g.restore();

  if (face) contain(g, face, 155, 95, 280, 255);

  // Dark panel keeps text readable over the face collage.
  g.fillStyle = 'rgba(8,5,13,.84)';
  g.fillRect(580, 75, 590, 505);
  g.strokeStyle = '#E8A736';
  g.lineWidth = 5;
  g.strokeRect(580, 75, 590, 505);

  outlined(g, 'RNT FIGHT', 875, 52, 72, '#FFCD43', 550);
  outlined(g, wins === 5 ? 'VICTORY' : 'RUN RESULTS',
    875, 132, 48, '#FFFFFF', 520);

  const name = telegramName();
  outlined(g, name, 875, 202, 34, '#FFFFFF', 525);
  outlined(g, fighterName.toUpperCase(), 875, 270, 38, '#FFCD43', 535);

  outlined(g, 'FINAL SCORE', 875, 345, 30, '#FFFFFF', 480);
  outlined(g, Number(score).toLocaleString('en-US'),
    875, 435, 91, '#FFCD43', 540);
  outlined(g, `${wins} / 5 ROUNDS WON`, 875, 525, 29, '#FFFFFF', 530);
  outlined(g, 'CAN YOU BEAT MY SCORE?',
    600, 635, 47, '#FFCD43', 1070);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob)
      : reject(new Error('Could not create PNG')), 'image/png');
  });
}

function showPreview(blob) {
  const url = URL.createObjectURL(blob);
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#08050bef;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;padding:16px;box-sizing:border-box;';
  const image = document.createElement('img');
  image.src = url;
  image.alt = 'Your RNT Fighter scorecard';
  image.style.cssText = 'max-width:100%;max-height:72vh;object-fit:contain;';
  const info = document.createElement('p');
  info.textContent = 'Save this image or press and hold it to share in Telegram.';
  info.style.cssText = 'color:white;text-align:center;font:14px sans-serif;';
  const buttons = document.createElement('div');
  buttons.style.cssText = 'display:flex;gap:12px;';
  const save = document.createElement('a');
  save.href = url;
  save.download = 'RNT-Fight-Score.png';
  save.textContent = 'SAVE PNG';
  const close = document.createElement('button');
  close.textContent = 'CLOSE';
  for (const control of [save,close]) {
    control.style.cssText = 'background:#e9b643;color:#120b0b;padding:12px 20px;border:0;border-radius:6px;font:bold 14px sans-serif;text-decoration:none;';
  }
  close.onclick = () => {
    panel.remove();
    URL.revokeObjectURL(url);
  };
  buttons.append(save, close);
  panel.append(image, info, buttons);
  document.body.append(panel);
}

export async function shareScoreCard(data) {
  const blob = await createScoreCard(data);
  const file = new File([blob], 'RNT-Fight-Score.png',
    {type:'image/png'});

  if (navigator.share && navigator.canShare?.({files:[file]})) {
    try {
      await navigator.share({files:[file], title:'RNT FIGHT SCORE'});
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }

  showPreview(blob);
}

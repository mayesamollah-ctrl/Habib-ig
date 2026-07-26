async function createWelcomeCard({
  userName, threadName, memberCount,
  inviterName, newUserID, inviterID, threadID, api
}) {
  const W = 1080, H = 1920;          // Instagram Story size
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  async function loadProfile(uid) {
    const buf = await downloadHighQualityProfile(uid);
    if (buf) return loadImage(buf).catch(() => null);
    try {
      const info = await api.getUserInfo([uid]);
      const src  = info[uid]?.thumbSrc;
      if (src) {
        const b2 = await downloadImage(src);
        if (b2) return loadImage(b2).catch(() => null);
      }
    } catch {}
    return null;
  }

  const [newUserImg, inviterImg, groupImg] = await Promise.all([
    loadProfile(newUserID),
    loadProfile(inviterID),
    getGroupImage(threadID, api).then(b => b ? loadImage(b).catch(() => null) : null)
  ]);

  const safeUser    = readableText(userName);
  const safeInviter = readableText(inviterName);
  const safeGroup   = readableText(threadName);

  // ========== BACKGROUND ==========
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // soft noise
  const rng = s => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
  ctx.fillStyle = 'rgba(255,255,255,0.018)';
  for (let i = 0; i < 400; i++) {
    ctx.beginPath();
    ctx.arc(rng(i * 2.1) * W, rng(i * 3.7) * H, rng(i * 5.3) * 1.4 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // top glow
  const topGlow = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, 700);
  topGlow.addColorStop(0, 'rgba(80,140,255,0.18)');
  topGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 900);

  // bottom glow
  const botGlow = ctx.createRadialGradient(W/2, H, 0, W/2, H, 600);
  botGlow.addColorStop(0, 'rgba(46,204,113,0.12)');
  botGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = botGlow;
  ctx.fillRect(0, H - 700, W, 700);

  // outer border
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  roundRect(ctx, 18, 18, W - 36, H - 36, 32);
  ctx.stroke();
  ctx.restore();

  // ========== TOP LABEL ==========
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '600 22px "Segoe UI", Arial';
  ctx.fillStyle = 'rgba(46,204,113,0.9)';
  ctx.letterSpacing = '4px';
  ctx.fillText('N E W   M E M B E R', W / 2, 90);
  ctx.restore();

  // ========== MAIN AVATAR ==========
  const avatarR = 210;
  const avatarY = 380;

  // glow ring
  ctx.save();
  ctx.shadowColor = 'rgba(46,204,113,0.7)';
  ctx.shadowBlur = 45;
  ctx.strokeStyle = 'rgba(46,204,113,0.95)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, avatarR + 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // soft outer ring
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, avatarR + 28, 0, Math.PI * 2);
  ctx.stroke();

  if (newUserImg) {
    drawCircleAvatar(ctx, newUserImg, W / 2, avatarY, avatarR);
  } else {
    ctx.fillStyle = '#161628';
    ctx.beginPath();
    ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(avatarR * 0.65)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillText('👤', W / 2, avatarY);
    ctx.restore();
  }

  // Username
  {
    const maxW = W - 120;
    ctx.save();
    ctx.textAlign = 'center';
    const { text, size } = fitText(ctx, safeUser, maxW, 48, 22);
    ctx.font = `bold ${size}px "Segoe UI", Arial`;
    ctx.fillStyle = '#f5f5ff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillText(text, W / 2, avatarY + avatarR + 70);
    ctx.restore();
  }

  // Member badge
  {
    const bText = `✦  ${ordinal(memberCount)} Member  ✦`;
    ctx.save();
    ctx.font = 'bold 24px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    const bw = ctx.measureText(bText).width + 48;
    const bh = 48;
    const bx = W / 2 - bw / 2;
    const by = avatarY + avatarR + 100;

    const bg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bg.addColorStop(0, 'rgba(46,204,113,0.08)');
    bg.addColorStop(0.5, 'rgba(46,204,113,0.25)');
    bg.addColorStop(1, 'rgba(46,204,113,0.08)');
    ctx.fillStyle = bg;
    roundRect(ctx, bx, by, bw, bh, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(46,204,113,0.55)';
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, bw, bh, 14);
    ctx.stroke();

    ctx.fillStyle = 'rgba(46,204,113,0.95)';
    ctx.fillText(bText, W / 2, by + 32);
    ctx.restore();
  }

  // ========== DIVIDER ==========
  {
    const dy = 780;
    const g = ctx.createLinearGradient(80, 0, W - 80, 0);
    g.addColorStop(0, 'transparent');
    g.addColorStop(0.3, 'rgba(255,255,255,0.12)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'transparent');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, dy);
    ctx.lineTo(W - 80, dy);
    ctx.stroke();
  }

  // ========== GROUP SECTION ==========
  const groupY = 860;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '500 18px "Segoe UI", Arial';
  ctx.fillStyle = 'rgba(0,200,255,0.7)';
  ctx.fillText('G R O U P', W / 2, groupY);
  ctx.restore();

  const gSize = 110;
  const gX = W / 2 - gSize / 2;
  const gY = groupY + 30;

  if (groupImg) {
    ctx.save();
    roundRect(ctx, gX, gY, gSize, gSize, 22);
    ctx.clip();
    ctx.drawImage(groupImg, gX, gY, gSize, gSize);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(0,200,255,0.6)';
    ctx.lineWidth = 3;
    roundRect(ctx, gX, gY, gSize, gSize, 22);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = '#161628';
    roundRect(ctx, gX, gY, gSize, gSize, 22);
    ctx.fill();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '50px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('🏠', W / 2, gY + gSize / 2);
    ctx.restore();
  }

  // Group name
  {
    const maxW = W - 140;
    ctx.save();
    ctx.textAlign = 'center';
    const { text, size } = fitText(ctx, safeGroup, maxW, 36, 18);
    ctx.font = `bold ${size}px "Segoe UI", Arial`;
    ctx.fillStyle = '#e8e8f5';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, W / 2, gY + gSize + 55);
    ctx.restore();
  }

  // ========== INVITER SECTION ==========
  const invY = 1200;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '500 18px "Segoe UI", Arial';
  ctx.fillStyle = 'rgba(255,215,0,0.7)';
  ctx.fillText('A D D E D   B Y', W / 2, invY);
  ctx.restore();

  const invR = 70;
  const invCX = W / 2;
  const invCY = invY + 100;

  if (inviterImg) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,215,0,0.5)';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = 'rgba(255,215,0,0.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(invCX, invCY, invR + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawCircleAvatar(ctx, inviterImg, invCX, invCY, invR);
  } else {
    ctx.fillStyle = '#161628';
    ctx.beginPath();
    ctx.arc(invCX, invCY, invR, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '42px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('👤', invCX, invCY);
    ctx.restore();
  }

  // Inviter name
  {
    const maxW = W - 140;
    ctx.save();
    ctx.textAlign = 'center';
    const { text, size } = fitText(ctx, safeInviter, maxW, 34, 16);
    ctx.font = `bold ${size}px "Segoe UI", Arial`;
    ctx.fillStyle = '#e8e8f5';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, W / 2, invCY + invR + 50);
    ctx.restore();
  }

  // ========== BOTTOM BRANDING ==========
  {
    const blockY = 1580;
    const blockH = 180;

    const pillG = ctx.createLinearGradient(80, blockY, W - 80, blockY + blockH);
    pillG.addColorStop(0, 'rgba(255,255,255,0.04)');
    pillG.addColorStop(1, 'rgba(255,255,255,0.015)');
    ctx.fillStyle = pillG;
    roundRect(ctx, 80, blockY, W - 160, blockH, 24);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 80, blockY, W - 160, blockH, 24);
    ctx.stroke();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Segoe UI", Arial';

    const pGrad = ctx.createLinearGradient(W/2 - 180, 0, W/2 + 180, 0);
    pGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
    pGrad.addColorStop(0.4, 'rgba(255,255,255,0.95)');
    pGrad.addColorStop(0.7, 'rgba(100,200,255,1)');
    pGrad.addColorStop(1, 'rgba(46,204,113,1)');
    ctx.fillStyle = pGrad;
    ctx.shadowColor = 'rgba(100,200,255,0.5)';
    ctx.shadowBlur = 18;
    ctx.fillText('Powered By Habib', W / 2, blockY + 75);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '400 20px "Segoe UI", Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Enjoy your stay ✨', W / 2, blockY + 120);
    ctx.restore();
  }

  const tempPath = path.join(__dirname, `temp_welcome_ig_${Date.now()}.png`);
  await fs.writeFile(tempPath, canvas.toBuffer('image/png'));
  return tempPath;
}

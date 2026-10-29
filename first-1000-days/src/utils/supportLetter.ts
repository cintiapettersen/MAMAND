// Gera a "cartinha" da Rede de Apoio como imagem PNG (canvas 100% local/offline)

export interface SupportLetterItem {
  title: string;
  when?: string;
  notes?: string;
}

export interface SupportLetterContent {
  overline: string;
  dateLabel: string;
  greeting: string;
  body: string;
  listTitle: string;
  items: SupportLetterItem[];
  outro: string;
  signoff: string;
  signature?: string;
  footer: string;
}

const WIDTH = 1080;
const PAD = 120;
const TEXT_WIDTH = WIDTH - PAD * 2;

const FONT_TITLE = "'Nunito', 'Plus Jakarta Sans', -apple-system, sans-serif";
const FONT_BODY = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const COLORS = {
  paper: '#FDFBF7',
  border: '#EAD8C7',
  coral: '#C76B50',
  coralLight: '#FBF0EB',
  sage: '#5E8068',
  text: '#2C2825',
  muted: '#736C65'
};

const ensureFonts = async () => {
  try {
    await Promise.all([
      document.fonts.load(`700 64px ${FONT_TITLE}`),
      document.fonts.load(`400 32px ${FONT_BODY}`),
      document.fonts.load(`600 32px ${FONT_BODY}`),
      document.fonts.load(`700 24px ${FONT_BODY}`)
    ]);
  } catch {
    // Sem fontes web: o canvas usa as fontes do sistema
  }
};

const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  text.split('\n').forEach((paragraph) => {
    let current = '';
    paragraph.split(' ').forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    lines.push(current);
  });
  return lines;
};

const drawHeart = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
  const s = size / 100;
  ctx.save();
  ctx.translate(cx - 50 * s, cy - 50 * s);
  ctx.scale(s, s);
  const heart = new Path2D(
    'M50 84C50 84 14 60 14 36C14 22 24 14 35 14C42 14 47 18 50 23C53 18 58 14 65 14C76 14 86 22 86 36C86 60 50 84 50 84Z'
  );
  ctx.fillStyle = COLORS.coral;
  ctx.fill(heart);
  const stitch = new Path2D(
    'M50 78C50 78 19.5 57 19.5 36.5C19.5 25.5 27 19.5 35.5 19.5C41.5 19.5 46.5 23.5 50 30C53.5 23.5 58.5 19.5 64.5 19.5C73 19.5 80.5 25.5 80.5 36.5C80.5 57 50 78 50 78Z'
  );
  ctx.strokeStyle = 'rgba(251, 240, 235, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([2.4, 2.4]);
  ctx.stroke(stitch);
  ctx.restore();
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Desenha a cartinha; com draw=false apenas mede a altura total
const layout = (ctx: CanvasRenderingContext2D, c: SupportLetterContent, draw: boolean): number => {
  let y = 110;

  // Coração em círculo
  if (draw) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(WIDTH / 2, y + 60, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawHeart(ctx, WIDTH / 2, y + 62, 76);
  }
  y += 170;

  // Sobretítulo e data
  ctx.textAlign = 'center';
  ctx.font = `700 24px ${FONT_BODY}`;
  if (draw) {
    ctx.fillStyle = COLORS.sage;
    ctx.letterSpacing = '4px';
    ctx.fillText(c.overline.toUpperCase(), WIDTH / 2, y);
    ctx.letterSpacing = '0px';
  }
  y += 44;
  ctx.font = `400 26px ${FONT_BODY}`;
  if (draw) {
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(c.dateLabel, WIDTH / 2, y);
  }
  y += 96;

  // Saudação + corpo
  ctx.textAlign = 'left';
  ctx.font = `700 64px ${FONT_TITLE}`;
  if (draw) {
    ctx.fillStyle = COLORS.text;
    ctx.fillText(c.greeting, PAD, y);
  }
  y += 64;
  ctx.font = `400 32px ${FONT_BODY}`;
  wrapLines(ctx, c.body, TEXT_WIDTH).forEach((line) => {
    if (draw) {
      ctx.fillStyle = COLORS.text;
      ctx.fillText(line, PAD, y);
    }
    y += line ? 48 : 28;
  });
  y += 36;

  // Lista de pedidos em um bloco suave
  const listTop = y;
  const innerPad = 44;
  const itemX = PAD + innerPad + 52;
  const itemWidth = TEXT_WIDTH - innerPad * 2 - 52;
  y += innerPad + 26;
  ctx.font = `700 22px ${FONT_BODY}`;
  if (draw) {
    ctx.fillStyle = COLORS.coral;
    ctx.letterSpacing = '3px';
    ctx.fillText(c.listTitle.toUpperCase(), PAD + innerPad, y);
    ctx.letterSpacing = '0px';
  }
  y += 52;

  c.items.forEach((item, index) => {
    const itemTop = y;
    if (draw) {
      ctx.strokeStyle = COLORS.coral;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      roundRect(ctx, PAD + innerPad, itemTop - 27, 32, 32, 8);
      ctx.stroke();
    }
    ctx.font = `600 32px ${FONT_BODY}`;
    wrapLines(ctx, item.title, itemWidth).forEach((line) => {
      if (draw) {
        ctx.fillStyle = COLORS.text;
        ctx.fillText(line, itemX, y);
      }
      y += 44;
    });
    if (item.when) {
      ctx.font = `600 26px ${FONT_BODY}`;
      if (draw) {
        ctx.fillStyle = COLORS.coral;
        ctx.fillText(item.when, itemX, y - 4);
      }
      y += 38;
    }
    if (item.notes) {
      ctx.font = `italic 400 26px ${FONT_BODY}`;
      wrapLines(ctx, item.notes, itemWidth).forEach((line) => {
        if (draw) {
          ctx.fillStyle = COLORS.muted;
          ctx.fillText(line, itemX, y - 4);
        }
        y += 38;
      });
    }
    if (index < c.items.length - 1) y += 22;
  });
  y += innerPad - 10;

  if (draw) {
    // Fundo do bloco desenhado por baixo do conteúdo já posicionado
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = COLORS.coralLight;
    roundRect(ctx, PAD, listTop, TEXT_WIDTH, y - listTop, 28);
    ctx.fill();
    ctx.restore();
  }
  y += 72;

  // Agradecimento e assinatura
  ctx.font = `400 32px ${FONT_BODY}`;
  wrapLines(ctx, c.outro, TEXT_WIDTH).forEach((line) => {
    if (draw) {
      ctx.fillStyle = COLORS.text;
      ctx.fillText(line, PAD, y);
    }
    y += 48;
  });
  y += 36;
  ctx.font = `italic 400 30px ${FONT_BODY}`;
  if (draw) {
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(c.signoff, PAD, y);
  }
  if (c.signature) {
    y += 56;
    ctx.font = `700 44px ${FONT_TITLE}`;
    if (draw) {
      ctx.fillStyle = COLORS.coral;
      ctx.fillText(c.signature, PAD, y);
    }
  }
  y += 110;

  // Rodapé
  ctx.textAlign = 'center';
  ctx.font = `700 20px ${FONT_BODY}`;
  if (draw) {
    ctx.fillStyle = 'rgba(115, 108, 101, 0.7)';
    ctx.letterSpacing = '3px';
    ctx.fillText(c.footer.toUpperCase(), WIDTH / 2, y);
    ctx.letterSpacing = '0px';
  }
  return y + 90;
};

export const renderSupportLetter = async (content: SupportLetterContent): Promise<Blob | null> => {
  await ensureFonts();

  const measureCtx = document.createElement('canvas').getContext('2d');
  if (!measureCtx) return null;
  const height = layout(measureCtx, content, false);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Conteúdo primeiro; o papel e a moldura entram por baixo (destination-over)
  layout(ctx, content, true);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  roundRect(ctx, 40, 40, WIDTH - 80, height - 80, 36);
  ctx.stroke();
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.restore();

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
};

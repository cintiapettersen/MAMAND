import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { ptBR } from '../src/locales/pt-BR.ts';
import { en } from '../src/locales/en.ts';

// Versão pública: o assistente experimental (busca, respostas, integração com IA, detector
// e catálogo de evidências) e o painel de critérios de alerta não fazem parte desta
// distribuição. A aba Pergunte mostra só o aviso de suspensão e os contatos de emergência.

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { recursive: true }).map((f) => path.join(dir, String(f))).filter((f) => /\.(ts|tsx)$/.test(f));

test('Distribuição: sem gateway, motor de perguntas, catálogo de evidências nem painel de alerta', () => {
  for (const p of [
    'gateway',
    'src/services/askService.ts',
    'src/data/askSuggestions.ts',
    'src/data/evidenceCatalog.ts',
    'src/config/askAvailability.ts',
    'src/config/alertSignsAvailability.ts'
  ]) {
    assert.ok(!fs.existsSync(p), `${p} não deveria existir na versão pública`);
  }
  const offenders = walk('src').filter((f) =>
    /gateway\/|askService|askSuggestions|evidenceCatalog|geminiEngine|generativelanguage|ragService|mockEngine|safetyService/.test(fs.readFileSync(f, 'utf8'))
  );
  assert.deepStrictEqual(offenders, []);
});

test('Aba Pergunte: só o aviso de suspensão e os contatos de emergência', () => {
  const view = fs.readFileSync('src/views/AskView.tsx', 'utf8');
  assert.ok(!/<textarea|<input|fetch\(|onSubmit/.test(view), 'sem campo de pergunta nem rede');
  assert.match(view, /t\.ask\.suspendedTitle/);
  assert.match(view, /href=\{`tel:\$\{contact\.emergency\.number\}`\}/);
  for (const t of [ptBR, en]) {
    assert.deepStrictEqual(Object.keys(t.ask).sort(), ['badge', 'suspendedBadge', 'suspendedCare', 'suspendedEmergencyFallback', 'suspendedText', 'suspendedTitle']);
    assert.ok(!/Gemini|IA|AI\b/.test(JSON.stringify(t.ask)), 'textos da aba sem menção a IA');
  }
});

test('Hoje: sem painel nem critérios de sinais de alerta; cartão de emergência no lugar', () => {
  const today = fs.readFileSync('src/views/TodayView.tsx', 'utf8');
  assert.ok(!/isAlertsModalOpen|alertsModal|ALERT_SIGNS_PANEL_ENABLED/.test(today));
  assert.strictEqual((today.match(/\{emergencyCard\}/g) || []).length, 1, 'faixa abaixo dos acessos');
  assert.match(today, /<EmergencyStrip country=\{profile\.country\} \/>/);
  assert.match(fs.readFileSync('src/components/EmergencyStrip.tsx', 'utf8'), /href=\{`tel:\$\{contact\.emergency\.number\}`\}/);
});

test('Build público: nenhum trecho do assistente, do catálogo de evidências ou dos textos de Cuidados', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mamand-public-'));
  try {
    execFileSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'], { stdio: 'pipe' });
    const js = fs.readdirSync(path.join(outDir, 'assets')).filter((f) => f.endsWith('.js'))
      .map((f) => fs.readFileSync(path.join(outDir, 'assets', f), 'utf8')).join('\n');
    for (const marker of ['ev-safe-sleep-01', 'out_of_catalog', '/api/ask', 'localhost:8787', 'Gemini', 'Aproveite uma das sonecas do bebê', 'O ritmo de sono no início do puerpério']) {
      assert.ok(!js.includes(marker), `build contém "${marker}"`);
    }
    assert.ok(js.includes('Respostas em revisão'));
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

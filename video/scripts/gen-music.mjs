// Gera uma trilha de fundo ORIGINAL (pad suave, progressão I–V–vi–IV em Dó maior).
// 100% livre de licença. Saída: public/audio/music.wav (mono, 22.05kHz, ~38s).
// Troque por uma faixa profissional quando quiser, mantendo o caminho.
import { mkdirSync, writeFileSync } from "fs";

const SR = 22050;
const DUR = 38; // segundos
const N = SR * DUR;
const slot = 4.75; // duração de cada acorde (s)

// acordes (Hz) — voicings graves para um pad calmo
const chords = [
  [130.81, 164.81, 196.0, 261.63], // C
  [98.0, 123.47, 146.83, 196.0], // G
  [110.0, 130.81, 164.81, 220.0], // Am
  [87.31, 110.0, 130.81, 174.61], // F
];

const buf = Buffer.alloc(44 + N * 2);
// cabeçalho WAV (PCM 16-bit mono)
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 2, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 2, 40);

for (let i = 0; i < N; i++) {
  const t = i / SR;
  const si = Math.floor(t / slot) % chords.length;
  const local = t - Math.floor(t / slot) * slot;
  // envelope por acorde (ataque/release suaves, sem clique)
  const a = 0.5,
    r = 0.6;
  let env = 1;
  if (local < a) env = local / a;
  else if (local > slot - r) env = (slot - local) / r;
  env = Math.max(0, env);
  const chord = chords[si];
  let s = 0;
  for (const f of chord) {
    s += Math.sin(2 * Math.PI * f * t);
    s += 0.25 * Math.sin(2 * Math.PI * f * 2 * t); // 2º harmônico leve
  }
  s /= chord.length * 1.25;
  const tremolo = 0.86 + 0.14 * Math.sin(2 * Math.PI * 0.5 * t);
  const v = s * env * tremolo * 0.5; // headroom
  const clamped = Math.max(-1, Math.min(1, v));
  buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
}

mkdirSync("public/audio", { recursive: true });
writeFileSync("public/audio/music.wav", buf);
console.log(`OK music.wav ${(buf.length / 1024 / 1024).toFixed(2)}MB`);

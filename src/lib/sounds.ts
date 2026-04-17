declare global {
    interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const getAudioCtx = (): typeof AudioContext =>
  window.AudioContext ?? window.webkitAudioContext;

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (getAudioCtx())();
  return audioCtx;
}
export async function playIncomingSound(): Promise<void> {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();

    const now = ctx.currentTime;

    const playPulse = (freq: number, startOffset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0, now + startOffset);
      gain.gain.linearRampToValueAtTime(0.8, now + startOffset + 0.02); 
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + 0.3);
    };

    playPulse(580, 0);
    playPulse(780, 0.12);

  } catch (error) {
    console.error("Audio playback failed:", error);
  }
}

export async function playOutgoingSound(): Promise<void> {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch(error) {
    console.error("Audio playback failed:", error);

  }
}
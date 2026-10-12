export function countdownParts(endsAtMs: number, nowMs: number) {
  const totalSeconds = Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    ended: totalSeconds === 0,
  };
}

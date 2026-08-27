export function playAlarm() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a sequence of beeps
    const playBeep = (startTime: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, startTime); // A5
      
      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    };

    // 4 quick beeps
    const now = audioCtx.currentTime;
    playBeep(now);
    playBeep(now + 0.4);
    playBeep(now + 0.8);
    playBeep(now + 1.2);

  } catch (e) {
    console.error('Audio playback failed', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  let audioCtx = null;
  let activeMaqamCents = [0, 0, -50, 0, 0, 0, -50];
  let currentOctave = 4;
  let isRecording = false;
  let isPlaying = false;
  let metroInterval = null;

  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function midiToFreq(midi, centsOffset = 0) {
    return 440 * Math.pow(2, (midi - 69 + centsOffset / 100) / 12);
  }

  function playNote(midi, label) {
    ensureAudioContext();
    const scaleDegree = midi % 12;
    const diatonicMap = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
    const cents = diatonicMap[scaleDegree] !== undefined ? activeMaqamCents[diatonicMap[scaleDegree]] : 0;
    const freq = midiToFreq(midi, cents);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.32, audioCtx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, audioCtx.currentTime + 1.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.15);

    const readout = document.getElementById('note-readout');
    if (readout) {
      readout.textContent = `Playing: ${label} (${freq.toFixed(1)} Hz${cents ? `, ${cents}¢` : ''})`;
    }
  }

  const keyboardEl = document.getElementById('piano-keyboard');
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const blackSet = new Set([1, 3, 6, 8, 10]);

  function renderKeyboard() {
    if (!keyboardEl) return;
    keyboardEl.innerHTML = '';
    const startMidi = (currentOctave + 1) * 12;
    const totalKeys = 24;

    for (let i = 0; i < totalKeys; i++) {
      const midi = startMidi + i;
      const noteIndex = midi % 12;
      const oct = Math.floor(midi / 12) - 1;
      const label = `${noteNames[noteIndex]}${oct}`;
      const isBlack = blackSet.has(noteIndex);

      const keyBtn = document.createElement('button');
      keyBtn.type = 'button';
      keyBtn.className = isBlack ? 'piano-key black-key' : 'piano-key white-key';
      keyBtn.dataset.midi = String(midi);
      keyBtn.dataset.label = label;
      keyBtn.setAttribute('aria-label', label);
      keyBtn.innerHTML = `<span class="key-label">${label}</span>`;

      const trigger = (e) => {
        e.preventDefault();
        keyBtn.classList.add('active');
        playNote(midi, label);
        setTimeout(() => keyBtn.classList.remove('active'), 180);
      };

      keyBtn.addEventListener('mousedown', trigger);
      keyBtn.addEventListener('touchstart', trigger, { passive: false });
      keyboardEl.appendChild(keyBtn);
    }
  }

  renderKeyboard();

  const keyMap = {
    'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5,
    't': 6, 'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12, 'l': 14
  };
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.tagName === 'INPUT') return;
    const offset = keyMap[e.key.toLowerCase()];
    if (offset !== undefined) {
      const midi = (currentOctave + 1) * 12 + offset;
      const keyEl = keyboardEl?.querySelector(`[data-midi="${midi}"]`);
      if (keyEl) {
        keyEl.classList.add('active');
        playNote(midi, keyEl.dataset.label || '');
        setTimeout(() => keyEl.classList.remove('active'), 180);
      }
    }
  });

  document.querySelectorAll('.oct-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.oct-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentOctave = parseInt(btn.dataset.octave, 10) || 4;
      renderKeyboard();
    });
  });

  const maqamBtn = document.getElementById('maqam-selector-btn');
  const maqamPanel = document.getElementById('sound-maqam-panel');
  const maqamLabel = document.getElementById('active-maqam-label');
  const maqamSearch = document.getElementById('maqam-search-input');

  maqamBtn?.addEventListener('click', () => {
    const isHidden = maqamPanel.classList.toggle('hidden');
    maqamBtn.setAttribute('aria-expanded', String(!isHidden));
  });

  document.querySelectorAll('.maqam-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.maqam-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      if (maqamLabel) maqamLabel.textContent = chip.dataset.maqam;
      activeMaqamCents = (chip.dataset.cents || '0,0,0,0,0,0,0').split(',').map(Number);
      maqamPanel?.classList.add('hidden');
      maqamBtn?.setAttribute('aria-expanded', 'false');
    });
  });

  maqamSearch?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.maqam-chip').forEach((chip) => {
      chip.style.display = chip.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  const appSwitcherBtn = document.getElementById('app-switcher-btn');
  const appSwitcherMenu = document.getElementById('radix-:r1:');
  appSwitcherBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = appSwitcherMenu.classList.toggle('hidden');
    appSwitcherBtn.setAttribute('aria-expanded', String(!isHidden));
  });
  document.addEventListener('click', () => {
    appSwitcherMenu?.classList.add('hidden');
    appSwitcherBtn?.setAttribute('aria-expanded', 'false');
  });

  const brandBtn = document.getElementById('brand-menu-btn');
  const mainMenuModal = document.getElementById('studio-main-menu');
  brandBtn?.addEventListener('click', () => mainMenuModal?.classList.remove('hidden'));

  document.querySelectorAll('.close-modal-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.close || btn.closest('.modal-backdrop')?.id;
      if (targetId) document.getElementById(targetId)?.classList.add('hidden');
    });
  });

  const helpBtn = document.getElementById('help-guide-btn');
  const helpModal = document.getElementById('help-guide-modal');
  const guideSteps = [
    { title: 'Welcome to MaqAmir Piano Studio', body: 'Play notes using your mouse, touch screen, or computer keyboard (keys A through L for white keys, W/E/T/Y/U for black keys).' },
    { title: 'Microtonal Maqam Tuning', body: 'Click "Rast · C" in the top bar to switch between 135+ Arabic Maqams, Turkish Makams, Persian Dastgahs, and Indian Ragas.' },
    { title: 'Transport & Loop Machine', body: 'Use the Play, BPM, and Metronome controls to practice in time or record your own multitrack ideas.' }
  ];
  let guideIndex = 0;

  function updateGuideStep() {
    const step = guideSteps[guideIndex];
    document.getElementById('guide-step-title').textContent = step.title;
    document.getElementById('guide-step-body').textContent = step.body;
  }

  helpBtn?.addEventListener('click', () => {
    guideIndex = 0;
    updateGuideStep();
    helpModal?.classList.remove('hidden');
  });
  document.getElementById('guide-next-btn')?.addEventListener('click', () => {
    if (guideIndex < guideSteps.length - 1) { guideIndex++; updateGuideStep(); }
    else { helpModal?.classList.add('hidden'); }
  });
  document.getElementById('guide-back-btn')?.addEventListener('click', () => {
    if (guideIndex > 0) { guideIndex--; updateGuideStep(); }
  });

  document.getElementById('qa-magic-btn')?.addEventListener('click', () => {
    const instruments = ['Grand Piano', 'Warm Oud', 'Electric Rhodes', 'Analog Synth', 'Ney Flute'];
    const next = instruments[Math.floor(Math.random() * instruments.length)];
    document.getElementById('active-instrument-label').textContent = next;
  });

  document.getElementById('qa-record-btn')?.addEventListener('click', (e) => {
    isRecording = !isRecording;
    e.currentTarget.classList.toggle('recording', isRecording);
    document.getElementById('record-btn-label').textContent = isRecording ? 'Recording...' : 'Record';
  });

  document.getElementById('transport-play-btn')?.addEventListener('click', (e) => {
    isPlaying = !isPlaying;
    e.currentTarget.textContent = isPlaying ? '⏹ Stop' : '▶ Play';
  });

  document.getElementById('metronome-btn')?.addEventListener('click', (e) => {
    if (metroInterval) {
      clearInterval(metroInterval);
      metroInterval = null;
      e.currentTarget.classList.remove('active');
    } else {
      const bpm = parseInt(document.getElementById('bpm-input')?.value || '120', 10);
      e.currentTarget.classList.add('active');
      metroInterval = setInterval(() => {
        ensureAudioContext();
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.value = 880;
        g.gain.setValueAtTime(0.15, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.06);
      }, (60 / bpm) * 1000);
    }
  });

  document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  const consentBanner = document.getElementById('cookie-consent-banner');
  document.getElementById('consent-accept-btn')?.addEventListener('click', () => {
    consentBanner?.classList.add('hidden');
  });
  document.getElementById('consent-decline-btn')?.addEventListener('click', () => {
    consentBanner?.classList.add('hidden');
  });
});
/*
    Aero Progress Interface Logic
    Modern redesign by AI Assistant
*/

let wrap, labelEl, timeEl, fillEl, percentEl, iconEl, hintEl;
let totalDuration = 0, startTime = 0, progressTimer = null, showPercentFlag = true;

// New format function for time (shows 1 decimal place)
function formatTime(ms) {
  return `${Math.max(0, (ms / 1000)).toFixed(1)}s`;
}

let audioContext;
// Updated chimes - more modern, cleaner tones
function playNotification(type) {
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const now = audioContext.currentTime;
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.0, now);
    
    // Tone sequences
    const sequence = (type === 'start')
      ? [1000, 1500]             // Start: Clean, rising pair
      : (type === 'complete')
        ? [880, 1320, 1760]      // Complete: Triple chime
        : [440, 220];            // Cancel: Dropping tone

    let timeOffset = now;
    sequence.forEach(freq => {
      const osc = audioContext.createOscillator();
      osc.type = 'square'; // Change tone type to square wave for a different texture
      osc.frequency.value = freq;
      osc.connect(gainNode);

      gainNode.gain.linearRampToValueAtTime(0.08, timeOffset + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 0.2);

      osc.start(timeOffset);
      osc.stop(timeOffset + 0.2);
      timeOffset += 0.08;
    });
  } catch (e) {
    // Audio errors ignored
  }
}

function startProgress(label, duration, iconName, showPct, cancellable) {
  clearInterval(progressTimer);

  totalDuration = duration || 5000;
  startTime = Date.now();

  labelEl.textContent = label || 'Initiating Task...';
  
  // Display total duration initially
  timeEl.textContent  = formatTime(totalDuration); 
  fillEl.style.width  = '0%';

  showPercentFlag = (showPct !== false);
  percentEl.style.display = showPercentFlag ? 'block' : 'none';
  percentEl.textContent   = '0%';

  // Material Icons support
  if (iconName && typeof iconName === 'string') {
    iconEl.className = `material-icons-filled ${iconName}`;
  } else {
    iconEl.className = 'material-icons-filled hourglass_empty';
  }

  // Hint management
  if (hintEl) {
    const can = (cancellable !== false);
    if (can) {
      hintEl.classList.remove('pb-hint-hidden');
    } else {
      hintEl.classList.add('pb-hint-hidden');
    }
  }

  // Smooth appearance
  wrap.style.opacity = '0';
  wrap.classList.remove('hidden');

  requestAnimationFrame(() => {
    wrap.style.opacity = '1';
  });

  playNotification('start');

  progressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    const percentage = Math.max(0, Math.min(1, elapsed / totalDuration));

    fillEl.style.width = (percentage * 100).toFixed(2) + '%';
    timeEl.textContent = formatTime(remaining); // Show remaining time

    if (showPercentFlag) {
      percentEl.textContent = Math.round(percentage * 100) + '%';
    }

    if (remaining <= 0) {
      endProgress(true);
    }
  }, 50);
}

function endProgress(success) {
  clearInterval(progressTimer);

  wrap.style.opacity = '0';

  setTimeout(() => {
    wrap.classList.add('hidden');
    fillEl.style.width = '0%';
  }, 300); // Slightly slower hide transition

  playNotification(success ? 'complete' : 'cancel');
}

window.addEventListener('message', (e) => {
  const data = e.data || {};
  if (data.action === 'open') {
    startProgress(data.label, data.duration, data.icon, data.showPercent, data.canCancel);
  } else if (data.action === 'close') {
    endProgress(!!data.success);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  wrap      = document.getElementById('pb');
  labelEl   = document.getElementById('pb-label');
  timeEl    = document.getElementById('pb-time');
  fillEl    = document.getElementById('pb-fill');
  percentEl = document.getElementById('pb-percent');
  iconEl    = document.getElementById('pb-icon');
  hintEl    = document.getElementById('pb-hint');
});
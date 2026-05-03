/**
 * Sequencer Module
 * Handles timing, scheduling, and playback of patterns
 */

export class Sequencer {
  constructor(app) {
    this.app = app;
    this.isPlaying = false;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.timerID = null;
    this.scheduleAheadTime = 0.1;
    this.lookahead = 25;
    this.stepsPerBeat = 4; // 16th notes
    this.currentTrack = null;
    this.scheduledNotes = [];
  }

  open(track) {
    this.currentTrack = track;
    this.renderGrid();
  }

  renderGrid() {
    const grid = document.getElementById('sequencerGrid');
    if (!grid || !this.currentTrack) return;

    const noteTypes = ['D', 'T', 'K', 'S', 't', 'k', 'B', 'R'];
    const colors = {
      'D': '#3b82f6',
      'T': '#a855f7',
      'K': '#eab308',
      'S': '#ef4444',
      't': '#22d3ee',
      'k': '#fb923c',
      'B': '#fb7185',
      'R': '#64748b'
    };

    let html = '<div class="seq-label">Note</div>';
    for (let i = 0; i < 16; i++) {
      html += `<div class="seq-label">${i + 1}</div>`;
    }

    noteTypes.forEach(note => {
      html += `<div class="seq-label" style="color: ${colors[note]}">${note}</div>`;
      for (let step = 0; step < 16; step++) {
        const isActive = this.isStepActive(note, step);
        const isBeat = step % 4 === 0;
        html += `<div class="seq-cell ${isActive ? 'active' : ''} ${isBeat ? 'beat' : ''}" 
                   data-note="${note}" 
                   data-step="${step}"
                   style="--cell-color: ${colors[note]}"></div>`;
      }
    });

    grid.innerHTML = html;

    // Add click handlers
    grid.querySelectorAll('.seq-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const note = e.target.dataset.note;
        const step = parseInt(e.target.dataset.step);
        this.toggleStep(note, step);
      });
    });
  }

  isStepActive(note, step) {
    if (!this.currentTrack || !this.currentTrack.pattern) return false;
    
    const pattern = this.currentTrack.pattern.trim().split(/\s+/);
    const stepPattern = pattern[step % pattern.length] || '';
    return stepPattern.includes(note);
  }

  toggleStep(note, step) {
    if (!this.currentTrack) return;

    const pattern = this.currentTrack.pattern.trim().split(/\s+/);
    while (pattern.length <= step) {
      pattern.push('');
    }

    let stepPattern = pattern[step] || '';
    
    if (stepPattern.includes(note)) {
      stepPattern = stepPattern.replace(note, '');
    } else {
      stepPattern += note;
    }

    pattern[step] = stepPattern;
    this.currentTrack.pattern = pattern.join(' ');
    this.app.updateTrackPattern(this.currentTrack.id, this.currentTrack.pattern);
    this.renderGrid();
  }

  start() {
    if (this.isPlaying) return;
    
    this.app.audioEngine.resume().then(() => {
      this.isPlaying = true;
      this.currentStep = 0;
      this.nextNoteTime = this.app.audioEngine.getCurrentTime() + 0.05;
      this.scheduler();
    });
  }

  stop() {
    this.isPlaying = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
    
    // Clear any scheduled notes
    this.scheduledNotes.forEach(note => {
      if (note.timeoutId) clearTimeout(note.timeoutId);
    });
    this.scheduledNotes = [];
  }

  restart() {
    this.stop();
    this.currentStep = 0;
    this.start();
  }

  scheduler() {
    if (!this.isPlaying) return;
    
    const currentTime = this.app.audioEngine.getCurrentTime();
    
    while (this.nextNoteTime < currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.nextNote();
    }

    this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
  }

  nextNote() {
    const secondsPerBeat = 60 / this.app.bpm;
    const stepTime = secondsPerBeat * this.app.beatDivision;
    
    // Apply swing
    let swingOffset = 0;
    if (this.app.swing > 0 && this.currentStep % 2 === 1) {
      swingOffset = this.app.swing * stepTime;
    }
    
    this.nextNoteTime += stepTime + swingOffset;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  scheduleNote(step, time) {
    // Play metronome on beat
    if (this.app.metronomeEnabled && step % 4 === 0) {
      this.playMetronome(time, step === 0);
    }

    // Schedule notes for all tracks
    this.app.tracks.forEach(track => {
      if (track.muted) return;
      
      // Check for solo
      const hasSolo = this.app.tracks.some(t => t.solo);
      if (hasSolo && !track.solo) return;

      const pattern = track.pattern.trim().split(/\s+/);
      const stepPattern = pattern[step % pattern.length] || '';

      if (stepPattern) {
        for (const note of stepPattern) {
          if (note !== '-' && note !== ' ' && note.trim()) {
            // Schedule audio precisely
            this.app.audioEngine.playSample(note, track.volume, time);
            
            // Schedule visualizer trigger
            const delayMs = (time - this.app.audioEngine.getCurrentTime()) * 1000;
            const timeoutId = setTimeout(() => {
              this.app.visualizer.triggerHit(note);
            }, Math.max(0, delayMs));
            
            this.scheduledNotes.push({ timeoutId });
          }
        }
      }
    });

    // Update UI playhead
    requestAnimationFrame(() => {
      this.updateUI(step);
    });
  }

  playMetronome(time, isDownbeat) {
    if (!this.app.audioEngine.ctx) return;
    
    const osc = this.app.audioEngine.ctx.createOscillator();
    const gain = this.app.audioEngine.ctx.createGain();
    
    osc.frequency.value = isDownbeat ? 1000 : 800;
    gain.gain.value = 0.3;
    
    osc.connect(gain);
    gain.connect(this.app.audioEngine.masterGain);
    
    osc.start(time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.stop(time + 0.05);
  }

  updateUI(step) {
    // Highlight current step in sequencer if open
    const cells = document.querySelectorAll('.seq-cell');
    cells.forEach(cell => {
      const cellStep = parseInt(cell.dataset.step);
      if (cellStep === step) {
        cell.style.borderColor = '#facc15';
        cell.style.boxShadow = '0 0 10px #facc15';
      } else {
        cell.style.borderColor = '';
        cell.style.boxShadow = '';
      }
    });
  }
  
  clearScheduledNotes() {
    this.scheduledNotes.forEach(note => {
      if (note.timeoutId) clearTimeout(note.timeoutId);
    });
    this.scheduledNotes = [];
  }
}

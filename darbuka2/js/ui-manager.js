/**
 * UI Manager Module
 * Handles all UI rendering and updates
 */

export class UIManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    // Initialize close buttons for modals
    document.getElementById('closeSequencerBtn')?.addEventListener('click', () => {
      this.app.closeSequencer();
    });
  }

  updatePlayButton(isPlaying) {
    const playIcon = document.getElementById('playIcon');
    const stopIcon = document.getElementById('stopIcon');
    const playStopText = document.getElementById('playStopText');
    
    if (isPlaying) {
      playIcon?.classList.add('hidden');
      stopIcon?.classList.remove('hidden');
      if (playStopText) playStopText.textContent = 'Stop';
    } else {
      playIcon?.classList.remove('hidden');
      stopIcon?.classList.add('hidden');
      if (playStopText) playStopText.textContent = 'Play';
    }
  }

  renderPresets() {
    const container = document.getElementById('presetsContainer');
    if (!container || typeof PRESETS === 'undefined') return;

    let html = '';
    Object.entries(PRESETS).forEach(([name, pattern]) => {
      html += `
        <button class="glass-btn px-3 py-2 rounded-xl text-white text-xs font-bold truncate" 
                data-preset="${name}"
                title="${name}: ${pattern}">
          ${name}
        </button>
      `;
    });

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetName = btn.dataset.preset;
        this.loadPreset(presetName);
      });
    });
  }

  loadPreset(name) {
    if (typeof PRESETS === 'undefined' || !this.app.tracks[0]) return;
    
    const pattern = PRESETS[name];
    if (pattern) {
      this.app.updateTrackPattern(this.app.tracks[0].id, pattern);
      this.renderTracks();
    }
  }

  renderSlots() {
    const container = document.getElementById('slotsContainer');
    if (!container) return;

    const slots = [
      { key: 'D', label: 'Dum', desc: 'Бас' },
      { key: 'T', label: 'Tak', desc: 'Высокий' },
      { key: 'K', label: 'Ka', desc: 'Ка' },
      { key: 'S', label: 'Slap', desc: 'Хлопок' },
      { key: 't', label: 'tek', desc: 'Лёгкий tak' },
      { key: 'k', label: 'kak', desc: 'Лёгкий ka' },
      { key: 'B', label: 'Bek', desc: 'Бек' },
      { key: 'R', label: 'Rest', desc: 'Пауза' }
    ];

    let html = '';
    slots.forEach(slot => {
      const isActive = this.app.selectedSlot === slot.key;
      html += `
        <div class="slot-card glass p-2 rounded-xl cursor-pointer text-center ${isActive ? 'active' : ''}" 
             data-slot="${slot.key}">
          <div class="text-white font-bold text-sm">${slot.label}</div>
          <div class="text-white/50 text-xs">${slot.desc}</div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('[data-slot]').forEach(card => {
      card.addEventListener('click', () => {
        this.app.selectSlot(card.dataset.slot);
      });
    });
  }

  updateSlots(selectedSlot) {
    document.querySelectorAll('[data-slot]').forEach(card => {
      card.classList.toggle('active', card.dataset.slot === selectedSlot);
    });
  }

  renderTracks() {
    const container = document.getElementById('tracksContainer');
    if (!container) return;

    let html = '';
    this.app.tracks.forEach((track, index) => {
      html += `
        <div class="track-card glass rounded-xl overflow-hidden track-enter" data-track-id="${track.id}">
          <div class="track-header-row" onclick="window.darbukaApp.openSequencer(${track.id})">
            <div class="track-name-area">
              <span class="status-dot ${track.muted ? 'red' : track.solo ? 'yellow' : 'green'}"></span>
              <span class="track-name-text">${track.name}</span>
            </div>
            <div class="flex items-center gap-1">
              <button class="track-sp-btn ${track.solo ? 'solo-on' : ''}" 
                      data-action="solo" 
                      data-track-id="${track.id}"
                      title="Solo">S</button>
              <button class="track-sp-btn ${track.muted ? 'mute-on' : ''}" 
                      data-action="mute" 
                      data-track-id="${track.id}"
                      title="Mute">M</button>
              <button class="track-sp-btn ${track.loop ? 'loop-on' : ''}" 
                      data-action="loop" 
                      data-track-id="${track.id}"
                      title="Loop">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="track-controls-row">
            <div class="track-vol-slider">
              <input type="range" min="0" max="100" value="${Math.round(track.volume * 100)}" 
                     data-action="volume" data-track-id="${track.id}">
            </div>
            <div class="track-move-btns">
              <button class="track-move-btn" data-action="move-up" data-track-id="${track.id}" ${index === 0 ? 'disabled' : ''}>▲</button>
              <button class="track-move-btn" data-action="move-down" data-track-id="${track.id}" ${index === this.app.tracks.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
            <button class="track-rename-btn" data-action="rename" data-track-id="${track.id}" title="Переименовать">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button class="track-del-btn" data-action="delete" data-track-id="${track.id}" title="Удалить">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
          <div class="px-4 pb-3">
            <div class="text-white/40 text-xs font-mono truncate">${track.pattern || 'Нажмите для редактирования...'}</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add event handlers
    this.attachTrackEventHandlers(container);
  }

  attachTrackEventHandlers(container) {
    // Volume sliders
    container.querySelectorAll('[data-action="volume"]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const trackId = parseInt(e.target.dataset.trackId);
        const track = this.app.tracks.find(t => t.id === trackId);
        if (track) {
          track.volume = e.target.value / 100;
        }
      });
    });

    // Mute/Solo/Loop buttons
    container.querySelectorAll('[data-action="solo"], [data-action="mute"], [data-action="loop"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = parseInt(e.target.closest('button').dataset.trackId);
        const action = e.target.closest('button').dataset.action;
        const track = this.app.tracks.find(t => t.id === trackId);
        
        if (track) {
          if (action === 'solo') {
            track.solo = !track.solo;
            if (track.solo) track.muted = false;
          } else if (action === 'mute') {
            track.muted = !track.muted;
            if (track.muted) track.solo = false;
          } else if (action === 'loop') {
            track.loop = !track.loop;
          }
          this.renderTracks();
        }
      });
    });

    // Move buttons
    container.querySelectorAll('[data-action="move-up"], [data-action="move-down"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = parseInt(e.target.closest('button').dataset.trackId);
        const action = e.target.closest('button').dataset.action;
        const direction = action === 'move-up' ? 'up' : 'down';
        this.app.moveTrack(trackId, direction);
      });
    });

    // Delete button
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = parseInt(e.target.closest('button').dataset.trackId);
        if (confirm('Удалить этот трек?')) {
          this.app.removeTrack(trackId);
        }
      });
    });

    // Rename button
    container.querySelectorAll('[data-action="rename"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = parseInt(e.target.closest('button').dataset.trackId);
        const track = this.app.tracks.find(t => t.id === trackId);
        
        if (track) {
          const newName = prompt('Введите новое имя трека:', track.name);
          if (newName && newName.trim()) {
            track.name = newName.trim();
            this.renderTracks();
          }
        }
      });
    });
  }
}

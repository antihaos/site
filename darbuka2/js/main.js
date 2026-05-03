/**
 * Darbuka Tab Player Pro - Main Application Module
 * Refactored modular architecture
 */

import { AudioEngine } from './audio-engine.js';
import { Sequencer } from './sequencer.js';
import { UIManager } from './ui-manager.js';
import { Visualizer } from './visualizer.js';
import { ProjectManager } from './project-manager.js';
import { Utils } from './utils.js';

class DarbukaApp {
  constructor() {
    this.audioEngine = null;
    this.sequencer = null;
    this.uiManager = null;
    this.visualizer = null;
    this.projectManager = null;
    this.isPlaying = false;
    this.isRecording = false;
    this.bpm = 120;
    this.swing = 0;
    this.volume = 0.8;
    this.beatDivision = 0.5;
    this.metronomeEnabled = false;
    this.tracks = [];
    this.selectedSlot = 'D';
    
    this.init();
  }

  async init() {
    try {
      // Initialize audio engine
      this.audioEngine = new AudioEngine();
      await this.audioEngine.init();

      // Initialize other modules
      this.sequencer = new Sequencer(this);
      this.visualizer = new Visualizer(this);
      this.projectManager = new ProjectManager(this);
      this.uiManager = new UIManager(this);

      // Initialize UI
      this.uiManager.init();
      
      // Create default track
      this.addTrack('Track 1');
      
      // Render presets
      this.uiManager.renderPresets();
      
      // Render slots
      this.uiManager.renderSlots();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start visualizer
      this.visualizer.start();
      
      console.log('Darbuka Tab Pro initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      alert('Ошибка инициализации приложения. Пожалуйста, обновите страницу.');
    }
  }

  setupEventListeners() {
    // Play/Stop button
    document.getElementById('playStopBtn').addEventListener('click', () => this.togglePlay());
    
    // Record button
    document.getElementById('recordBtn').addEventListener('click', () => this.toggleRecord());
    
    // BPM controls
    const bpmInput = document.getElementById('bpmInput');
    const bpmSlider = document.getElementById('bpmSlider');
    
    bpmInput.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (value >= 30 && value <= 300) {
        this.setBPM(value);
        bpmSlider.value = value;
      }
    });
    
    bpmSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.setBPM(value);
      bpmInput.value = value;
    });
    
    // Swing slider
    const swingSlider = document.getElementById('swingSlider');
    const swingValue = document.getElementById('swingValue');
    
    swingSlider.addEventListener('input', (e) => {
      this.swing = parseFloat(e.target.value);
      swingValue.textContent = Math.round(this.swing * 100) + '%';
    });
    
    // Volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    
    volumeSlider.addEventListener('input', (e) => {
      this.volume = parseInt(e.target.value) / 100;
      volumeValue.textContent = e.target.value + '%';
      this.audioEngine.setMasterVolume(this.volume);
    });
    
    // Metronome button
    document.getElementById('metroBtn').addEventListener('click', (e) => {
      this.metronomeEnabled = !this.metronomeEnabled;
      e.target.classList.toggle('metro-active', this.metronomeEnabled);
    });
    
    // Beat division buttons
    document.querySelectorAll('.beat-val-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.beat-val-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.beatDivision = parseFloat(e.target.dataset.beat);
      });
    });
    
    // EQ button
    document.getElementById('eqBtn').addEventListener('click', () => {
      document.getElementById('eqModal').classList.remove('modal-hidden');
      document.getElementById('eqModal').classList.add('modal-visible');
      setTimeout(() => {
        document.querySelector('#eqModal .modal-panel-hidden').classList.remove('modal-panel-hidden');
        document.querySelector('#eqModal .modal-panel-visible') || 
          document.querySelector('#eqModal > div > div').classList.add('modal-panel-visible');
      }, 10);
    });
    
    document.getElementById('closeEqBtn').addEventListener('click', () => {
      this.closeEqModal();
    });
    
    document.getElementById('resetEqBtn').addEventListener('click', () => {
      document.getElementById('eqLow').value = 0;
      document.getElementById('eqMid').value = 0;
      document.getElementById('eqHigh').value = 0;
      this.audioEngine.setEQ(0, 0, 0);
    });
    
    // EQ sliders
    ['eqLow', 'eqMid', 'eqHigh'].forEach(id => {
      document.getElementById(id).addEventListener('input', (e) => {
        const low = parseFloat(document.getElementById('eqLow').value);
        const mid = parseFloat(document.getElementById('eqMid').value);
        const high = parseFloat(document.getElementById('eqHigh').value);
        this.audioEngine.setEQ(low, mid, high);
      });
    });
    
    // Add track button
    document.getElementById('addTrackBtn').addEventListener('click', () => {
      this.addTrack(`Track ${this.tracks.length + 1}`);
    });
    
    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.projectManager.exportProject();
    });
    
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    
    document.getElementById('importFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.projectManager.importProject(file);
      }
      e.target.value = '';
    });
    
    // Close modals on outside click
    ['sequencerModal', 'eqModal'].forEach(modalId => {
      document.getElementById(modalId).addEventListener('click', (e) => {
        if (e.target === document.getElementById(modalId)) {
          this.closeModal(modalId);
        }
      });
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.audioEngine.ctx) return;
    
    this.isPlaying = true;
    this.sequencer.start();
    this.uiManager.updatePlayButton(true);
  }

  stop() {
    this.isPlaying = false;
    this.sequencer.stop();
    this.uiManager.updatePlayButton(false);
  }

  toggleRecord() {
    this.isRecording = !this.isRecording;
    const recordBtn = document.getElementById('recordBtn');
    recordBtn.classList.toggle('rec-active', this.isRecording);
    
    if (this.isRecording && !this.isPlaying) {
      this.play();
    }
  }

  setBPM(value) {
    this.bpm = Math.max(30, Math.min(300, value));
    if (this.isPlaying) {
      this.sequencer.restart();
    }
  }

  addTrack(name = 'New Track') {
    const track = {
      id: Date.now(),
      name: name,
      pattern: '',
      volume: 1,
      muted: false,
      solo: false,
      loop: false
    };
    
    this.tracks.push(track);
    this.uiManager.renderTracks();
    return track;
  }

  removeTrack(trackId) {
    if (this.tracks.length <= 1) {
      alert('Нельзя удалить последний трек');
      return;
    }
    
    this.tracks = this.tracks.filter(t => t.id !== trackId);
    this.uiManager.renderTracks();
  }

  moveTrack(trackId, direction) {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.tracks.length) return;
    
    [this.tracks[index], this.tracks[newIndex]] = [this.tracks[newIndex], this.tracks[index]];
    this.uiManager.renderTracks();
  }

  updateTrackPattern(trackId, pattern) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.pattern = pattern;
    }
  }

  selectSlot(slot) {
    this.selectedSlot = slot;
    this.uiManager.updateSlots(this.selectedSlot);
  }

  closeEqModal() {
    const modal = document.getElementById('eqModal');
    modal.classList.remove('modal-visible');
    modal.classList.add('modal-hidden');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('modal-visible');
    modal.classList.add('modal-hidden');
  }

  openSequencer(trackId) {
    const track = this.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    this.sequencer.open(track);
    const modal = document.getElementById('sequencerModal');
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    setTimeout(() => {
      document.querySelector('#sequencerModal .modal-panel-hidden').classList.remove('modal-panel-hidden');
      document.querySelector('#sequencerModal .modal-panel-visible') || 
        document.querySelector('#sequencerModal > div > div').classList.add('modal-panel-visible');
    }, 10);
  }

  closeSequencer() {
    this.closeModal('sequencerModal');
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.darbukaApp = new DarbukaApp();
});

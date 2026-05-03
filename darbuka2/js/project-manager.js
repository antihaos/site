/**
 * Project Manager Module
 * Handles saving, loading, exporting and importing projects
 */

export class ProjectManager {
  constructor(app) {
    this.app = app;
  }

  getProjectData() {
    return {
      version: '2.0',
      bpm: this.app.bpm,
      swing: this.app.swing,
      volume: this.app.volume,
      beatDivision: this.app.beatDivision,
      metronomeEnabled: this.app.metronomeEnabled,
      tracks: this.app.tracks.map(track => ({
        id: track.id,
        name: track.name,
        pattern: track.pattern,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
        loop: track.loop
      }))
    };
  }

  loadProjectData(data) {
    if (!data || !data.tracks) return false;

    this.app.bpm = data.bpm || 120;
    this.app.swing = data.swing || 0;
    this.app.volume = data.volume || 0.8;
    this.app.beatDivision = data.beatDivision || 0.5;
    this.app.metronomeEnabled = data.metronomeEnabled || false;

    this.app.tracks = data.tracks.map(track => ({
      ...track,
      id: track.id || Date.now() + Math.random()
    }));

    // Update UI
    const bpmInput = document.getElementById('bpmInput');
    const bpmSlider = document.getElementById('bpmSlider');
    const swingSlider = document.getElementById('swingSlider');
    const swingValue = document.getElementById('swingValue');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');

    if (bpmInput) bpmInput.value = this.app.bpm;
    if (bpmSlider) bpmSlider.value = this.app.bpm;
    if (swingSlider) swingSlider.value = this.app.swing;
    if (swingValue) swingValue.textContent = Math.round(this.app.swing * 100) + '%';
    if (volumeSlider) volumeSlider.value = Math.round(this.app.volume * 100);
    if (volumeValue) volumeValue.textContent = Math.round(this.app.volume * 100) + '%';

    this.app.uiManager.renderTracks();
    
    return true;
  }

  exportProject() {
    const data = this.getProjectData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `darbuka-project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importProject(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (this.loadProjectData(data)) {
          alert('Проект успешно загружен!');
        } else {
          alert('Ошибка: неверный формат проекта');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Ошибка при загрузке проекта: ' + error.message);
      }
    };
    
    reader.onerror = () => {
      alert('Ошибка чтения файла');
    };
    
    reader.readAsText(file);
  }

  saveToLocalStorage(key = 'darbuka-project') {
    try {
      const data = this.getProjectData();
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Save error:', error);
      return false;
    }
  }

  loadFromLocalStorage(key = 'darbuka-project') {
    try {
      const json = localStorage.getItem(key);
      if (json) {
        const data = JSON.parse(json);
        return this.loadProjectData(data);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
    return false;
  }

  async exportAsWav() {
    // Basic WAV export functionality
    alert('Экспорт в WAV будет доступен в следующей версии!');
    
    // Future implementation would use OfflineAudioContext
    // to render the entire project to a buffer and encode as WAV
  }

  generateShareLink() {
    const data = this.getProjectData();
    const json = JSON.stringify(data);
    const encoded = btoa(encodeURIComponent(json));
    
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?project=${encoded}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Ссылка скопирована в буфер обмена!');
    }).catch(err => {
      prompt('Скопируйте ссылку:', shareUrl);
    });
    
    return shareUrl;
  }

  loadFromShareLink() {
    const params = new URLSearchParams(window.location.search);
    const projectData = params.get('project');
    
    if (projectData) {
      try {
        const decoded = decodeURIComponent(atob(projectData));
        const data = JSON.parse(decoded);
        return this.loadProjectData(data);
      } catch (error) {
        console.error('Failed to load from share link:', error);
        return false;
      }
    }
    return false;
  }

  clearLocalStorage(key = 'darbuka-project') {
    localStorage.removeItem(key);
  }
}

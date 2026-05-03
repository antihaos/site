/**
 * Audio Engine Module
 * Handles Web Audio API, sample loading, and audio processing
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.eqLow = null;
    this.eqMid = null;
    this.eqHigh = null;
    this.samples = {};
    this.sampleBuffers = {};
    this.reverbNode = null;
    this.convolver = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      // Create audio context
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      
      // Create EQ nodes
      this.eqLow = this.ctx.createBiquadFilter();
      this.eqLow.type = 'lowshelf';
      this.eqLow.frequency.value = 320;
      
      this.eqMid = this.ctx.createBiquadFilter();
      this.eqMid.type = 'peaking';
      this.eqMid.frequency.value = 1000;
      this.eqMid.Q.value = 1;
      
      this.eqHigh = this.ctx.createBiquadFilter();
      this.eqHigh.type = 'highshelf';
      this.eqHigh.frequency.value = 3200;
      
      // Create reverb
      this.convolver = this.ctx.createConvolver();
      this.createReverbImpulse();
      
      // Connect EQ chain
      this.eqLow.connect(this.eqMid);
      this.eqMid.connect(this.eqHigh);
      this.eqHigh.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      
      // Load built-in samples
      await this.loadSamples();
      
      this.isInitialized = true;
      console.log('Audio Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Audio Engine:', error);
      throw error;
    }
  }

  createReverbImpulse() {
    if (!this.ctx || !this.convolver) return;
    
    const duration = 2;
    const decay = 2;
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    this.convolver.buffer = impulse;
  }

  async loadSamples() {
    if (typeof SAMPLES === 'undefined') {
      console.warn('SAMPLES not loaded, using synthetic sounds');
      this.generateSyntheticSamples();
      return;
    }

    const loadPromises = [];
    for (const [key, sampleData] of Object.entries(SAMPLES)) {
      loadPromises.push(
        this.decodeSample(sampleData.bufferB64)
          .then(buffer => {
            this.sampleBuffers[key] = buffer;
            console.log(`Loaded sample: ${key}`);
          })
          .catch(error => {
            console.error(`Failed to load sample ${key}:`, error);
          })
      );
    }

    await Promise.all(loadPromises);
    
    if (Object.keys(this.sampleBuffers).length === 0) {
      console.warn('No samples loaded, generating synthetic sounds');
      this.generateSyntheticSamples();
    }
  }

  generateSyntheticSamples() {
    // Generate synthetic drum sounds as fallback
    const notes = ['D', 'T', 'K', 'S', 't', 'k', 'B'];
    const configs = {
      'D': { freq: 80, decay: 0.3, type: 'sine' },
      'T': { freq: 400, decay: 0.1, type: 'triangle' },
      'K': { freq: 300, decay: 0.15, type: 'square' },
      'S': { freq: 600, decay: 0.05, type: 'sawtooth' },
      't': { freq: 350, decay: 0.08, type: 'triangle' },
      'k': { freq: 250, decay: 0.1, type: 'square' },
      'B': { freq: 200, decay: 0.2, type: 'sine' }
    };

    notes.forEach(note => {
      const config = configs[note];
      if (!config) return;
      
      const duration = 0.5;
      const sampleRate = 44100;
      const length = sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * (1 / config.decay));
        const noise = Math.random() * 0.1;
        
        let sample;
        if (config.type === 'sine') {
          sample = Math.sin(2 * Math.PI * config.freq * t);
        } else if (config.type === 'triangle') {
          sample = 2 * Math.abs(2 * (config.freq * t - Math.floor(config.freq * t + 0.5))) - 1;
        } else if (config.type === 'square') {
          sample = Math.sign(Math.sin(2 * Math.PI * config.freq * t));
        } else {
          sample = 2 * (config.freq * t - Math.floor(config.freq * t + 0.5));
        }
        
        data[i] = (sample + noise) * envelope * 0.5;
      }
      
      this.sampleBuffers[note] = buffer;
    });
    
    console.log('Generated synthetic samples');
  }

  async decodeSample(base64Data) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.ctx) {
          reject(new Error('Audio context not initialized'));
          return;
        }
        
        // Parse the base64-like data structure
        const data = JSON.parse(base64Data);
        
        // Create audio buffer
        const numChannels = data.numberOfChannels || 1;
        const buffer = this.ctx.createBuffer(
          numChannels,
          data.length,
          data.sampleRate || 44100
        );
        
        // Process each channel
        for (let ch = 0; ch < numChannels; ch++) {
          const channelData = buffer.getChannelData(ch);
          
          if (data.channels && data.channels[ch]) {
            const decoded = atob(data.channels[ch]);
            const bytes = new Uint8Array(decoded.length);
            for (let i = 0; i < decoded.length; i++) {
              bytes[i] = decoded.charCodeAt(i);
            }
            
            // Convert bytes to floats (assuming Float32)
            const floats = new Float32Array(bytes.buffer);
            for (let i = 0; i < Math.min(floats.length, channelData.length); i++) {
              channelData[i] = floats[i];
            }
          }
        }
        
        resolve(buffer);
      } catch (error) {
        console.error('Decode sample error:', error);
        reject(error);
      }
    });
  }

  async loadCustomSample(file, noteKey) {
    if (!this.ctx || !file) return false;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.sampleBuffers[noteKey] = audioBuffer;
      console.log(`Loaded custom sample for ${noteKey}`);
      return true;
    } catch (error) {
      console.error(`Failed to load custom sample for ${noteKey}:`, error);
      return false;
    }
  }

  playSample(note, velocity = 1, time = null) {
    if (!this.ctx || !this.sampleBuffers[note]) return null;
    
    const source = this.ctx.createBufferSource();
    source.buffer = this.sampleBuffers[note];
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = velocity;
    
    source.connect(gainNode);
    gainNode.connect(this.eqLow);
    
    const playTime = time || this.ctx.currentTime;
    source.start(playTime);
    
    return { source, gainNode, startTime: playTime };
  }

  setMasterVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, value)),
        this.ctx.currentTime
      );
    }
  }

  setEQ(low, mid, high) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    if (this.eqLow) {
      this.eqLow.gain.setValueAtTime(Math.max(-12, Math.min(12, low)), now);
    }
    if (this.eqMid) {
      this.eqMid.gain.setValueAtTime(Math.max(-12, Math.min(12, mid)), now);
    }
    if (this.eqHigh) {
      this.eqHigh.gain.setValueAtTime(Math.max(-12, Math.min(12, high)), now);
    }
  }

  setReverb(amount) {
    if (!this.convolver || !this.ctx) return;
    // Reverb implementation would require additional routing
    console.log('Reverb amount:', amount);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      return this.ctx.suspend();
    }
    return Promise.resolve();
  }

  getCurrentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  getSampleRate() {
    return this.ctx ? this.ctx.sampleRate : 44100;
  }

  dispose() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.sampleBuffers = {};
    this.isInitialized = false;
  }
}

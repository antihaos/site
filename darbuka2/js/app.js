      theme: {
        extend: {
          colors: {
            glass: 'rgba(255,255,255,0.06)',
            glassBorder: 'rgba(255,255,255,0.12)',
          }
        }
      }
    }
  </script>
  <script>
    (function() {
      'use strict';

      if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
          var rad = Array.isArray(r) ? r : [r, r, r, r];
          this.moveTo(x + rad[0], y);
          this.lineTo(x + w - rad[1], y);
          this.quadraticCurveTo(x + w, y, x + w, y + rad[1]);
          this.lineTo(x + w, y + h - rad[2]);
          this.quadraticCurveTo(x + w, y + h, x + w - rad[2], y + h);
          this.lineTo(x + rad[3], y + h);
          this.quadraticCurveTo(x, y + h, x, y + h - rad[3]);
          this.lineTo(x, y + rad[0]);
          this.quadraticCurveTo(x, y, x + rad[0], y);
          this.closePath();
          return this;
        };
      }

      try {
        var mf = { name: "Darbuka Tab Player", short_name: "Darbuka", start_url: ".", display: "standalone", background_color: "#0b1120", theme_color: "#0b1120" };
        var bf = new Blob([JSON.stringify(mf)], {type: 'application/json'});
        document.head.appendChild(Object.assign(document.createElement('link'), {rel: 'manifest', href: URL.createObjectURL(bf)}));
      } catch(e) {}

      var NUM_SLOTS = 16, currentSlot = 1, selectedSlotInModal = 0;
      var customSamples = {};
      var pendingSampleData = null;
      var sampleStorageLimit = 1500000;
      var hasUnsavedChanges = false;
      var LOOP_MAX_CYCLES = 100;
      var pendingImportData = null;

      var els = {
        bpm: document.getElementById('bpm'), bpmUp: document.getElementById('bpmUp'), bpmDown: document.getElementById('bpmDown'),
        beatVal4: document.getElementById('beatVal4'), beatVal8: document.getElementById('beatVal8'), beatVal16: document.getElementById('beatVal16'),
        volume: document.getElementById('volume'), volumeVal: document.getElementById('volumeVal'),
        swing: document.getElementById('swing'), swingVal: document.getElementById('swingVal'),
        playStopBtn: document.getElementById('playStopBtn'), playStopIcon: document.getElementById('playStopIcon'), playStopText: document.getElementById('playStopText'),
        recBtn: document.getElementById('recBtn'), recIcon: document.getElementById('recIcon'), recOverlay: document.getElementById('recOverlay'),
        metronomeBtn: document.getElementById('metronomeBtn'), metroIcon: document.getElementById('metroIcon'),
        openSettings: document.getElementById('openSettings'), openPresets: document.getElementById('openPresets'), openEQ: document.getElementById('openEQ'), openSeq: document.getElementById('openSeq'),
        saveBtn: document.getElementById('saveBtn'), loadBtn: document.getElementById('loadBtn'), clearBtn: document.getElementById('clearBtn'),
        addTrackBtn: document.getElementById('addTrackBtn'), exportBtn: document.getElementById('exportBtn'), exportWavBtn: document.getElementById('exportWavBtn'),
        importBtn: document.getElementById('importBtn'), importFile: document.getElementById('importFile'),
        tabEditor: document.getElementById('tabEditor'), tabPreview: document.getElementById('tabPreview'),
        editorPanel: document.getElementById('editorPanel'), previewPanel: document.getElementById('previewPanel'),
        noteDisplay: document.getElementById('noteDisplay'), tracksContainer: document.getElementById('tracksContainer'),
        status: document.getElementById('status'), noteCount: document.getElementById('noteCount'),
        canvas: document.getElementById('visualizer'),
        settingsModal: document.getElementById('settingsModal'), settingsPanel: document.getElementById('settingsPanel'),
        closeSettings: document.getElementById('closeSettings'), settingsGrid: document.getElementById('settingsGrid'),
        saveSettings: document.getElementById('saveSettings'), resetAllSamples: document.getElementById('resetAllSamples'),
        currentSlotBtn: document.getElementById('currentSlotBtn'), openSlotsBtn: document.getElementById('openSlotsBtn'),
        slotsModal: document.getElementById('slotsModal'), slotsPanel: document.getElementById('slotsPanel'),
        closeSlots: document.getElementById('closeSlots'), slotsGrid: document.getElementById('slotsGrid'),
        selectSlotBtn: document.getElementById('selectSlotBtn'), loadSelectedSlot: document.getElementById('loadSelectedSlot'), deleteSlotBtn: document.getElementById('deleteSlotBtn'),
        presetsModal: document.getElementById('presetsModal'), presetsPanel: document.getElementById('presetsPanel'),
        closePresets: document.getElementById('closePresets'), presetsGrid: document.getElementById('presetsGrid'),
        eqModal: document.getElementById('eqModal'), eqPanel: document.getElementById('eqPanel'),
        closeEQ: document.getElementById('closeEQ'), eqLow: document.getElementById('eqLow'), eqMid: document.getElementById('eqMid'), eqHigh: document.getElementById('eqHigh'),
        eqLowVal: document.getElementById('eqLowVal'), eqMidVal: document.getElementById('eqMidVal'), eqHighVal: document.getElementById('eqHighVal'),
        resetEQ: document.getElementById('resetEQ'),
        seqModal: document.getElementById('seqModal'), seqPanel: document.getElementById('seqPanel'),
        closeSeq: document.getElementById('closeSeq'), seqGrid: document.getElementById('seqGrid'),
        seqPlayBtn: document.getElementById('seqPlayBtn'), seqClearBtn: document.getElementById('seqClearBtn'), seqExportTabBtn: document.getElementById('seqExportTabBtn'),
        exportModal: document.getElementById('exportModal'), exportPanel: document.getElementById('exportPanel'),
        closeExport: document.getElementById('closeExport'), exportWithSamples: document.getElementById('exportWithSamples'),
        cancelExport: document.getElementById('cancelExport'), confirmExport: document.getElementById('confirmExport'),
        importModal: document.getElementById('importModal'), importPanel: document.getElementById('importPanel'),
        closeImport: document.getElementById('closeImport'), importWithSamples: document.getElementById('importWithSamples'),
        cancelImport: document.getElementById('cancelImport'), confirmImport: document.getElementById('confirmImport'),
        importFileInfo: document.getElementById('importFileInfo')
      };

      var NOTE_INFO = {
        D:  { label:'Dum',  css:'d' }, T:  { label:'Tak',  css:'t' }, K:  { label:'Ka',   css:'k' }, S:  { label:'Slap', css:'s' },
        t:  { label:'tek',  css:'lt' }, k:  { label:'kak',  css:'lk' }, B:  { label:'Bek',  css:'b' }, R:  { label:'Rest', css:'r' }
      };

      var SEQ_NOTES = ['D', 'T', 'K', 'S', 't', 'k', 'B'];
      var seqState = [];
      for (var si = 0; si < SEQ_NOTES.length; si++) {
        seqState.push(new Array(16).fill(false));
      }

      var ctx2d = els.canvas.getContext('2d');
      var resizeCanvas = function() { var r = els.canvas.getBoundingClientRect(); if (r.width > 0 && r.height > 0) { els.canvas.width = r.width * window.devicePixelRatio; els.canvas.height = r.height * window.devicePixelRatio; ctx2d.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0); } };
      resizeCanvas(); window.addEventListener('resize', resizeCanvas);

      var audioCtx = null, masterGain = null, analyser = null, schedulerTimer = null, animFrameId = null;
      var reverbNode = null, reverbGainNode = null, dryGainNode = null, metroGainNode = null;
      var eqLowNode = null, eqMidNode = null, eqHighNode = null;
      var isPlaying = false, currentIdx = 0, playbackStartTime = 0, nextMetroTime = 0;
      var notes = [], beatGroups = [], bpm = 120, volume = 0.8, swing = 0;
      var beatValueDenom = 4;
      var activePills = [], impulseBuffer = null, metronomeEnabled = false;
      var LOOKAHEAD_MS = 25.0, SCHEDULE_AHEAD_S = 0.1;
      var TRACK_COLORS = ['#60a5fa','#c084fc','#facc15','#f87171','#34d399','#fb923c','#38bdf8','#e879f9'];
      var tracks = [];
      var trackIdCounter = 0;
      var isRecording = false, recordStartTime = 0, recordedEvents = [];

      var getTrackColor = function(id) { return TRACK_COLORS[(id - 1) % TRACK_COLORS.length]; };

      var getBeatDuration = function(bpmVal, bvDenom) {
        return (60.0 / bpmVal) * (1 / bvDenom);
      };

      var createTrack = function(name) {
        trackIdCounter++;
        return { id: trackIdCounter, name: name || ('Дорожка ' + trackIdCounter), tab: '', volume: 1.0, muted: false, solo: false, loop: false };
      };

      var initTracks = function() { if (tracks.length === 0) tracks.push(createTrack('Основная')); };

      var readTrackTabsFromDOM = function() {
        tracks.forEach(function(track) {
          var ta = document.querySelector('[data-track-tab="' + track.id + '"]');
          if (ta) track.tab = ta.value;
        });
      };

      var renderTracks = function() {
        els.tracksContainer.innerHTML = '';
        tracks.forEach(function(track, tIdx) {
          var card = document.createElement('div');
          card.className = 'track-card track-enter glass rounded-2xl' + (track.muted ? ' muted' : '') + (track.loop ? ' looping' : '');
          card.style.animationDelay = (tIdx * 0.04) + 's';
          card.dataset.trackId = track.id;
          var dot = getTrackColor(track.id);
          var anySolo = tracks.some(function(t) { return t.solo; });
          var isActive = !anySolo || track.solo;

          var headerHtml = '<div class="track-header-row" data-track-header="' + track.id + '">';
          headerHtml += '<div class="track-name-area">';
          headerHtml += '<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:' + dot + '; box-shadow: 0 0 6px ' + dot + '"></span>';
          headerHtml += '<span class="track-name-text" data-track-name="' + track.id + '">' + track.name + '</span>';
          headerHtml += '<button class="track-rename-btn" data-rename-track="' + track.id + '" title="Переименовать">✎</button>';
          headerHtml += '</div>';
          headerHtml += '<button class="track-del-btn" data-remove-track="' + track.id + '" title="Удалить">✕</button>';
          headerHtml += '</div>';

          var controlsHtml = '<div class="track-controls-row">';
          controlsHtml += '<button class="track-sp-btn' + (track.solo ? ' solo-on' : '') + '" data-toggle-solo="' + track.id + '" title="Соло">С</button>';
          controlsHtml += '<button class="track-sp-btn' + (track.muted ? ' mute-on' : '') + '" data-toggle-mute="' + track.id + '" title="Приглушить">П</button>';
          controlsHtml += '<button class="track-sp-btn' + (track.loop ? ' loop-on' : '') + '" data-toggle-loop="' + track.id + '" title="Зациклить">З</button>';
          
          controlsHtml += '<span class="text-[10px] text-white/30 uppercase font-bold shrink-0 ml-1">Громк.</span>';
          controlsHtml += '<div class="track-vol-slider"><input type="range" min="0" max="1" step="0.05" value="' + track.volume + '" data-track-vol="' + track.id + '"></div>';
          
          controlsHtml += '<div class="track-move-btns">';
          controlsHtml += '<button class="track-move-btn" data-track-move-up="' + track.id + '" title="Вверх">▲</button>';
          controlsHtml += '<button class="track-move-btn" data-track-move-down="' + track.id + '" title="Вниз">▼</button>';
          controlsHtml += '</div>';
          controlsHtml += '</div>';

          var bodyHtml = '<div class="track-body-visible px-2 pb-2" data-track-body="' + track.id + '">';
          bodyHtml += '<textarea class="w-full h-16 md:h-20 lg:h-24 bg-black/20 border border-white/10 rounded-xl p-2.5 font-mono text-xs md:text-sm leading-relaxed resize-y focus:ring-2 focus:ring-blue-400/40 focus:border-transparent placeholder-white/15 transition-all" data-track-tab="' + track.id + '" placeholder="D T2 (DK) S — D=Dum, T=Tak, K=Ka, S=Slap, -=Rest"';
          if (!isActive) bodyHtml += ' disabled style="opacity:0.4"';
          bodyHtml += '>' + track.tab + '</textarea></div>';

          card.innerHTML = headerHtml + controlsHtml + bodyHtml;
          els.tracksContainer.appendChild(card);

          card.querySelector('[data-track-header="' + track.id + '"]').addEventListener('click', function(e) {
            if (e.target.closest('[data-rename-track]')) return;
            if (e.target.closest('[data-remove-track]')) return;
            var body = card.querySelector('[data-track-body="' + track.id + '"]');
            body.classList.toggle('track-body-hidden');
            body.classList.toggle('track-body-visible');
          });

          card.querySelector('[data-rename-track="' + track.id + '"]').addEventListener('click', function(e) {
            e.stopPropagation();
            startRenameTrack(track);
          });

          card.querySelector('[data-toggle-solo="' + track.id + '"]').addEventListener('click', function(e) {
            e.stopPropagation(); track.solo = !track.solo;
            if (track.solo) tracks.forEach(function(t) { if (t.id !== track.id) t.solo = false; });
            renderTracks(); updateNoteInfo();
          });

          card.querySelector('[data-toggle-mute="' + track.id + '"]').addEventListener('click', function(e) {
            e.stopPropagation(); track.muted = !track.muted;
            renderTracks(); updateNoteInfo();
          });

          card.querySelector('[data-toggle-loop="' + track.id + '"]').addEventListener('click', function(e) {
            e.stopPropagation(); track.loop = !track.loop;
            renderTracks(); updateNoteInfo(); markUnsaved();
          });

          card.querySelector('[data-track-vol="' + track.id + '"]').addEventListener('input', function(e) {
            e.stopPropagation(); track.volume = parseFloat(e.target.value);
          });

          card.querySelector('[data-remove-track="' + track.id + '"]').addEventListener('click', function(e) {
            e.stopPropagation();
            if (tracks.length <= 1) { setStatus('⚠️ Нужна минимум 1 дорожка', 'text-yellow-300'); return; }
            tracks = tracks.filter(function(t) { return t.id !== track.id; });
            renderTracks(); updateNoteInfo(); markUnsaved();
          });

          card.querySelector('[data-track-tab="' + track.id + '"]').addEventListener('input', function(e) {
            track.tab = e.target.value;
            markUnsaved(); updateNoteInfo();
          });

          card.querySelector('[data-track-move-up="' + track.id + '"]').addEventListener('click', function(e) {
            e.stopPropagation();
            var idx = tracks.findIndex(function(t) { return t.id === track.id; });
            if (idx > 0) {
              var tmp = tracks[idx - 1];
              tracks[idx - 1] = tracks[idx];
              tracks[idx] = tmp;
              renderTracks(); markUnsaved();
            }
          });

          card.querySelector('[data-track-move-down="' + track.id + '"]').addEventListener('click', function(e) {
            e.stopPropagation();
            var idx = tracks.findIndex(function(t) { return t.id === track.id; });
            if (idx < tracks.length - 1) {
              var tmp = tracks[idx + 1];
              tracks[idx + 1] = tracks[idx];
              tracks[idx] = tmp;
              renderTracks(); markUnsaved();
            }
          });
        });
      };

      var startRenameTrack = function(track) {
        var nameSpan = document.querySelector('[data-track-name="' + track.id + '"]');
        if (!nameSpan) return;
        var currentName = track.name;
        nameSpan.style.display = 'none';
        
        var renameBtn = document.querySelector('[data-rename-track="' + track.id + '"]');
        var nameArea = nameSpan.parentElement;
        
        var input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'rename-input';
        input.maxLength = 30;
        nameArea.insertBefore(input, renameBtn);
        input.focus();
        input.select();

        var finishRename = function() {
          var newName = input.value.trim() || currentName;
          track.name = newName;
          if (input.parentNode) input.parentNode.removeChild(input);
          nameSpan.style.display = '';
          nameSpan.textContent = newName;
          markUnsaved();
        };

        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
          if (e.key === 'Escape') { input.value = currentName; input.blur(); }
          e.stopPropagation();
        });
        input.addEventListener('click', function(e) { e.stopPropagation(); });
      };

      var markUnsaved = function() { hasUnsavedChanges = true; };

      var floatArrayToBase64 = function(float32Arr) {
        try {
          var uint8 = new Uint8Array(float32Arr.length * 4);
          var view = new DataView(uint8.buffer);
          for (var i = 0; i < float32Arr.length; i++) {
            view.setFloat32(i * 4, float32Arr[i], true);
          }
          var binary = '';
          var chunkSize = 8192;
          for (var i = 0; i < uint8.length; i += chunkSize) {
            var chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
            binary += String.fromCharCode.apply(null, chunk);
          }
          return btoa(binary);
        } catch(e) { return null; }
      };

      var audioBufferToBase64 = function(buffer) {
        try {
          var channels = [];
          for (var c = 0; c < buffer.numberOfChannels; c++) {
            var b64 = floatArrayToBase64(buffer.getChannelData(c));
            if (!b64) return null;
            channels.push(b64);
          }
          return JSON.stringify({ sampleRate: buffer.sampleRate, numberOfChannels: buffer.numberOfChannels, length: buffer.length, channels: channels });
        } catch(e) { return null; }
      };

      var base64ToAudioBuffer = function(jsonStr) {
        if (!audioCtx) return null;
        try {
          var data = JSON.parse(jsonStr);
          var buffer = audioCtx.createBuffer(data.numberOfChannels, data.length, data.sampleRate);
          for (var c = 0; c < data.numberOfChannels; c++) {
            var raw = atob(data.channels[c]);
            var bytes = new Uint8Array(raw.length);
            for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
            var floatData = new Float32Array(bytes.buffer, 0, data.length);
            buffer.getChannelData(c).set(floatData);
          }
          return buffer;
        } catch(e) { return null; }
      };

      var saveSamplesToStorage = function() {
        var sampleData = {};
        for (var key in customSamples) {
          if (customSamples[key] && customSamples[key].buffer) {
            try {
              var b64 = audioBufferToBase64(customSamples[key].buffer);
              if (b64 && b64.length < sampleStorageLimit) {
                sampleData[key] = { name: customSamples[key].name, bufferB64: b64 };
              }
            } catch(e) {}
          }
        }
        try {
          localStorage.setItem('darbuka_samples_v', JSON.stringify(sampleData));
          return true;
        } catch(e) { return false; }
      };

      var loadSamplesFromStorage = function() {
        try {
          var raw = localStorage.getItem('darbuka_samples_v');
          if (!raw) {
            pendingSampleData = SAMPLES;
          } else {
            pendingSampleData = JSON.parse(raw);
          }
        } catch(e) { console.error('Ошибка загрузки сэмплов:', e); }
      };

      var decodePendingSamples = function() {
        if (!audioCtx || !pendingSampleData) return;
        var count = 0;
        for (var key in pendingSampleData) {
          if (pendingSampleData[key] && pendingSampleData[key].bufferB64) {
            var buf = base64ToAudioBuffer(pendingSampleData[key].bufferB64);
            if (buf) {
              customSamples[key] = { buffer: buf, name: pendingSampleData[key].name };
              count++;
            }
          }
        }
        pendingSampleData = null;
        if (count > 0) setStatus('📂 Загружено ' + count + ' сэмплов', 'text-cyan-300');
      };

      var createImpulseResponse = function() {
        if (!audioCtx || audioCtx.sampleRate <= 0) return null;
        var length = Math.floor(audioCtx.sampleRate * 2.0);
        var impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
        var left = impulse.getChannelData(0), right = impulse.getChannelData(1);
        for (var i = 0; i < length; i++) {
          var t = i / audioCtx.sampleRate;
          var decay = Math.exp(-t * 4.0) * (1 + Math.sin(t * 12) * 0.2);
          left[i] = (Math.random() * 2 - 1) * decay;
          right[i] = (Math.random() * 2 - 1) * decay * 0.9;
          if (i < 50) { left[i] *= i / 50; right[i] *= i / 50; }
        }
        return impulse;
      };

      var initAudio = function() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().then(function() {
            if (!masterGain) { setupAudioNodes(); decodePendingSamples(); }
          });
        } else {
          if (!masterGain) { setupAudioNodes(); decodePendingSamples(); }
        }
      };

      var setupAudioNodes = function() {
        if (masterGain) return;
        masterGain = audioCtx.createGain(); masterGain.gain.value = volume;
        analyser = audioCtx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.85;
        metroGainNode = audioCtx.createGain(); metroGainNode.gain.value = 0.3;

        dryGainNode = audioCtx.createGain(); dryGainNode.gain.value = 0.85;
        reverbGainNode = audioCtx.createGain(); reverbGainNode.gain.value = 0.15;

        eqLowNode = audioCtx.createBiquadFilter(); eqLowNode.type = 'lowshelf'; eqLowNode.frequency.value = 320; eqLowNode.gain.value = 0;
        eqMidNode = audioCtx.createBiquadFilter(); eqMidNode.type = 'peaking'; eqMidNode.frequency.value = 1000; eqMidNode.Q.value = 1; eqMidNode.gain.value = 0;
        eqHighNode = audioCtx.createBiquadFilter(); eqHighNode.type = 'highshelf'; eqHighNode.frequency.value = 3200; eqHighNode.gain.value = 0;

        masterGain.connect(eqLowNode);
        eqLowNode.connect(eqMidNode);
        eqMidNode.connect(eqHighNode);
        eqHighNode.connect(dryGainNode); dryGainNode.connect(analyser); analyser.connect(audioCtx.destination);
        eqHighNode.connect(reverbGainNode);
        var convolver = audioCtx.createConvolver();
        if (!impulseBuffer) impulseBuffer = createImpulseResponse();
        convolver.buffer = impulseBuffer;
        reverbNode = convolver;
        reverbGainNode.connect(reverbNode); reverbNode.connect(analyser);
        metroGainNode.connect(audioCtx.destination);
        drawVisualizer();
      };

      var playNote = function(type, time, trackVolume) {
        if (!audioCtx || !masterGain || type === 'R' || type === '-') return;
        if (customSamples[type] && customSamples[type].buffer) {
          try {
            var src = audioCtx.createBufferSource(); src.buffer = customSamples[type].buffer;
            var g = audioCtx.createGain(); g.gain.value = trackVolume !== undefined ? trackVolume : 1.0;
            src.connect(g); g.connect(masterGain); src.start(time);
          } catch(e) {}
        }
      };

      var playMetronomeClick = function(time, isAccent) {
        if (!audioCtx || !metroGainNode || !metronomeEnabled) return;
        try {
          var osc = audioCtx.createOscillator(); osc.type = 'sine';
          osc.frequency.value = isAccent ? 1200 : 800;
          var g = audioCtx.createGain(); g.gain.setValueAtTime(isAccent ? 0.4 : 0.25, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
          osc.connect(g); g.connect(metroGainNode);
          osc.start(time); osc.stop(time + 0.05);
        } catch(e) {}
      };

      var loadCustomSample = function(type, file) {
        initAudio();
        if (audioCtx.state !== 'running') { audioCtx.resume().then(function() { decodeAndAssign(type, file); }); }
        else decodeAndAssign(type, file);
      };
      var decodeAndAssign = function(type, file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          audioCtx.decodeAudioData(e.target.result, function(buffer) {
            customSamples[type] = { buffer: buffer, name: file.name };
            updateSampleUI(type, file.name);
            setStatus('✅ ' + type + ': ' + file.name, 'text-green-400');
            markUnsaved(); saveSamplesToStorage();
          }, function() { setStatus('❌ Ошибка декодирования', 'text-red-400'); });
        };
        reader.onerror = function() { setStatus('❌ Ошибка чтения', 'text-red-400'); };
        reader.readAsArrayBuffer(file);
      };
      var clearCustomSample = function(type) { customSamples[type] = null; updateSampleUI(type, null); setStatus('🗑 ' + type + ' очищен', 'text-white/50'); markUnsaved(); };
      var updateSampleUI = function(type, fileName) {
        var s = document.getElementById('sample-status-' + type), c = document.getElementById('clear-btn-' + type);
        if (!s || !c) return;
        s.innerHTML = fileName ? '📁 <span class="text-white/80">' + fileName + '</span>' : '❌ Не загружен';
        fileName ? c.classList.remove('hidden') : c.classList.add('hidden');
      };
      var playPreview = function(type) { 
        initAudio(); 
        setTimeout(function() { 
          if (audioCtx && audioCtx.state === 'running') playNote(type, audioCtx.currentTime + 0.01, 1); 
        }, 50); 
      };

      var parseTab = function(text) {
        if (!text || !text.trim()) return [];
        var cleaned = text.replace(/[\\\/]/g, '').trim();
        var result = [], regex = /(\([A-ZtkB-]+\))|([A-ZtkB-])(\d*\.?\d+)?/g, match;
        while ((match = regex.exec(cleaned)) !== null) {
          if (match[1]) {
            var chars = match[1].slice(1, -1).split('').filter(function(c) { return NOTE_INFO[c] || c === '-'; });
            if (chars.length > 0) result.push({ notes: chars, duration: 1 });
          } else if (match[2]) {
            var t = match[2]; var dur = match[3] ? parseFloat(match[3]) : 1;
            result.push({ notes: [t], duration: Math.max(0.1, isNaN(dur) ? 1 : dur) });
          }
        }
        return result;
      };

      var computeTrackDuration = function(parsedNotes, bpmVal, bvDenom) {
        var totalBeats = 0;
        for (var i = 0; i < parsedNotes.length; i++) totalBeats += parsedNotes[i].duration;
        return totalBeats * getBeatDuration(bpmVal, bvDenom);
      };

      var mergeAllTracks = function() {
        readTrackTabsFromDOM();
        var anySolo = tracks.some(function(t) { return t.solo; });
        var activeTracks = tracks.filter(function(t) {
          if (anySolo) return t.solo && !t.muted;
          return !t.muted;
        });

        var hasLoop = activeTracks.some(function(t) { return t.loop; });
        var maxNonLoopDuration = 0;
        activeTracks.forEach(function(track) {
          if (!track.loop) {
            var parsed = parseTab(track.tab);
            var dur = computeTrackDuration(parsed, bpm, beatValueDenom);
            if (dur > maxNonLoopDuration) maxNonLoopDuration = dur;
          }
        });

        var effectiveMaxDuration = hasLoop ? Math.max(maxNonLoopDuration, 0.5) * LOOP_MAX_CYCLES : maxNonLoopDuration;
        if (effectiveMaxDuration === 0) return [];

        var allEvents = [];
        activeTracks.forEach(function(track) {
          var parsed = parseTab(track.tab);
          if (parsed.length === 0) return;
          var trackDuration = computeTrackDuration(parsed, bpm, beatValueDenom);
          if (trackDuration === 0) return;
          
          var iterations = track.loop ? Math.ceil(effectiveMaxDuration / trackDuration) : 1;
          var currentTime = 0;
          for (var iter = 0; iter < iterations; iter++) {
            for (var i = 0; i < parsed.length; i++) {
              var noteObj = parsed[i];
              var beatDur = getBeatDuration(bpm, beatValueDenom) * noteObj.duration;
              if (currentTime > effectiveMaxDuration + 1) break;
              allEvents.push({
                time: currentTime,
                notes: noteObj.notes,
                duration: noteObj.duration,
                beatDuration: beatDur,
                trackId: track.id, trackName: track.name, trackVolume: track.volume,
                trackColor: getTrackColor(track.id),
                isRest: noteObj.notes.length === 1 && (noteObj.notes[0] === '-' || noteObj.notes[0] === 'R'),
                loopIteration: iter, isLoop: track.loop
              });
              currentTime += beatDur;
            }
          }
        });

        allEvents.sort(function(a, b) {
          if (Math.abs(a.time - b.time) > 0.0001) return a.time - b.time;
          return a.trackId - b.trackId;
        });
        return allEvents;
      };

      var buildBeatGroups = function(evtList) {
        var groups = [];
        var TIME_EPSILON = 0.005;
        for (var i = 0; i < evtList.length; i++) {
          var evt = evtList[i];
          if (groups.length === 0 || (evt.time - groups[groups.length - 1].time) > TIME_EPSILON) {
            groups.push({ time: evt.time, events: [evt], _groupIdx: groups.length });
          } else {
            groups[groups.length - 1].events.push(evt);
          }
        }
        return groups;
      };

      var scheduleBeatGroup = function(group, playTime, swingAmount) {
        var swingOffset = 0;
        if (swingAmount > 0 && group._groupIdx % 2 === 1) {
          swingOffset = getBeatDuration(bpm, beatValueDenom) * (swingAmount / 100) * 0.33;
        }
        var adjustedPlayTime = playTime + swingOffset;

        for (var e = 0; e < group.events.length; e++) {
          var evt = group.events[e];
          if (!evt.isRest) {
            for (var n = 0; n < evt.notes.length; n++) {
              if (NOTE_INFO[evt.notes[n]]) playNote(evt.notes[n], adjustedPlayTime, evt.trackVolume);
            }
          }
        }

        var groupIdx = group._groupIdx;
        var delayMs = Math.max(0, (adjustedPlayTime - audioCtx.currentTime) * 1000);
        setTimeout(function() { 
          if (!isPlaying) return; 
          updateVisualPill(groupIdx);
          updateBeatIndicator(groupIdx);
        }, delayMs);
      };

      var scheduler = function() {
        if (!isPlaying || !audioCtx) return;
        var now = audioCtx.currentTime;
        var beatDur = getBeatDuration(bpm, beatValueDenom);
        
        while (nextMetroTime < now + SCHEDULE_AHEAD_S) {
          if (metronomeEnabled) {
            var metroAccent = Math.round(nextMetroTime / beatDur) % 4 === 0;
            playMetronomeClick(nextMetroTime, metroAccent);
          }
          nextMetroTime += beatDur;
        }

        while (currentIdx < beatGroups.length) {
          var grp = beatGroups[currentIdx];
          var evtTime = playbackStartTime + grp.time;
          if (evtTime < now + SCHEDULE_AHEAD_S) {
            scheduleBeatGroup(grp, evtTime, swing);
            currentIdx++;
          } else {
            break;
          }
        }

        if (isPlaying && currentIdx >= beatGroups.length) {
          var lastGrp = beatGroups[beatGroups.length - 1];
          if (lastGrp) {
            var lastEvt = lastGrp.events[lastGrp.events.length - 1];
            var lastEnd = playbackStartTime + lastGrp.time + lastEvt.beatDuration;
            if (now >= lastEnd + 0.05) {
              togglePlayback();
              return;
            }
          } else { togglePlayback(); return; }
        }
        schedulerTimer = setTimeout(scheduler, LOOKAHEAD_MS);
      };

      var togglePlayback = function() {
        if (isPlaying) { stopPlayback(); } else { startPlayback(); }
      };

      var startPlayback = function() {
        if (isPlaying) return;
        initAudio();
        if (!audioCtx) { setTimeout(startPlayback, 200); return; }
        if (audioCtx.state !== 'running') { audioCtx.resume().then(startPlayback); return; }
        
        notes = mergeAllTracks();
        if (notes.length === 0) { setStatus('⚠️ Введите корректную табулатуру', 'text-yellow-300'); return; }
        
        var missingTypes = [];
        notes.forEach(function(n) { 
          n.notes.forEach(function(type) { 
            if (NOTE_INFO[type] && type !== 'R' && type !== '-' && !customSamples[type] && missingTypes.indexOf(type) === -1) missingTypes.push(type); 
          }); 
        });
        if (missingTypes.length > 0) setStatus('⚠️ Не загружены сэмплы: ' + missingTypes.join(', '), 'text-yellow-300');

        beatGroups = buildBeatGroups(notes);
        beatGroups.forEach(function(grp, idx) { grp._groupIdx = idx; });
        
        isPlaying = true; currentIdx = 0;
        playbackStartTime = audioCtx.currentTime + 0.05;
        nextMetroTime = playbackStartTime;
        
        els.playStopBtn.classList.add('pulse-ring');
        els.playStopText.textContent = 'Стоп';
        els.playStopIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        buildPreview(); scheduler(); 
        var hasLoop = notes.some(function(n) { return n.isLoop; });
        setStatus(hasLoop ? '▶ Воспроизведение (зациклено)' : '▶ Воспроизведение...', 'text-blue-300');
      };

      var stopPlayback = function() {
        isPlaying = false; if (schedulerTimer) clearTimeout(schedulerTimer); schedulerTimer = null;
        els.playStopBtn.classList.remove('pulse-ring');
        els.playStopText.textContent = 'Старт';
        els.playStopIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        clearActivePills(); clearBeatIndicator(); setStatus('Готово', 'text-white/50'); updateNoteInfo();
      };

      var updateVisualPill = function(groupIdx) {
        clearActivePills();
        var pills = els.noteDisplay.querySelectorAll('.note-pill[data-grp="' + groupIdx + '"]');
        pills.forEach(function(p) { p.classList.add('active'); activePills.push(p); });
        if (pills.length > 0) {
          var container = els.noteDisplay;
          var pillRect = pills[0].getBoundingClientRect();
          var containerRect = container.getBoundingClientRect();
          var targetScroll = (pillRect.top - containerRect.top + container.scrollTop) - containerRect.height / 3;
          container.scrollTop = Math.max(0, targetScroll);
        }
      };
      var clearActivePills = function() { activePills.forEach(function(p) { p.classList.remove('active'); p.classList.remove('missing'); }); activePills = []; };

      var updateBeatIndicator = function(groupIdx) {
        clearBeatIndicator();
        var beatNum = groupIdx % 4;
        var ind = document.getElementById('beatInd' + (beatNum + 1));
        if (ind) { ind.classList.add('on'); setTimeout(function() { ind.classList.remove('on'); }, 120); }
      };
      var clearBeatIndicator = function() { for (var i = 1; i <= 4; i++) { var ind = document.getElementById('beatInd' + i); if (ind) ind.classList.remove('on'); } };

      var visualizerRunning = false;
      var drawVisualizer = function() {
        if (!analyser || visualizerRunning) return;
        visualizerRunning = true;
        var frame = function() {
          animFrameId = requestAnimationFrame(frame); if (!analyser) return;
          var bufLen = analyser.frequencyBinCount; var dataArray = new Uint8Array(bufLen);
          analyser.getByteFrequencyData(dataArray);
          var w = els.canvas.width / window.devicePixelRatio, h = els.canvas.height / window.devicePixelRatio;
          if (w === 0 || h === 0) return;
          ctx2d.clearRect(0, 0, w, h);
          var barCount = 32, barW = w / barCount, step = Math.max(1, Math.floor(bufLen / barCount));
          for (var i = 0; i < barCount; i++) {
            var val = dataArray[i * step] / 255, barH = Math.max(1, val * h * 0.85);
            var grad = ctx2d.createLinearGradient(0, h, 0, h - barH);
            grad.addColorStop(0, 'rgba(59,130,246,0.8)'); grad.addColorStop(1, 'rgba(168,85,247,0.9)');
            ctx2d.fillStyle = grad; var x = i * barW + 1;
            ctx2d.beginPath(); ctx2d.roundRect(x, h - barH, barW - 2, barH, 2); ctx2d.fill();
          }
        }; frame();
      };

      var getNoteClass = function(type) { return NOTE_INFO[type] ? NOTE_INFO[type].css : 'r'; };
      
      var buildPreview = function() {
        els.noteDisplay.innerHTML = '';
        var currentNotes = isPlaying ? notes : mergeAllTracks();
        var currentGroups = buildBeatGroups(currentNotes);
        currentGroups.forEach(function(grp, idx) { grp._groupIdx = idx; });
        
        var trackEvents = {};
        currentGroups.forEach(function(grp) {
          grp.events.forEach(function(evt) {
            var tid = evt.trackId;
            if (!trackEvents[tid]) trackEvents[tid] = { name: evt.trackName, color: evt.trackColor, events: [] };
            trackEvents[tid].events.push({ event: evt, groupIdx: grp._groupIdx });
          });
        });
        var firstTrack = true;
        tracks.forEach(function(track) {
          var te = trackEvents[track.id];
          if (!te || te.events.length === 0) return;
          var row = document.createElement('div');
          row.className = 'preview-track-row flex items-start gap-2';
          var label = document.createElement('span');
          label.className = 'preview-track-label shrink-0';
          label.style.background = te.color + '25'; label.style.color = te.color; label.style.border = '1px solid ' + te.color + '40';
          label.innerHTML = '<span class="w-2 h-2 rounded-full inline-block" style="background:' + te.color + '"></span> ' + te.name + (track.loop ? ' 🔁' : '');
          row.appendChild(label);
          var notesContainer = document.createElement('div');
          notesContainer.className = 'flex flex-wrap gap-0.5 items-center';
          te.events.forEach(function(item) {
            var n = item.event, gi = item.groupIdx;
            if (n.notes.length === 1) {
              var type = n.notes[0]; var el = document.createElement('span');
              el.className = 'note-pill note-' + getNoteClass(type);
              if (!customSamples[type] && type !== 'R' && type !== '-') el.style.borderStyle = 'dashed';
              el.textContent = type + (n.duration > 1 ? n.duration : '');
              el.dataset.grp = gi; notesContainer.appendChild(el);
            } else {
              var wrap = document.createElement('span');
              wrap.className = 'inline-flex items-center bg-white/5 border rounded-lg px-1 py-0.5 gap-1';
              wrap.style.borderColor = te.color;
              n.notes.forEach(function(type) { 
                var e = document.createElement('span'); e.className = 'note-pill note-' + getNoteClass(type); 
                if (!customSamples[type] && type !== 'R' && type !== '-') e.style.borderStyle = 'dashed';
                e.dataset.grp = gi; e.textContent = type; wrap.appendChild(e); 
              });
              if (n.duration > 1) { var d = document.createElement('span'); d.className = 'text-xs text-white/50 ml-1'; d.dataset.grp = gi; d.textContent = n.duration; wrap.appendChild(d); }
              notesContainer.appendChild(wrap);
            }
          });
          row.appendChild(notesContainer);
          if (!firstTrack) { var sep = document.createElement('div'); sep.className = 'w-full h-px bg-white/10 my-1'; els.noteDisplay.appendChild(sep); }
          els.noteDisplay.appendChild(row);
          firstTrack = false;
        });
      };

      var setStatus = function(msg, color) {
        var dotClass = 'green';
        if (color) {
          if (color.indexOf('blue') !== -1) dotClass = 'blue';
          else if (color.indexOf('yellow') !== -1) dotClass = 'yellow';
          else if (color.indexOf('red') !== -1) dotClass = 'red';
        }
        els.status.innerHTML = '<span class="status-dot ' + dotClass + '"></span> ' + msg;
        els.status.className = 'text-sm font-medium flex items-center gap-2 ' + (color || 'text-white/50');
      };
      var updateNoteInfo = function() { 
        var n = isPlaying ? notes : mergeAllTracks();
        var count = n.length; 
        var dur = 0;
        for (var i = 0; i < n.length; i++) dur += (n[i].duration || 1);
        var sec = dur * getBeatDuration(bpm, beatValueDenom);
        els.noteCount.textContent = 'Нот: ' + count + ' | ' + sec.toFixed(1) + 'с'; 
      };

      var buildSettingsUI = function() {
        var grid = els.settingsGrid; grid.innerHTML = '';
        for (var type in NOTE_INFO) {
          var info = NOTE_INFO[type];
          var div = document.createElement('div'); div.className = 'glass rounded-2xl p-3 md:p-3.5 space-y-2';
          var hasSample = !!customSamples[type];
          var html = '<div class="flex items-center justify-between mb-1"><div class="flex items-center gap-2">';
          html += '<span class="note-pill note-' + info.css + '">' + type + '</span>';
          html += '<span class="text-sm text-white/50">' + info.label + '</span></div>';
          html += '<button class="glass-btn px-2 md:px-2.5 py-1.5 rounded-lg text-xs text-blue-200/80 preview-btn hover:text-blue-200 touch-target" data-type="' + type + '">🔊</button></div>';
          html += '<div id="sample-status-' + type + '" class="text-xs text-white/40 truncate h-5">' + (hasSample ? '📁 <span class="text-white/70">' + customSamples[type].name + '</span>' : '❌ Не загружен') + '</div>';
          html += '<div class="flex gap-1.5 md:gap-2 mt-2">';
          html += '<button class="glass-btn flex-1 py-2 rounded-xl text-xs text-blue-200/70 load-sample-btn hover:text-blue-200 touch-target" data-type="' + type + '">📁 Файл</button>';
          html += '<button id="clear-btn-' + type + '" class="glass-btn px-2.5 md:px-3 py-2 rounded-xl text-xs text-red-200/60 hover:text-red-200 ' + (hasSample ? '' : 'hidden') + ' touch-target">✕</button>';
          html += '<input type="file" accept="audio/*" class="hidden" id="file-' + type + '" data-type="' + type + '">';
          html += '</div>';
          div.innerHTML = html; grid.appendChild(div);
        }
        grid.querySelectorAll('.preview-btn').forEach(function(btn) { btn.addEventListener('click', function() { playPreview(btn.dataset.type); }); });
        grid.querySelectorAll('.load-sample-btn').forEach(function(btn) {
          btn.addEventListener('click', function() { document.getElementById('file-' + btn.dataset.type).click(); });
        });
        grid.querySelectorAll('input[type="file"]').forEach(function(inp) {
          inp.addEventListener('change', function() { if (inp.files[0]) loadCustomSample(inp.dataset.type, inp.files[0]); inp.value = ''; });
        });
        grid.querySelectorAll('[id^="clear-btn-"]').forEach(function(btn) {
          btn.addEventListener('click', function() { clearCustomSample(btn.id.replace('clear-btn-', '')); });
        });
      };

      var openModal = function(modal, panel) {
        modal.classList.remove('modal-hidden'); modal.classList.add('modal-visible');
        requestAnimationFrame(function() { requestAnimationFrame(function() { panel.classList.remove('modal-panel-hidden'); panel.classList.add('modal-panel-visible'); }); });
      };
      var closeModal = function(modal, panel) {
        panel.classList.remove('modal-panel-visible'); panel.classList.add('modal-panel-hidden');
        setTimeout(function() { modal.classList.remove('modal-visible'); modal.classList.add('modal-hidden'); }, 300);
      };

      els.openSettings.addEventListener('click', function() { buildSettingsUI(); openModal(els.settingsModal, els.settingsPanel); });
      els.closeSettings.addEventListener('click', function() { closeModal(els.settingsModal, els.settingsPanel); });
      els.settingsModal.addEventListener('click', function(e) { if (e.target === els.settingsModal) closeModal(els.settingsModal, els.settingsPanel); });
      els.saveSettings.addEventListener('click', function() {
        if (saveSamplesToStorage()) { setStatus('✅ Сэмплы сохранены', 'text-green-400'); setTimeout(function(){closeModal(els.settingsModal, els.settingsPanel);}, 300); }
        else { setStatus('❌ Ошибка сохранения (лимит)', 'text-red-400'); }
      });
      els.resetAllSamples.addEventListener('click', function() {
        if (confirm('Удалить все загруженные сэмплы?')) { for (var k in customSamples) delete customSamples[k]; buildSettingsUI(); markUnsaved(); }
      });

      els.exportBtn.addEventListener('click', function() { openModal(els.exportModal, els.exportPanel); });
      els.closeExport.addEventListener('click', function() { closeModal(els.exportModal, els.exportPanel); });
      els.exportModal.addEventListener('click', function(e) { if (e.target === els.exportModal) closeModal(els.exportModal, els.exportPanel); });
      els.cancelExport.addEventListener('click', function() { closeModal(els.exportModal, els.exportPanel); });
      els.confirmExport.addEventListener('click', function() { closeModal(els.exportModal, els.exportPanel); performExport(els.exportWithSamples.checked); });

      var performExport = function(includeSamples) {
        readTrackTabsFromDOM();
        var data = { tracks: tracks, bpm: bpm, volume: volume, swing: swing, beatValueDenom: beatValueDenom, ts: Date.now(), trackIdCounter: trackIdCounter };
        if (includeSamples) {
          data.samples = {};
          for (var key in customSamples) {
            if (customSamples[key] && customSamples[key].buffer) {
              try { var b64 = audioBufferToBase64(customSamples[key].buffer); if (b64) { data.samples[key] = { name: customSamples[key].name, bufferB64: b64 }; } } catch(e) {}
            }
          }
          setStatus('📤 Экспорт с сэмплами...', 'text-cyan-300');
        }
        var jsonStr = JSON.stringify(data, null, 2);
        var blob = new Blob([jsonStr], {type: 'application/json'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'darbuka-tab-' + new Date().toISOString().slice(0,10) + (includeSamples ? '-with-samples' : '') + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        setTimeout(function() { setStatus('📤 Экспортировано' + (includeSamples ? ' (с сэмплами)' : ''), 'text-cyan-300'); }, 500);
      };

      els.importBtn.addEventListener('click', function() { els.importFile.click(); });
      els.importFile.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          try {
            pendingImportData = JSON.parse(ev.target.result);
            var info = els.importFileInfo; info.classList.remove('hidden');
            var infoHtml = '<div class="font-semibold text-white/60 mb-1">Файл: ' + file.name + '</div>';
            if (pendingImportData.tracks) infoHtml += '<div class="mt-1">🎵 Дорожки: ' + pendingImportData.tracks.length + '</div>';
            if (pendingImportData.bpm) infoHtml += '<div>Темп: ' + pendingImportData.bpm + '</div>';
            if (pendingImportData.samples) {
              var sampleCount = Object.keys(pendingImportData.samples).length;
              infoHtml += '<div class="mt-1">🎛 Сэмплы: ' + sampleCount + ' найдено в файле</div>';
              els.importWithSamples.disabled = false; els.importWithSamples.checked = true;
            } else {
              infoHtml += '<div class="mt-1 text-yellow-300/60">🎛 Сэмплы не найдены</div>';
              els.importWithSamples.disabled = true; els.importWithSamples.checked = false;
            }
            info.innerHTML = infoHtml;
            openModal(els.importModal, els.importPanel);
          } catch(err) { setStatus('❌ Ошибка чтения файла', 'text-red-400'); }
        };
        reader.readAsText(file); e.target.value = '';
      });
      els.closeImport.addEventListener('click', function() { closeModal(els.importModal, els.importPanel); pendingImportData = null; });
      els.importModal.addEventListener('click', function(e) { if (e.target === els.importModal) { closeModal(els.importModal, els.importPanel); pendingImportData = null; } });
      els.cancelImport.addEventListener('click', function() { closeModal(els.importModal, els.importPanel); pendingImportData = null; });
      els.confirmImport.addEventListener('click', function() {
        closeModal(els.importModal, els.importPanel);
        if (pendingImportData) { performImport(pendingImportData, els.importWithSamples.checked); }
        pendingImportData = null;
      });

      var performImport = function(data, loadSamples) {
        if (data.tracks && data.tracks.length > 0) { tracks = data.tracks; trackIdCounter = data.trackIdCounter || tracks.length; }
        if (data.bpm) { bpm = data.bpm; els.bpm.value = bpm; }
        if (data.volume !== undefined) { volume = data.volume; els.volume.value = volume; els.volumeVal.textContent = Math.round(volume * 100) + '%'; }
        if (data.swing !== undefined) { swing = data.swing; els.swing.value = swing; els.swingVal.textContent = swing + '%'; }
        if (data.beatValueDenom !== undefined) { setBeatValue(data.beatValueDenom); }
        if (loadSamples && data.samples) {
          initAudio();
          if (audioCtx && audioCtx.state === 'running') {
            var count = 0;
            for (var key in data.samples) {
              if (data.samples[key] && data.samples[key].bufferB64) { var buf = base64ToAudioBuffer(data.samples[key].bufferB64); if (buf) { customSamples[key] = { buffer: buf, name: data.samples[key].name }; count++; } }
            }
            saveSamplesToStorage();
            setStatus('📥 Импортировано (' + count + ' сэмплов загружено)', 'text-purple-300');
          } else {
            audioCtx.resume().then(function() {
              var count = 0;
              for (var key in data.samples) {
                if (data.samples[key] && data.samples[key].bufferB64) { var buf = base64ToAudioBuffer(data.samples[key].bufferB64); if (buf) { customSamples[key] = { buffer: buf, name: data.samples[key].name }; count++; } }
              }
              saveSamplesToStorage();
              setStatus('📥 Импортировано (' + count + ' сэмплов загружено)', 'text-purple-300');
            });
          }
        } else { setStatus('📥 Импортировано', 'text-purple-300'); }
        renderTracks(); updateNoteInfo(); markUnsaved();
      };

      var getSlotKey = function(n) { return 'darbuka_slot_v2_' + n; };
      var getSlotInfo = function(n) { try { var r = localStorage.getItem(getSlotKey(n)); return r ? JSON.parse(r) : null; } catch(e) { return null; } };
      var saveToSlot = function(n) {
        try { readTrackTabsFromDOM(); var data = { tracks: tracks, bpm: bpm, volume: volume, swing: swing, beatValueDenom: beatValueDenom, ts: Date.now(), trackIdCounter: trackIdCounter }; localStorage.setItem(getSlotKey(n), JSON.stringify(data)); hasUnsavedChanges = false; return true; } catch(e) { return false; }
      };
      var loadFromSlot = function(n) {
        var d = getSlotInfo(n); if (!d) return false;
        if (d.tracks && d.tracks.length > 0) { tracks = d.tracks; trackIdCounter = d.trackIdCounter || tracks.length; }
        bpm = d.bpm || 120; els.bpm.value = bpm;
        volume = d.volume !== undefined ? d.volume : 0.8; els.volume.value = volume; els.volumeVal.textContent = Math.round(volume * 100) + '%';
        if (d.swing !== undefined) { swing = d.swing; els.swing.value = swing; els.swingVal.textContent = swing + '%'; }
        if (d.beatValueDenom !== undefined) { setBeatValue(d.beatValueDenom); }
        if (masterGain) masterGain.gain.value = volume;
        renderTracks(); updateNoteInfo(); hasUnsavedChanges = false; return true;
      };
      var deleteSlot = function(n) { try { localStorage.removeItem(getSlotKey(n)); return true; } catch(e) { return false; } };

      var buildSlotsUI = function() {
        var grid = els.slotsGrid; grid.innerHTML = ''; selectedSlotInModal = 0;
        els.selectSlotBtn.classList.add('opacity-40', 'pointer-events-none');
        els.loadSelectedSlot.classList.add('opacity-40', 'pointer-events-none');
        els.deleteSlotBtn.classList.add('opacity-40', 'pointer-events-none');
        for (var i = 1; i <= NUM_SLOTS; i++) {
          var info = getSlotInfo(i); var card = document.createElement('div');
          card.className = 'slot-card glass rounded-xl p-2.5 md:p-3 cursor-pointer border border-transparent touch-target'; card.dataset.slot = i;
          var hasData = info && info.tracks && info.tracks.length > 0;
          card.innerHTML = '<div class="flex items-center justify-between mb-1 md:mb-1.5"><span class="text-sm font-bold text-white/70">Слот ' + i + '</span>' + (hasData ? '<span class="w-2 h-2 rounded-full bg-green-400/80"></span>' : '<span class="w-2 h-2 rounded-full bg-white/15"></span>') + '</div>';
          if (hasData) {
            var trackNames = info.tracks.map(function(t) { return t.name; }).join(', ');
            card.innerHTML += '<div class="text-xs text-white/40 font-mono truncate mb-0.5 md:mb-1">' + trackNames + '</div>';
            var timeStr = info.ts ? new Date(info.ts).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}) : '--:--';
            card.innerHTML += '<div class="flex items-center justify-between text-xs text-white/30"><span>' + info.tracks.length + ' дор.</span><span>' + timeStr + '</span></div>';
          } else card.innerHTML += '<div class="text-xs text-white/25 text-center py-1.5 md:py-2">Пусто</div>';
          if (i === currentSlot) card.classList.add('active'); if (!hasData) card.classList.add('empty');
          (function(slotNum) { card.addEventListener('click', function() { selectSlotInModal(slotNum); }); })(i);
          grid.appendChild(card);
        }
      };
      var selectSlotInModal = function(n) {
        selectedSlotInModal = n;
        els.selectSlotBtn.classList.remove('opacity-40', 'pointer-events-none');
        els.deleteSlotBtn.classList.remove('opacity-40', 'pointer-events-none');
        var info = getSlotInfo(n);
        if (info) { els.loadSelectedSlot.classList.remove('opacity-40', 'pointer-events-none'); }
        else { els.loadSelectedSlot.classList.add('opacity-40', 'pointer-events-none'); }
        els.slotsGrid.querySelectorAll('.slot-card').forEach(function(c) { c.classList.toggle('active', parseInt(c.dataset.slot) === n); });
      };
      var openSlotsModal = function() { buildSlotsUI(); openModal(els.slotsModal, els.slotsPanel); };
      var closeSlotsModal = function() { closeModal(els.slotsModal, els.slotsPanel); };
      els.openSlotsBtn.addEventListener('click', openSlotsModal);
      els.closeSlots.addEventListener('click', closeSlotsModal);
      els.slotsModal.addEventListener('click', function(e) { if (e.target === els.slotsModal) closeSlotsModal(); });
      els.selectSlotBtn.addEventListener('click', function() { if (selectedSlotInModal > 0) { currentSlot = selectedSlotInModal; els.currentSlotBtn.textContent = 'Слот ' + currentSlot; setStatus('📌 Слот: ' + currentSlot, 'text-blue-300'); closeSlotsModal(); } });
      els.loadSelectedSlot.addEventListener('click', function() { if (selectedSlotInModal > 0 && loadFromSlot(selectedSlotInModal)) setStatus('📂 Загружено из слота ' + selectedSlotInModal, 'text-green-400'); else setStatus('⚠️ Слот пуст', 'text-yellow-300'); });
      els.deleteSlotBtn.addEventListener('click', function() { if (selectedSlotInModal > 0 && confirm('Удалить слот ' + selectedSlotInModal + '?')) { deleteSlot(selectedSlotInModal); buildSlotsUI(); setStatus('🗑 Удалено', 'text-red-300'); } });

      els.clearBtn.addEventListener('click', function() { readTrackTabsFromDOM(); tracks.forEach(function(t) { t.tab = ''; }); renderTracks(); updateNoteInfo(); setStatus('🗑 Очищено', 'text-white/40'); markUnsaved(); });
      els.saveBtn.addEventListener('click', function() { if (saveToSlot(currentSlot)) setStatus('💾 Сохранено в слот ' + currentSlot, 'text-green-400'); else setStatus('❌ Ошибка', 'text-red-400'); });
      els.loadBtn.addEventListener('click', function() { if (loadFromSlot(currentSlot)) setStatus('📂 Загружено из слота ' + currentSlot, 'text-green-400'); else setStatus('⚠️ Пусто', 'text-yellow-300'); });
      els.addTrackBtn.addEventListener('click', function() { tracks.push(createTrack()); renderTracks(); updateNoteInfo(); markUnsaved(); });

      els.exportWavBtn.addEventListener('click', function() {
        readTrackTabsFromDOM();
        var merged = mergeAllTracks();
        if (merged.length === 0) { setStatus('⚠️ Нет нот для экспорта', 'text-yellow-300'); return; }
        setStatus('🎵 Рендеринг WAV...', 'text-pink-300');
        var offlineCtx = new OfflineAudioContext(2, 44100 * 60, 44100);
        var offlineMaster = offlineCtx.createGain(); offlineMaster.gain.value = volume;
        offlineMaster.connect(offlineCtx.destination);
        var groups = buildBeatGroups(merged);
        groups.forEach(function(grp) {
          var t = grp.time;
          for (var e = 0; e < grp.events.length; e++) {
            var evt = grp.events[e];
            if (!evt.isRest) { for (var n = 0; n < evt.notes.length; n++) { var type = evt.notes[n]; if (customSamples[type] && customSamples[type].buffer) { try { var src = offlineCtx.createBufferSource(); src.buffer = customSamples[type].buffer; var g = offlineCtx.createGain(); g.gain.value = evt.trackVolume; src.connect(g); g.connect(offlineMaster); src.start(t); } catch(ex) {} } } }
          }
        });
        offlineCtx.startRendering().then(function(renderedBuffer) {
          var wav = audioBufferToWav(renderedBuffer);
          var blob = new Blob([wav], {type: 'audio/wav'});
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a'); a.href = url; a.download = 'darbuka-' + new Date().toISOString().slice(0,10) + '.wav';
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
          setStatus('✅ WAV экспортирован', 'text-green-400');
        }).catch(function(err) { setStatus('❌ Ошибка рендеринга', 'text-red-400'); });
      });

      var audioBufferToWav = function(buffer) {
        var numCh = buffer.numberOfChannels, sr = buffer.sampleRate, len = buffer.length;
        var bitDepth = 16, bytesPerSample = bitDepth / 8;
        var blockAlign = numCh * bytesPerSample, byteRate = sr * blockAlign, dataLen = len * blockAlign;
        var headerLen = 44, totalLen = headerLen + dataLen;
        var arrayBuffer = new ArrayBuffer(totalLen); var view = new DataView(arrayBuffer);
        var writeString = function(offset, str) { for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
        writeString(0, 'RIFF'); view.setUint32(4, totalLen - 8, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numCh, true);
        view.setUint32(24, sr, true); view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true); writeString(36, 'data'); view.setUint32(40, dataLen, true);
        var channels = []; for (var c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
        var offset = 44;
        for (var i = 0; i < len; i++) { for (var c = 0; c < numCh; c++) { var sample = Math.max(-1, Math.min(1, channels[c][i])); var intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF; view.setInt16(offset, intSample, true); offset += 2; } }
        return arrayBuffer;
      };

      els.tabEditor.addEventListener('click', function() {
        els.tabEditor.classList.replace('text-white/50','text-blue-200'); els.tabEditor.classList.add('bg-white/10');
        els.tabPreview.classList.replace('text-blue-200','text-white/50'); els.tabPreview.classList.remove('bg-white/10');
        els.editorPanel.classList.remove('hidden'); els.previewPanel.classList.add('hidden');
      });
      els.tabPreview.addEventListener('click', function() {
        els.tabPreview.classList.replace('text-white/50','text-blue-200'); els.tabPreview.classList.add('bg-white/10');
        els.tabEditor.classList.replace('text-blue-200','text-white/50'); els.tabEditor.classList.remove('bg-white/10');
        els.previewPanel.classList.remove('hidden'); els.editorPanel.classList.add('hidden'); buildPreview();
      });

      els.bpm.addEventListener('change', function(e) { bpm = Math.min(300, Math.max(30, parseInt(e.target.value)||120)); e.target.value = bpm; updateNoteInfo(); });
      els.bpmUp.addEventListener('click', function() { bpm = Math.min(300, bpm + 5); els.bpm.value = bpm; updateNoteInfo(); });
      els.bpmDown.addEventListener('click', function() { bpm = Math.max(30, bpm - 5); els.bpm.value = bpm; updateNoteInfo(); });

      var setBeatValue = function(denom) {
        beatValueDenom = denom;
        els.beatVal4.classList.toggle('active', denom === 4);
        els.beatVal8.classList.toggle('active', denom === 8);
        els.beatVal16.classList.toggle('active', denom === 16);
        updateNoteInfo(); markUnsaved();
      };

      els.beatVal4.addEventListener('click', function() { setBeatValue(4); });
      els.beatVal8.addEventListener('click', function() { setBeatValue(8); });
      els.beatVal16.addEventListener('click', function() { setBeatValue(16); });

      els.volume.addEventListener('input', function(e) { volume = parseFloat(e.target.value); els.volumeVal.textContent = Math.round(volume*100)+'%'; if (masterGain) masterGain.gain.value = volume; });
      els.swing.addEventListener('input', function(e) { swing = parseInt(e.target.value); els.swingVal.textContent = swing + '%'; markUnsaved(); });
      els.playStopBtn.addEventListener('click', togglePlayback);

      els.metronomeBtn.addEventListener('click', function() {
        metronomeEnabled = !metronomeEnabled;
        els.metroIcon.textContent = metronomeEnabled ? '🔔' : '🔇';
        els.metronomeBtn.classList.toggle('metro-active', metronomeEnabled);
        setStatus(metronomeEnabled ? '🔔 Метроном включен' : '🔇 Метроном выключен', metronomeEnabled ? 'text-yellow-300' : 'text-white/50');
      });

      els.recBtn.addEventListener('click', function() {
        if (isRecording) { stopRecording(); }
        else {
          initAudio();
          if (!audioCtx || audioCtx.state !== 'running') { audioCtx.resume().then(function() { startRecording(); }); }
          else { startRecording(); }
        }
      });

      var startRecording = function() {
        isRecording = true; recordStartTime = audioCtx.currentTime; recordedEvents = [];
        els.recBtn.classList.add('rec-active'); els.recIcon.textContent = '⏹'; els.recOverlay.style.opacity = '1';
        setStatus('⏺ Запись... Нажимайте клавиши D, T, K, S, t, k, B, R', 'text-red-300');
        document.addEventListener('keydown', recordKeyHandler);
      };

      var recordKeyHandler = function(e) {
        if (!isRecording || e.repeat) return;
        var keyMap = { 'd': 'D', 'D': 'D', 't': 'T', 'T': 'T', 'е': 'T', 'Е': 'T', 'k': 'K', 'K': 'K', 's': 'S', 'S': 'S', 'ы': 'S', 'Ы': 'S', 'b': 'B', 'B': 'B', 'и': 'B', 'И': 'B', 'r': 'R', 'R': 'R', 'к': 'R', 'К': 'R' };
        var type = keyMap[e.key];
        if (type && NOTE_INFO[type]) {
          var now = audioCtx.currentTime;
          recordedEvents.push({ time: now, type: type });
          playNote(type, now, 1);
          setStatus('🎵 ' + type + ' (' + recordedEvents.length + ')', 'text-cyan-300');
          e.preventDefault();
        }
      };

      var stopRecording = function() {
        if (!isRecording) return;
        isRecording = false; els.recBtn.classList.remove('rec-active'); els.recIcon.textContent = '⏺'; els.recOverlay.style.opacity = '0';
        document.removeEventListener('keydown', recordKeyHandler);
        if (recordedEvents.length === 0) return;
        var tabString = buildTabFromEvents(recordedEvents);
        if (tracks.length > 0 && !tracks[0].tab) { tracks[0].tab = tabString; tracks[0].name = 'Запись'; }
        else { tracks.push(createTrack('Запись')); tracks[tracks.length - 1].tab = tabString; }
        renderTracks(); updateNoteInfo(); markUnsaved();
        setStatus('🎵 Запись сохранена (' + recordedEvents.length + ' нот)', 'text-green-400');
        recordedEvents = [];
      };

      var buildTabFromEvents = function(events) {
        if (events.length === 0) return '';
        events.sort(function(a, b) { return a.time - b.time; });
        var beatDur = getBeatDuration(bpm, beatValueDenom); var startTime = events[0].time;
        var quantizedEvents = [];
        for (var i = 0; i < events.length; i++) {
          var beatPos = Math.round((events[i].time - startTime) / beatDur);
          if (beatPos < 0) beatPos = 0;
          quantizedEvents.push({ beatPos: beatPos, type: events[i].type });
        }
        var beatGroupsArr = []; var currentBeatGroup = null;
        for (var i = 0; i < quantizedEvents.length; i++) {
          var evt = quantizedEvents[i];
          if (!currentBeatGroup || evt.beatPos !== currentBeatGroup.beatPos) { currentBeatGroup = { beatPos: evt.beatPos, notes: [evt.type] }; beatGroupsArr.push(currentBeatGroup); }
          else { if (currentBeatGroup.notes.indexOf(evt.type) === -1) currentBeatGroup.notes.push(evt.type); }
        }
        var tab = '';
        for (var i = 0; i < beatGroupsArr.length; i++) {
          var grp = beatGroupsArr[i];
          var nextPos = (i + 1 < beatGroupsArr.length) ? beatGroupsArr[i + 1].beatPos : (grp.beatPos + 1);
          var duration = Math.max(1, Math.round(nextPos - grp.beatPos));
          var noteStr = grp.notes.length === 1 ? grp.notes[0] : '(' + grp.notes.join('') + ')';
          if (duration > 1) noteStr += duration;
          if (i > 0) {
            var expectedNextPos = beatGroupsArr[i - 1].beatPos + Math.max(1, Math.round(beatGroupsArr[i].beatPos - beatGroupsArr[i-1].beatPos > 0 ? 1 : 1));
            var gap = grp.beatPos - expectedNextPos;
            for (var g = 0; g < gap; g++) tab += '- ';
          }
          if (i === 0 && grp.beatPos > 0) { for (var g = 0; g < grp.beatPos; g++) tab += '- '; }
          tab += noteStr + ' ';
        }
        return tab.trim();
      };

      els.recBtn.addEventListener('dblclick', function(e) { if (isRecording) { e.preventDefault(); stopRecording(); } });

      els.openPresets.addEventListener('click', function() { buildPresetsUI(); openModal(els.presetsModal, els.presetsPanel); });
      els.closePresets.addEventListener('click', function() { closeModal(els.presetsModal, els.presetsPanel); });
      els.presetsModal.addEventListener('click', function(e) { if (e.target === els.presetsModal) closeModal(els.presetsModal, els.presetsPanel); });

      var buildPresetsUI = function() {
        var grid = els.presetsGrid; grid.innerHTML = '';
        for (var name in PRESETS) {
          if (!PRESETS.hasOwnProperty(name)) continue;
          var tab = PRESETS[name];
          var card = document.createElement('div');
          card.className = 'glass rounded-xl p-2.5 md:p-3 cursor-pointer border border-transparent hover:border-purple-500/30 transition-all hover:bg-white/[0.04] touch-target';
          card.innerHTML = '<div class="text-sm font-semibold text-purple-200 mb-0.5 md:mb-1">' + name + '</div><div class="text-xs text-white/35 font-mono truncate">' + tab + '</div>';
          (function(presetName, presetTab) {
            card.addEventListener('click', function() {
              if (tracks.length > 0 && !tracks[0].tab) { tracks[0].tab = presetTab; tracks[0].name = presetName; }
              else { tracks.push(createTrack(presetName)); tracks[tracks.length - 1].tab = presetTab; }
              renderTracks(); updateNoteInfo(); markUnsaved();
              setStatus('🎵 Загружен пресет: ' + presetName, 'text-purple-300');
              closeModal(els.presetsModal, els.presetsPanel);
            });
          })(name, tab);
          grid.appendChild(card);
        }
      };

      els.openEQ.addEventListener('click', function() { openModal(els.eqModal, els.eqPanel); });
      els.closeEQ.addEventListener('click', function() { closeModal(els.eqModal, els.eqPanel); });
      els.eqModal.addEventListener('click', function(e) { if (e.target === els.eqModal) closeModal(els.eqModal, els.eqPanel); });
      
      var updateEQ = function() {
        if (eqLowNode) eqLowNode.gain.value = parseFloat(els.eqLow.value);
        if (eqMidNode) eqMidNode.gain.value = parseFloat(els.eqMid.value);
        if (eqHighNode) eqHighNode.gain.value = parseFloat(els.eqHigh.value);
        els.eqLowVal.textContent = els.eqLow.value + ' дБ'; els.eqMidVal.textContent = els.eqMid.value + ' дБ'; els.eqHighVal.textContent = els.eqHigh.value + ' дБ';
      };
      els.eqLow.addEventListener('input', updateEQ);
      els.eqMid.addEventListener('input', updateEQ);
      els.eqHigh.addEventListener('input', updateEQ);
      els.resetEQ.addEventListener('click', function() { els.eqLow.value = 0; els.eqMid.value = 0; els.eqHigh.value = 0; updateEQ(); });

      els.openSeq.addEventListener('click', function() { buildSeqUI(); openModal(els.seqModal, els.seqPanel); });
      els.closeSeq.addEventListener('click', function() { closeModal(els.seqModal, els.seqPanel); });
      els.seqModal.addEventListener('click', function(e) { if (e.target === els.seqModal) closeModal(els.seqModal, els.seqPanel); });

      var buildSeqUI = function() {
        var grid = els.seqGrid; grid.innerHTML = '';
        var headerRow = document.createElement('div');
        headerRow.className = 'seq-grid'; headerRow.style.gridTemplateColumns = 'auto repeat(16, minmax(28px, 1fr))';
        headerRow.appendChild(document.createElement('div')).className = 'seq-label';
        for (var s = 0; s < 16; s++) { var lbl = document.createElement('div'); lbl.className = 'seq-label text-white/25 text-xs'; lbl.textContent = s + 1; if (s % 4 === 0) lbl.style.color = 'rgba(255,255,255,0.45)'; headerRow.appendChild(lbl); }
        grid.appendChild(headerRow);
        for (var r = 0; r < SEQ_NOTES.length; r++) {
          var noteType = SEQ_NOTES[r];
          var row = document.createElement('div'); row.className = 'seq-grid'; row.style.gridTemplateColumns = 'auto repeat(16, minmax(28px, 1fr))';
          var noteLabel = document.createElement('div'); noteLabel.className = 'seq-label'; noteLabel.innerHTML = '<span class="note-pill note-' + getNoteClass(noteType) + '">' + noteType + '</span>'; row.appendChild(noteLabel);
          for (var c = 0; c < 16; c++) {
            var cell = document.createElement('div'); cell.className = 'seq-cell' + (seqState[r][c] ? ' active' : '') + (c % 4 === 0 ? ' beat' : '');
            cell.style.setProperty('--cell-color', getTrackColor(r + 1)); cell.dataset.row = r; cell.dataset.col = c;
            cell.addEventListener('click', function(e) { var rowIdx = parseInt(e.target.dataset.row); var colIdx = parseInt(e.target.dataset.col); seqState[rowIdx][colIdx] = !seqState[rowIdx][colIdx]; e.target.classList.toggle('active'); if (seqState[rowIdx][colIdx]) playPreview(SEQ_NOTES[rowIdx]); });
            row.appendChild(cell);
          }
          grid.appendChild(row);
        }
      };

      els.seqPlayBtn.addEventListener('click', function() { initAudio(); if (!audioCtx || audioCtx.state !== 'running') { audioCtx.resume().then(playSeq); } else { playSeq(); } });
      var playSeq = function() {
        var stepDuration = getBeatDuration(bpm, beatValueDenom) / 4; var startTime = audioCtx.currentTime + 0.05;
        for (var r = 0; r < SEQ_NOTES.length; r++) { for (var c = 0; c < 16; c++) { if (seqState[r][c]) playNote(SEQ_NOTES[r], startTime + c * stepDuration, 1); } }
        setStatus('▶ Секвенсор: 16 шагов', 'text-green-300');
      };
      els.seqClearBtn.addEventListener('click', function() { for (var r = 0; r < seqState.length; r++) for (var c = 0; c < 16; c++) seqState[r][c] = false; buildSeqUI(); });
      els.seqExportTabBtn.addEventListener('click', function() {
        var tab = '';
        for (var c = 0; c < 16; c++) {
          var activeNotes = []; for (var r = 0; r < SEQ_NOTES.length; r++) if (seqState[r][c]) activeNotes.push(SEQ_NOTES[r]);
          if (activeNotes.length > 0) { tab += activeNotes.length === 1 ? activeNotes[0] + ' ' : '(' + activeNotes.join('') + ') '; }
          else { tab += '- '; }
        }
        if (tracks.length > 0 && !tracks[0].tab) { tracks[0].tab = tab.trim(); }
        else { tracks.push(createTrack('Секвенсор')); tracks[tracks.length - 1].tab = tab.trim(); }
        renderTracks(); updateNoteInfo(); markUnsaved(); closeModal(els.seqModal, els.seqPanel);
        setStatus('📤 Экспортировано в табулатуру', 'text-green-400');
      });

      document.addEventListener('keydown', function(e) {
        if (isRecording) { recordKeyHandler(e); return; }
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') { if (e.target.classList.contains('rename-input')) return; if (e.key === 'Enter' || e.key === 'Escape') return; }
        if (e.code === 'Space') { e.preventDefault(); togglePlayback(); }
        if (e.code === 'Escape') { if (isPlaying) stopPlayback(); }
        if (e.code === 'ArrowUp') { e.preventDefault(); bpm = Math.min(300, bpm + 5); els.bpm.value = bpm; updateNoteInfo(); }
        if (e.code === 'ArrowDown') { e.preventDefault(); bpm = Math.max(30, bpm - 5); els.bpm.value = bpm; updateNoteInfo(); }
      });

      window.addEventListener('beforeunload', function(e) { if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; } });

      loadSamplesFromStorage(); initTracks(); renderTracks();
      els.currentSlotBtn.textContent = 'Слот ' + currentSlot; updateNoteInfo();
      window.addEventListener('load', resizeCanvas);
    })();

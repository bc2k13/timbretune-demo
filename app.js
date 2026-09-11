/* A static listening room: recordings are generated offline, never in the browser. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const data = window.TIMBRETUNE_DEMOS;
  if (!data?.pairs?.length) {
    $('loading').textContent = 'The audio examples could not be loaded. Please reload the page.';
    return;
  }
  // Enforce the website limit even when a browser reuses an older data file.
  const maxAlpha = Math.min(0.95, data.controls?.max_alpha ?? 0.95);
  data.controls = { ...data.controls, max_alpha: maxAlpha };
  data.pairs.forEach(pair => {
    pair.morphs = Object.fromEntries(Object.entries(pair.morphs)
      .filter(([alpha]) => Number(alpha) <= maxAlpha));
  });
  document.querySelectorAll('[data-alpha]').forEach(button => {
    if (Number(button.dataset.alpha) > maxAlpha) button.remove();
  });
  if (data.presentation) {
    data.presentation.end_label = 'Toward reference';
    data.presentation.explanation = 'At zero, the morph is a reconstructed source. The Source player contains the original recording.';
  }
  const tracks = ['source', 'reference', 'output'].map(role => $(role + '-audio'));
  let selectedPair = data.pairs[0];
  let selectedAlpha = '0.50';
  let version = 0;
  let pendingSeek = null;
  let pendingPlay = false;
  const output = $('output-audio');
  const source = $('source-audio');
  const status = (message) => { $('player-status').textContent = message; };
  const roundAlpha = (value) => {
    const min = data.controls?.min_alpha ?? 0.05;
    const max = maxAlpha;
    return (Math.max(min * 20, Math.min(max * 20, Math.round(Number(value) * 20))) / 20).toFixed(2);
  };

  function drawWave(id, peaks) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${peaks.length * 3} 70`);
    svg.setAttribute('preserveAspectRatio', 'none');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', peaks.map((v, i) => {
      const height = Math.max(1, Math.min(1, v) * 30);
      return `M${i * 3 + 1.5} ${35 - height}v${height * 2}`;
    }).join(' '));
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.3');
    path.setAttribute('stroke-linecap', 'round');
    svg.append(path);
    $(id).replaceChildren(svg);
  }

  function setAudio(audio, recording) {
    audio.pause();
    audio.src = recording.path;
    audio.load();
  }

  function selectAlpha(value, { keep = true } = {}) {
    const alpha = roundAlpha(value);
    const recording = selectedPair.morphs[alpha];
    const oldTime = !source.paused ? source.currentTime : (pendingSeek ?? (output.ended ? 0 : output.currentTime));
    const wasPlaying = !output.paused || pendingPlay;
    const oldVersion = ++version;
    output.pause();
    pendingSeek = keep && $('keep-position').checked ? oldTime : null;
    pendingPlay = wasPlaying && Boolean(recording);
    selectedAlpha = alpha;
    $('morph-slider').value = Math.round(Number(alpha) * 20);
    $('morph-slider').setAttribute('aria-valuetext', `${alpha} morph amount`);
    $('alpha-value').textContent = alpha;
    output.setAttribute('aria-label', `Play ${data.presentation?.label || 'synthesized morph'} at ${alpha}`);
    document.querySelectorAll('[data-alpha]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.alpha === alpha));
      button.disabled = !selectedPair.morphs[button.dataset.alpha];
    });
    if (!recording) {
      output.removeAttribute('src');
      output.load();
      $('output-wave').replaceChildren();
      $('download-output').hidden = true;
      status(`Morph ${alpha} is not rendered yet. Choose an available preset.`);
    } else {
      setAudio(output, recording);
      drawWave('output-wave', recording.peaks);
      $('download-output').href = recording.path;
      $('download-output').download = `${selectedPair.id}_timbretune_alpha_${alpha}.wav`;
      $('download-output').hidden = false;
      status('');
      output.dataset.version = String(oldVersion);
      if (pendingSeek !== null || pendingPlay) output.preload = 'metadata';
    }
  }

  output.addEventListener('loadedmetadata', () => {
    if (Number(output.dataset.version) !== version) return;
    if (pendingSeek !== null && Number.isFinite(output.duration)) {
      output.currentTime = Math.min(pendingSeek, Math.max(0, output.duration - .02));
    }
    pendingSeek = null;
    if (pendingPlay) {
      pendingPlay = false;
      const requestVersion = version;
      output.play().catch(() => {
        if (requestVersion === version) status('Press play to hear the selected morph.');
      });
    }
  });

  tracks.forEach(track => {
    track.addEventListener('play', () => {
      if (track !== output) {
        // A deliberate source/reference play cancels a morph awaiting metadata.
        pendingPlay = false;
        pendingSeek = null;
      }
      const counterpart = track === source ? output : track === output ? source : null;
      if ($('keep-position').checked && counterpart && !counterpart.paused && Number.isFinite(track.duration)) {
        track.currentTime = Math.min(counterpart.currentTime, Math.max(0, track.duration - .02));
      }
      tracks.filter(other => other !== track).forEach(other => other.pause());
      status('');
    });
    track.addEventListener('error', () => {
      if (track.getAttribute('src')) status('This recording could not be loaded. Check the audio file or try another example.');
    });
  });

  function selectPair(pair) {
    tracks.forEach(track => track.pause());
    selectedPair = pair;
    pendingSeek = null;
    pendingPlay = false;
    $('pair-title').textContent = pair.title;
    $('morph-slider').min = Math.round((data.controls?.min_alpha ?? 0.05) * 20);
    $('morph-slider').max = Math.round(maxAlpha * 20);
    document.querySelectorAll('.example-button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.pair === pair.id));
    });
    for (const role of ['source', 'reference']) {
      const clip = pair[role];
      $(role + '-name').textContent = clip.speaker_id.replace('vocalset_', '').replace('librispeech_', 'reader ');
      setAudio($(role + '-audio'), clip);
      drawWave(role + '-wave', clip.peaks);
    }
    selectAlpha(pair.morphs[selectedAlpha] ? selectedAlpha : Object.keys(pair.morphs)[0], { keep: false });
  }

  data.pairs.forEach(pair => {
    const button = document.createElement('button');
    button.className = 'example-button';
    button.dataset.pair = pair.id;
    button.dataset.category = pair.category;
    button.textContent = pair.title;
    button.addEventListener('click', () => selectPair(data.pairs.find(item => item.id === pair.id)));
    $('pair-list').append(button);
  });
  let activeFilter = 'All';
  const searchText = new Map(data.pairs.map(pair => [pair.id,
    [pair.title, pair.category, ...(pair.tags || []), pair.source.speaker_id,
      pair.reference.speaker_id, pair.source.dataset, pair.reference.dataset].join(' ').toLowerCase()]));
  function filterExamples() {
    const query = ($('example-search')?.value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    const visible = data.pairs.filter(pair => (activeFilter === 'All' || pair.category === activeFilter)
      && query.every(word => searchText.get(pair.id).includes(word)));
    const ids = new Set(visible.map(pair => pair.id));
    document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
    document.querySelectorAll('.example-button').forEach(button => { button.hidden = !ids.has(button.dataset.pair); });
    if ($('no-examples')) $('no-examples').hidden = visible.length > 0;
    if (visible.length && !visible.includes(selectedPair)) selectPair(visible[0]);
  }
  const filters = $('example-filters') || document.querySelector('.filters');
  filters.replaceChildren();
  ['All', ...new Set(data.pairs.map(pair => pair.category))].forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.filter = category;
    button.textContent = category;
    button.setAttribute('aria-pressed', String(category === activeFilter));
    button.addEventListener('click', () => {
      activeFilter = category;
      filterExamples();
    });
    filters.append(button);
  });
  $('example-search')?.addEventListener('input', filterExamples);
  $('morph-slider').addEventListener('input', event => selectAlpha(Number(event.target.value) / 20));
  document.querySelectorAll('[data-alpha]').forEach(button => button.addEventListener('click', () => selectAlpha(button.dataset.alpha)));
  function showCollectionDetails() {
    const presentation = data.presentation;
    if (!presentation) return;
    $('morph-explanation').textContent = presentation.explanation;
    const labels = document.querySelector('.slider-labels');
    labels.firstElementChild.textContent = presentation.start_label;
    labels.lastElementChild.textContent = presentation.end_label;
    const details = document.querySelector('.technical-details');
    const summary = document.createElement('summary');
    summary.textContent = 'Audio details';
    details.replaceChildren(summary);
    for (const text of presentation.details) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      details.append(paragraph);
    }
    const links = document.createElement('p');
    for (const [href, title] of [[data.manifest_path, 'Audio settings and files'], ['credits.html', 'Audio credits']]) {
      if (links.childNodes.length) links.append(' · ');
      const link = document.createElement('a');
      link.href = href; link.textContent = title; links.append(link);
    }
    details.append(links);
  }
  showCollectionDetails();
  $('loading').hidden = true;
  $('studio').hidden = false;
  selectPair(selectedPair);
})();

/* Measured rendering time; independent of the listening player's data and state. */
(() => {
  'use strict';
  const data = window.TIMBRETUNE_LATENCY;
  const chart = document.getElementById('latency-bars');
  const table = document.getElementById('latency-table-body');
  if (!data?.rows?.length || !chart || !table) return;
  const format = value => value.toFixed(2);
  const durations = [...new Set(data.rows.map(row => row.source_seconds))].sort((a, b) => a - b);
  const counts = [...new Set(data.rows.map(row => row.steps))].sort((a, b) => a - b);
  const max = Math.ceil(Math.max(...data.rows.map(row => row.mean_seconds)) / 10) * 10;
  const defaultSteps = counts.includes(100) ? 100 : 10;
  const controls = document.querySelector('.latency-buttons');
  controls.replaceChildren();
  for (const steps of counts) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.latencySteps = steps;
    button.textContent = steps;
    controls.append(button);
  }
  const buttons = [...controls.children];
  const header = document.querySelector('.latency-table thead tr');
  header.replaceChildren();
  for (const label of ['Source', ...counts.map(n => `${n} ${n === 1 ? 'step' : 'steps'}`)]) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    header.append(th);
  }
  document.getElementById('latency-summary').textContent = `${data.successful_requests} successful requests across ${data.rows.length} configurations; ${data.failures} failures.`;
  document.getElementById('latency-observations').textContent = `All ${data.successful_requests + data.failures} observations`;
  const followup = data.runs?.find(run => run.id === 'followup_high_steps');
  const startup = document.getElementById('latency-startup-description');
  if (startup) {
    startup.textContent = `Cached startup: ${format(data.cached_startup_seconds)} s in the original test${followup ? `; ${format(followup.cached_startup_seconds)} s in the follow-up` : ''}. Excluded from render times.`;
  }
  if (followup) {
    const listeningNote = window.TIMBRETUNE_DEMOS?.settings?.method !== 'historical_slerp_joint_prompt'
      ? 'The listening samples use additional offline processing that is not included in this plug-in benchmark.'
      : 'The listening examples use CFG 0.5 and Auto F0 off.';
    document.getElementById('latency-context').textContent = `The 60–120-step follow-up uses 5- and 10-second inputs in a separate session. Both runs use CFG 0.7 and Auto F0 on. ${listeningNote}`;
    document.getElementById('latency-test-setup').textContent = 'Three repetitions per tested configuration. Requests ran one at a time in randomized order after warm-up, with an 8-second reference, morph amount 0.5, length factor 1, and no pitch shift. Long inputs repeat the source recording. The extended-step test ran in a separate session on a working desktop; the two runs were not interleaved. Cached startup excludes first-time model downloads. A dash in the table means that combination was not tested.';
  }

  for (const duration of durations) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = `${duration} s`;
    tr.append(th);
    for (const steps of counts) {
      const record = data.rows.find(row => row.source_seconds === duration && row.steps === steps);
      const cell = document.createElement('td');
      cell.textContent = record ? `${format(record.mean_seconds)} ± ${format(record.sd_seconds)}` : '—';
      if (!record) cell.setAttribute('aria-label', 'Not tested');
      tr.append(cell);
    }
    table.append(tr);
  }

  function show(steps) {
    const rows = data.rows.filter(row => row.steps === steps).sort((a, b) => a.source_seconds - b.source_seconds);
    document.getElementById('latency-scale').textContent = `Shared scale: 0–${max} seconds`;
    document.getElementById('latency-selected').textContent = `${steps} diffusion ${steps === 1 ? 'step' : 'steps'} · mean of 3 requests per duration${steps > 50 ? ' · separate follow-up' : ''}`;
    for (const button of buttons) button.setAttribute('aria-pressed', String(Number(button.dataset.latencySteps) === steps));
    chart.replaceChildren();
    for (const row of rows) {
      const item = document.createElement('div');
      item.className = 'latency-row';
      item.setAttribute('role', 'listitem');
      const duration = document.createElement('span');
      duration.className = 'latency-duration';
      duration.textContent = `${row.source_seconds} s input`;
      const track = document.createElement('span');
      track.className = 'latency-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span');
      fill.style.width = `${row.mean_seconds / max * 100}%`;
      track.append(fill);
      const mean = document.createElement('span');
      mean.className = 'latency-value';
      mean.textContent = `${format(row.mean_seconds)} s`;
      item.append(duration, track, mean);
      chart.append(item);
    }
  }
  for (const button of buttons) button.addEventListener('click', () => show(Number(button.dataset.latencySteps)));
  show(defaultSteps);
})();

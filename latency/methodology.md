# Rendering-time measurements

The chart reports measured HTTP submission-to-WAV-download latency on a 16 GB Apple M1 Pro using PyTorch MPS. Three warmed, serial requests were made for each source duration and step count, with randomized order within each repetition. Settings: an 8-second reference, morph 0.5, CFG 0.7, Auto F0 on, duration factor 1, no pitch shift. Long inputs repeat the source recording. Startup and initial model downloads are excluded.

[Original 1–50-step run](baseline-methodology.md): 90 successful requests. Cached-checkpoint startup was 11.81 seconds.

[Extended-step follow-up](extended-methodology.md): 42 successful requests at 60, 70, 80, 90, 100, 110, 120 steps and source durations of 5, 10 seconds. Measured separately on a working desktop with the same inputs and conversion controls. The two runs were not interleaved; software state, background activity, and thermal conditions may differ. The CSV benchmark_run column identifies the run. A dash in the website table indicates an untested combination. [Follow-up input and code hashes](extended-provenance.json).

The listening examples use different controls (100 steps, CFG 0.5, Auto F0 off) and a pre-clamp export. These timing tests do not measure audio quality.

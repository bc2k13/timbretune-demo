# TimbreTune latency benchmark
## Environment
- Machine: MacBook Pro (MacBookPro18,3)
- Chip: Apple M1 Pro; 10 (8 performance and 2 efficiency) cores
- Memory: 16 GB
- OS: macOS 26.2 (arm64)
- Python: 3.10.19
- PyTorch: 2.4.0; device: mps; server fp16 flag: true
- Power at start: AC Power; 80%; AC attached; unknown
- Git commit: `805c7d9f8f9db063d61eaf36bc796a4c70c85e30`; dirty worktree: True

## Methodology
- Fixed source: `examples/source/source_s1.wav`; fixed reference: `examples/reference/s1p1.wav`
- Input encoding: mono PCM-16 WAV at 44100 Hz
- Reference duration: 8.0 s
- Source durations: 5.0, 10.0 s
- Diffusion steps: 60, 70, 80, 90, 100, 110, 120
- Repetitions per configuration: 3; randomized order with seed 20260318
- One unreported warm-up conversion preceded measurement. Jobs ran serially.
- Model: Plachta/Seed-VC DiT_seed_v2_uvit_whisper_base_f0_44k_bigvgan_pruned_ft_ema_v2.pth with openai/whisper-small and nvidia/bigvgan_v2_44khz_128band_512x.
- Fixed settings: morph alpha 0.5, length adjust 1.0, CFG 0.7, Auto F0 on, pitch shift 0.
- Latency definition: HTTP submission through completed WAV download; polling interval 0.1 s.
- Real-time factor (RTF): end-to-end latency divided by returned audio duration; RTF < 1 is faster than real time.
- Cached-model cold startup to healthy API: **14.39 s**.
- Successful measured runs: 42; failures: 0.

## Results
| Source (s) | Steps | n | Mean (s) | Median (s) | SD (s) | P95 (s) | Mean RTF |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | 60 | 3 | 27.06 | 27.44 | 0.70 | 27.48 | 5.42 |
| 5 | 70 | 3 | 31.38 | 30.56 | 1.65 | 33.01 | 6.29 |
| 5 | 80 | 3 | 35.09 | 34.95 | 1.56 | 36.53 | 7.03 |
| 5 | 90 | 3 | 38.60 | 37.77 | 1.50 | 40.08 | 7.73 |
| 5 | 100 | 3 | 41.35 | 41.47 | 0.33 | 41.58 | 8.28 |
| 5 | 110 | 3 | 47.29 | 45.75 | 3.42 | 50.67 | 9.47 |
| 5 | 120 | 3 | 49.38 | 48.54 | 2.18 | 51.53 | 9.89 |
| 10 | 60 | 3 | 41.27 | 41.26 | 0.22 | 41.47 | 4.13 |
| 10 | 70 | 3 | 46.33 | 46.57 | 0.74 | 46.89 | 4.63 |
| 10 | 80 | 3 | 52.39 | 52.37 | 0.55 | 52.89 | 5.24 |
| 10 | 90 | 3 | 57.36 | 57.46 | 0.94 | 58.16 | 5.74 |
| 10 | 100 | 3 | 63.10 | 63.53 | 1.28 | 64.06 | 6.31 |
| 10 | 110 | 3 | 67.93 | 68.24 | 0.76 | 68.46 | 6.80 |
| 10 | 120 | 3 | 73.51 | 73.42 | 0.85 | 74.30 | 7.35 |

## Empirical scaling model
Ordinary least squares over individual successful runs ($R^2=0.991$):
```text
latency_seconds = 0.6529 + 0.8344 * duration_seconds + 0.2125 * diffusion_steps + 0.032547 * duration_seconds * diffusion_steps
```

## Interpretation notes
- Results describe this machine and software state; they should not be generalized to all M1-family Macs.
- Cold startup uses already-downloaded checkpoints and excludes first-time model downloads.
- The benchmark measures latency, not output quality. More diffusion steps are treated only as a compute setting.
- Long sustained runs may include thermal and background-system variation representative of an editing session.
- Power at end: AC Power; 80%; AC attached; unknown

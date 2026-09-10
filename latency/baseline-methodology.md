# TimbreTune latency benchmark
## Environment
- Machine: MacBook Pro (MacBookPro18,3)
- Chip: Apple M1 Pro; 10 (8 performance and 2 efficiency) cores
- Memory: 16 GB
- OS: macOS 26.2 (arm64)
- Python: 3.10.19
- PyTorch: 2.4.0; device: mps; server fp16 flag: true
- Power at start: AC Power; 100%; charged; 0:00 remaining
- Git commit: `805c7d9f8f9db063d61eaf36bc796a4c70c85e30`; dirty worktree: True

## Methodology
- Fixed source: `examples/source/source_s1.wav`; fixed reference: `examples/reference/s1p1.wav`
- Input encoding: mono PCM-16 WAV at 44100 Hz
- Reference duration: 8.0 s
- Source durations: 1.0, 3.0, 5.0, 10.0, 20.0, 30.0 s
- Diffusion steps: 1, 5, 10, 25, 50
- Repetitions per configuration: 3; randomized order with seed 20260318
- One unreported warm-up conversion preceded measurement. Jobs ran serially.
- Model: Plachta/Seed-VC DiT_seed_v2_uvit_whisper_base_f0_44k_bigvgan_pruned_ft_ema_v2.pth with openai/whisper-small and nvidia/bigvgan_v2_44khz_128band_512x.
- Fixed settings: morph alpha 0.5, length adjust 1.0, CFG 0.7, Auto F0 on, pitch shift 0.
- Latency definition: HTTP submission through completed WAV download; polling interval 0.1 s.
- Real-time factor (RTF): end-to-end latency divided by returned audio duration; RTF < 1 is faster than real time.
- Cached-model cold startup to healthy API: **11.81 s**.
- Successful measured runs: 90; failures: 0.

## Results
| Source (s) | Steps | n | Mean (s) | Median (s) | SD (s) | P95 (s) | Mean RTF |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1 | 3 | 3.52 | 3.19 | 0.67 | 4.18 | 3.53 |
| 1 | 5 | 3 | 4.98 | 4.99 | 0.15 | 5.11 | 4.99 |
| 1 | 10 | 3 | 6.50 | 6.56 | 0.19 | 6.65 | 6.51 |
| 1 | 25 | 3 | 10.82 | 10.53 | 0.76 | 11.57 | 10.84 |
| 1 | 50 | 3 | 18.21 | 18.15 | 0.19 | 18.40 | 18.24 |
| 3 | 1 | 3 | 5.36 | 5.28 | 0.47 | 5.81 | 1.79 |
| 3 | 5 | 3 | 6.29 | 6.20 | 0.25 | 6.53 | 2.10 |
| 3 | 10 | 3 | 8.46 | 8.49 | 0.23 | 8.65 | 2.82 |
| 3 | 25 | 3 | 13.97 | 14.17 | 0.47 | 14.29 | 4.66 |
| 3 | 50 | 3 | 23.07 | 23.06 | 0.55 | 23.57 | 7.70 |
| 5 | 1 | 3 | 7.44 | 7.26 | 0.46 | 7.89 | 1.49 |
| 5 | 5 | 3 | 9.49 | 8.99 | 0.89 | 10.37 | 1.90 |
| 5 | 10 | 3 | 11.43 | 11.28 | 0.29 | 11.71 | 2.29 |
| 5 | 25 | 3 | 18.53 | 18.33 | 0.83 | 19.33 | 3.71 |
| 5 | 50 | 3 | 28.68 | 28.70 | 0.09 | 28.75 | 5.74 |
| 10 | 1 | 3 | 12.54 | 13.04 | 1.01 | 13.18 | 1.25 |
| 10 | 5 | 3 | 14.26 | 13.41 | 1.59 | 15.83 | 1.43 |
| 10 | 10 | 3 | 19.21 | 19.14 | 0.48 | 19.65 | 1.92 |
| 10 | 25 | 3 | 28.40 | 28.76 | 1.30 | 29.41 | 2.84 |
| 10 | 50 | 3 | 45.43 | 45.38 | 0.32 | 45.73 | 4.54 |
| 20 | 1 | 3 | 24.28 | 24.11 | 0.63 | 24.89 | 1.21 |
| 20 | 5 | 3 | 27.45 | 27.94 | 2.32 | 29.34 | 1.37 |
| 20 | 10 | 3 | 32.75 | 33.20 | 1.39 | 33.79 | 1.64 |
| 20 | 25 | 3 | 51.41 | 52.21 | 1.58 | 52.41 | 2.57 |
| 20 | 50 | 3 | 81.34 | 82.74 | 2.48 | 82.80 | 4.07 |
| 30 | 1 | 3 | 35.56 | 37.26 | 3.87 | 38.18 | 1.19 |
| 30 | 5 | 3 | 41.12 | 42.39 | 2.49 | 42.67 | 1.37 |
| 30 | 10 | 3 | 53.06 | 53.01 | 6.55 | 58.98 | 1.77 |
| 30 | 25 | 3 | 80.75 | 82.72 | 3.74 | 83.05 | 2.69 |
| 30 | 50 | 3 | 128.47 | 129.67 | 2.89 | 130.48 | 4.28 |

## Empirical scaling model
Ordinary least squares over individual successful runs ($R^2=0.992$):
```text
latency_seconds = 1.8995 + 1.0236 * duration_seconds + 0.1774 * diffusion_steps + 0.055068 * duration_seconds * diffusion_steps
```

## Interpretation notes
- Results describe this machine and software state; they should not be generalized to all M1-family Macs.
- Cold startup uses already-downloaded checkpoints and excludes first-time model downloads.
- The benchmark measures latency, not output quality. More diffusion steps are treated only as a compute setting.
- Long sustained runs may include thermal and background-system variation representative of an editing session.
- Power at end: AC Power; 100%; charged; 0:00 remaining

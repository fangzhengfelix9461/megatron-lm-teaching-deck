# Megatron-LM teaching deck plan

## Scope and sequence

The deck has 24 horizontal 16:9 pages. Pages 1–8 use exact renders of the current PowerPoint pages. Their wording, diagrams, and order are not revised. Pages 9–18 are the ten remaining main-talk pages. Pages 19–24 are optional Q&A appendices.

| Page | One question for the audience | Main visual | Original paper evidence |
| --- | --- | --- | --- |
| 9 | Why avoid moving every vocabulary score? | Four-word, two-GPU vocabulary example | Section 3 |
| 10 | What hardware did the authors use? | One DGX-2H expanded to 32 servers | Figure 1, Table 1 |
| 11 | What does 74% scaling efficiency mean? | Single-GPU baseline compared with 8 and 512 GPUs | Figure 5, Table 8 |
| 12 | Did the larger models help? | Read the original perplexity curve and zero-shot table | Figure 6, Tables 2–3 |
| 13 | Why did BERT need another change? | Compare the two normalization orders and highlight the original loss curves | Figure 7, Tables 4–5 |
| 14 | Which evidence supports which claim? | Three claim-to-evidence matches | Figures 1, 3–7 and Tables 3, 5 |
| 15 | What remains unproven? | Three evidence boundaries | Sections 5–6, Appendix D.2 |
| 16 | What problems did later work address? | Roadmap from ZeRO to 3D and automatic parallelism | Primary follow-up papers |
| 17 | How did this grow toward 2026? | Roadmap from production-scale training to MoE and multiple axes | MegaScale, DeepSeek-V3, Megatron Core |
| 18 | What should the audience remember? | Three concise takeaways and one recurring design question | Synthesis |
| 19–24 | Q&A only | Inspectable toy derivations, operator switch, tables and glossary | Original paper figures and tables |

## Animation contract

Animation is a teaching aid, never a fabricated training run. Each interactive page displays one of these labels: conceptual illustration, computed toy example, or paper-reported evidence. A single deterministic playhead controls Play/Pause, previous/next step, Reset, a scrubber, and speed. Navigation stops playback. Reduced-motion users can step manually.

- Page 9: split four vocabulary words between two GPUs; contrast gathering every score with computing locally and sharing only the small information needed for loss. This is a conceptual illustration, not a throughput measurement.
- Page 10: expand one reported 16-GPU server to the reported 32-server, 512-GPU setup; distinguish fast inside-server connections from inter-server links. Counts are paper-reported; the drawing is schematic.
- Page 11: reveal the reported one-GPU baseline, the 8-GPU model-parallel result, then the 512-GPU combined result. The animation reveals published points rather than interpolating imaginary performance measurements.
- Page 12: highlight existing curves and table cells in the paper images. The original plots stay static.
- Page 13: switch annotations over the two structures and original loss curves. The animation does not redraw or simulate training loss.
- Pages 16–17: advance one research milestone at a time, always stating the remaining problem and the added idea.
- Page 19: compute a small GeLU counterexample from fixed inputs to show why applying a nonlinear function before combining partial sums changes the answer.
- Pages 20–21: step through forward/backward operators and the vocabulary-loss communication contrast as optional technical backups.

The user’s manually edited Slide 1–8 script is preserved verbatim in the new speaker document. New Slides 9–24 use adjacent English/Chinese sentence pairs. The script and visual step sequence use the same order of ideas.

# Teaching-interaction redesign

## Problem found in version 1

The previous controls only revealed prepared text in sequence. They changed presentation state, but they did not let the learner change an input, observe a computed consequence, or inspect why the paper's design works.

## Design sources researched

- [Transformer Explainer](https://github.com/poloclub/transformer-explainer): let learners change a real input and inspect internal operations rather than watch a decorative tour.
- [LLM Visualization](https://github.com/bbycroft/llm-viz): preserve the identity and position of components while values flow through them.
- [Science-Style Animation skill](https://github.com/clueso-ai/skills/blob/main/skills/science-style-animation/SKILL.md): one mechanism per scene; motion shows cause and effect; annotations arrive with the narrated concept; end with a whole-system recap.
- [Deep Learning Intuition Visualization](https://github.com/abdhsn8/Deep-Learning-Intuition-Visualization): pair adjustable parameters with mathematical equations and live visual output.

No source code or visual branding is copied. The deck remains a dependency-free static site.

## New page design, Slides 9–23

| Slide | Teaching question | Learner action | Observable consequence | Evidence mode |
| --- | --- | --- | --- | --- |
| 9 | Why fuse vocabulary-parallel loss? | Change vocabulary size, GPU count, and communication route; run packets | Same toy loss, radically different communication scaling | Computed toy example |
| 10 | Why does TP placement follow hardware topology? | Switch between within-server and cross-server TP placement | Packets either stay on NVSwitch or cross the slower inter-server tier | Conceptual topology + paper bandwidth |
| 11 | What exactly do 77% and 74% mean? | Switch weak/strong scenarios and GPU point | Ideal and observed bars, model size, efficiency and speedup change together | Recorded paper data replay |
| 12 | Did larger GPT models improve results? | Select 355M, 2.5B, or 8.3B | Perplexity and LAMBADA accuracy update from Table 3 | Recorded paper data explorer |
| 13 | What changed in BERT? | Toggle original/rearranged residual branch and send a signal | The residual branch moves from after to before LN while the main path stays fixed; paper curve shows measured outcome | Conceptual mechanism + recorded curve |
| 14 | Which evidence supports each claim? | Match one claim to one evidence family | Immediate explanation distinguishes mechanism, systems, and quality evidence | Retrieval exercise |
| 15 | What did the paper actually test? | Probe cells in an evidence-scope matrix | Tested, not isolated, and out-of-scope cases are visibly separated | Evidence audit |
| 16 | Which later method addresses which bottleneck? | Select memory, depth, activations, or placement | The corresponding tensor dimension visibly splits | Conceptual roadmap |
| 17 | How do modern systems compose parallel axes? | Change TP, PP, DP, and EP | GPU product and coordinate grid recompute live | Computed topology example |
| 18 | Where does one Transformer layer communicate? | Run the whole layer | Two GPU-lane signals travel through local attention and MLP phases, converging at two synchronization points | Conceptual whole-system recap |
| 19 | Why can GeLU not be applied before summing row partitions? | Drag two partial-input sliders | Two points move on the actual GeLU curve and the two expressions diverge | Computed toy example |
| 20 | What do f and g do? | Choose operator and forward/backward pass | Numeric values either remain local or are all-reduced | Computed operator example |
| 21 | How can distributed softmax return the exact loss? | Adjust logits and step through the reductions | Local max, global max, exp-sum, target logit, and loss recompute | Computed toy example |
| 22 | What were the exact configurations? | Enlarge original tables | Read unmodified paper settings | Original paper evidence |
| 23 | What does each modern abbreviation split? | Select a parallelism name | The affected model dimension highlights | Conceptual glossary |

Slide 24 (preset questions) is removed completely.

## Acceptance contract

1. Every interactive page changes a meaningful input or algorithm state, not merely visibility.
2. Every displayed computed value is derived from visible deterministic inputs.
3. Recorded paper numbers are never interpolated into invented measurements.
4. Conceptual movement is explicitly labelled as conceptual.
5. Paper figures remain available and enlarge without altering their content.
6. Controls work by pointer and keyboard, honor reduced motion, and remain within 16:9 at 1280×720.
7. The bilingual script tells the presenter exactly what to change or point at during each interaction.

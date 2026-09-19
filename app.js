import { createTimeline } from './timeline.mjs';

const stage = document.querySelector('#stage');
const shell = document.querySelector('#stage-shell');
const previousButton = document.querySelector('#previous-slide');
const nextButton = document.querySelector('#next-slide');
const pageStatus = document.querySelector('#page-status');
const figureModal = document.querySelector('#figure-modal');
const figureFull = document.querySelector('#figure-full');
const figureCaption = document.querySelector('#figure-caption');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const paper = name => `./assets/paper/${name}.png`;
const thumb = (name, caption, extra = '') => `<button class="paper-thumb ${extra}" type="button" data-figure="${paper(name)}" data-caption="${caption}" aria-label="Enlarge ${caption}"><img src="${paper(name)}" alt="${caption}" /></button>`;
const source = text => `<div class="source-line">${text}</div>`;
const head = (number, title) => `<header class="slide-header"><h1>${title}</h1><span class="num">${String(number).padStart(2, '0')}</span></header>`;
const page = (number, title, body, footer, type = '') => `<section class="slide ${type}" data-slide="${number}" aria-label="Slide ${number}: ${title}" hidden>${head(number, title)}<div class="slide-body">${body}</div>${source(footer)}</section>`;
const controls = () => `<div class="demo-controls" aria-label="Animation controls"><button type="button" data-action="reset" aria-label="Reset animation" title="Reset">↺</button><button type="button" data-action="back" aria-label="Previous animation step" title="Previous step">‹</button><button type="button" data-action="play" aria-label="Play animation" title="Play or pause">▶</button><button type="button" data-action="forward" aria-label="Next animation step" title="Next step">›</button><input type="range" min="0" max="100" value="0" data-action="seek" aria-label="Animation progress" /><span class="step-count">Step 1 / 1</span><span class="muted">Speed</span><select data-action="speed" aria-label="Animation speed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></div>`;
const interactivePage = (number, title, body, footer, demo, type = '') => {
  const result = page(number, title, body, footer, type);
  return result.replace('</section>', `${controls()}</section>`).replace('class="slide-body"', `class="slide-body" data-demo="${demo}"`);
};

const firstEight = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1;
  return `<section class="slide image-slide" data-slide="${n}" aria-label="Original slide ${n}, preserved from the PowerPoint" hidden><img src="./assets/slides/slide-${String(n).padStart(2, '0')}.png" alt="Original PowerPoint slide ${n}, preserved without content changes" /></section>`;
});

const gpuWords = `<div class="gpu-pair"><div class="gpu"><h3>GPU 1</h3><div class="word-row"><span>cat</span><b>0.2</b></div><div class="word-row"><span>dog</span><b>1.0</b></div></div><div class="gpu amber-gpu"><h3>GPU 2</h3><div class="word-row"><span>bird</span><b>2.0</b></div><div class="word-row"><span>fish</span><b>0.5</b></div></div></div>`;

const slide9 = interactivePage(9, 'Why the vocabulary output is expensive', `
  <p class="lead">The model must score many possible next words</p>
  <span class="evidence-mode">Conceptual illustration — not training output</span>
  <div style="height:320px;margin-top:22px">
    <div class="scene" data-scene="0">${gpuWords}<p class="scene-note" style="text-align:center">Toy vocabulary: four words. A real vocabulary is much larger.</p></div>
    <div class="scene" data-scene="1" hidden>${gpuWords}<div class="packet" style="width:510px;margin:18px auto;background:#db5a63">Naive path: move all four word scores to every GPU</div></div>
    <div class="scene" data-scene="2" hidden>${gpuWords}<div class="packet small" style="width:570px;margin:18px auto">Megatron path: calculate local loss information first</div></div>
    <div class="scene" data-scene="3" hidden><div class="gpu-pair" style="margin-top:50px"><div class="gpu"><h3>GPU 1</h3><p class="packet small">small local information</p></div><div class="flow-arrow">+</div><div class="gpu amber-gpu"><h3>GPU 2</h3><p class="packet small">small local information</p></div></div><p class="lead" style="text-align:center;margin-top:28px">Combine a small result, not the full vocabulary vector</p></div>
  </div><p class="demo-cue" aria-live="off"></p>
`, 'Shoeybi et al. (2020), Section 3. Word scores are illustrative.', 'vocab', 'pale');

const serverChips = `<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:8px;width:480px;margin:18px auto">${Array.from({length:16},(_,i)=>`<div style="height:44px;border-radius:7px;background:${i<8?'#dff5fb':'#fff0d5'};border:1px solid ${i<8?'#29b9e8':'#f1b64a'};display:grid;place-items:center;font-size:15px;font-weight:700">V100</div>`).join('')}</div>`;
const miniServers = `<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:8px;width:540px;margin:13px auto">${Array.from({length:32},()=>`<div style="height:30px;border:1px solid #29b9e8;background:#dff5fb;border-radius:4px"></div>`).join('')}</div>`;
const slide10 = interactivePage(10, 'What hardware did the paper use?', `
  <div class="wide-layout"><div><p class="lead">Fast links nearby; slower links between servers</p><span class="evidence-mode">Paper-reported setup — schematic drawing</span>
    <div style="height:310px;margin-top:22px">
      <div class="scene" data-scene="0"><p class="big-number" style="text-align:center">1 server</p>${serverChips}<p class="scene-note" style="text-align:center">16 NVIDIA V100 GPUs, 32 GB each</p></div>
      <div class="scene" data-scene="1" hidden><p class="big-number" style="text-align:center">8-GPU group</p>${serverChips}<p class="scene-note" style="text-align:center">Tensor-parallel communication stays on the faster local links.</p></div>
      <div class="scene" data-scene="2" hidden><p class="big-number" style="text-align:center">32 servers</p>${miniServers}<p class="scene-note" style="text-align:center">32 × 16 GPUs = 512 GPUs in the largest experiment</p></div>
      <div class="scene" data-scene="3" hidden><p class="big-number" style="text-align:center">Two levels of communication</p><div class="metric-row"><div class="metric"><div class="value">Inside</div><div class="label">NVSwitch connects GPUs in a server</div></div><div class="metric"><div class="value">Between</div><div class="label">InfiniBand connects servers</div></div></div></div>
    </div><p class="demo-cue"></p></div>
    <div class="paper-column">${thumb('table-1','Original paper Table 1: scaling configurations')}${thumb('figure-1','Original paper Figure 1: throughput versus GPU count','short')}<p class="paper-label">Click either original figure to enlarge</p></div>
  </div>
`, 'Shoeybi et al. (2020), Figure 1, Table 1, and Section 5.1.', 'hardware');

const slide11 = interactivePage(11, 'What is the scaling baseline?', `
  <div class="wide-layout"><div><p class="lead">Efficiency means “how close to ideal scaling?”</p><span class="evidence-mode">Paper-reported results — revealed, not simulated</span>
    <div style="height:350px;margin-top:28px">
      <div class="scene" data-scene="0"><div class="big-number">1 V100 = 100%</div><p class="callout" style="margin-top:35px">1.2B parameters<br>39 TFLOPs sustained<br>the paper's internal baseline</p></div>
      <div class="scene" data-scene="1" hidden><div class="big-number cyan">8 GPUs → 77%</div><p class="callout" style="margin-top:35px">8.3B parameters<br>8-way tensor parallelism<br>model size increased with GPU count</p></div>
      <div class="scene" data-scene="2" hidden><div class="big-number green">512 GPUs → 74%</div><p class="callout" style="margin-top:35px">8-way tensor parallelism × 64-way data parallelism<br>Figure 5 weak-scaling efficiency</p></div>
      <div class="scene" data-scene="3" hidden><div class="big-number">Weak ≠ strong scaling</div><p class="callout" style="margin-top:35px">Weak scaling grows the model with the GPU count.<br>A fixed-model speedup is a different question.</p></div>
    </div><p class="demo-cue"></p></div>
    <div class="paper-column">${thumb('figure-5','Original paper Figure 5: weak-scaling efficiency')}${thumb('table-8','Original paper Appendix Table 8: fixed-model strong scaling','short')}<p class="paper-label">74% comes from Figure 5 at 512 GPUs</p></div>
  </div>
`, 'Shoeybi et al. (2020), Section 5.1, Figure 5, and Appendix D.2 Table 8.', 'scaling', 'pale');

const slide12 = page(12, 'Did larger models improve results?', `
  <p class="lead">Lower perplexity means better next-word prediction</p>
  <div class="source-pair" style="margin-top:28px"><div>${thumb('figure-6','Original paper Figure 6: validation perplexity for three model sizes')}<p class="paper-label">The 8.3B curve ends lowest</p></div><div>${thumb('table-3','Original paper Table 3: WikiText103 and LAMBADA zero-shot results')}<p class="paper-label">8.3B: 10.81 perplexity; 66.51% LAMBADA accuracy</p></div></div>
  <p class="callout" style="margin-top:26px">This supports larger model capacity, not the claim that parallelism itself improves accuracy.</p>
`, 'Shoeybi et al. (2020), Figure 6 and Tables 2–3. Click the original figures to enlarge.');

const slide13 = interactivePage(13, 'The BERT stability surprise', `
  <div class="wide-layout"><div><p class="lead">A larger model also has to train stably</p><span class="evidence-mode">Original paper curve — annotation only</span>
    <div style="height:345px;margin-top:25px">
      <div class="scene" data-scene="0"><p class="big-number">Two block orders</p><p class="callout" style="margin-top:40px">Figure 7 compares the original LayerNorm / residual arrangement with a rearranged version.</p></div>
      <div class="scene" data-scene="1" hidden><p class="big-number red">Original: loss spike</p><p class="callout" style="margin-top:40px;border-color:#db5a63">The red 752M curve jumps upward instead of continuing to improve.</p></div>
      <div class="scene" data-scene="2" hidden><p class="big-number green">Rearranged: stable</p><p class="callout" style="margin-top:40px;border-color:#43b98b">The blue 752M curve keeps decreasing, allowing a larger BERT-style model.</p></div>
    </div><p class="demo-cue"></p></div>
    <div class="paper-column">${thumb('figure-7','Original paper Figure 7: block arrangements and measured BERT loss curves')}${thumb('table-5','Original paper Table 5: BERT downstream results','short')}</div>
  </div>
`, 'Shoeybi et al. (2020), Figure 7 and Tables 4–5. The loss plot is not animated data.', 'bert');

const slide14 = page(14, 'Match each claim to its evidence', `
  <p class="lead">Three different questions need three different kinds of evidence</p>
  <div style="margin-top:27px"><div class="claim-row"><b>Can we build it?</b><span>Figures 3–4: layer partitions and communication</span><span>Shows the mechanism</span></div><div class="claim-row"><b>Does it scale?</b><span>Figures 1 and 5: throughput and efficiency</span><span>Shows performance on tested hardware</span></div><div class="claim-row"><b>Does size help?</b><span>Figures 6–7; Tables 3 and 5</span><span>Shows language and BERT results</span></div></div>
  <p class="callout" style="margin-top:29px">An accuracy result cannot, by itself, prove a systems-efficiency claim.</p>
`, 'Shoeybi et al. (2020), Sections 3–5. The original figures appear on their evidence pages.', 'pale');

const slide15 = page(15, 'What does the paper not establish?', `
  <p class="lead" style="color:white">These are boundaries of the evidence, not failures of the method</p>
  <div class="limit-columns"><div><h2>Model scope</h2><p>Dense GPT/BERT blocks were tested. Later MoE designs were outside this study.</p></div><div><h2>Hardware scope</h2><p>Tensor parallelism used up to eight GPUs in a fast DGX hierarchy. Other network layouts were not isolated.</p></div><div><h2>Comparison scope</h2><p>The main baseline was the authors' single-GPU run, not a full comparison against other frameworks.</p></div></div>
  <p style="color:#9edcf0;font-size:25px;font-weight:700;margin-top:42px">These open questions became part of the later research agenda.</p>
`, 'Critical synthesis from Shoeybi et al. (2020), Section 5, Appendix D.2, and Section 6.', 'dark');

const slide16 = interactivePage(16, 'What came after Megatron?', `
  <p class="lead">Later systems added solutions to different remaining bottlenecks</p><span class="evidence-mode">Research roadmap — paper milestones, schematic sequence</span>
  <div class="roadmap" data-roadmap>
    <div class="road-item" data-road="0"><span class="year">2020</span><h3>ZeRO</h3><p>Reduce duplicated optimizer and model state across data-parallel workers.</p></div>
    <div class="road-item" data-road="1"><span class="year">2021</span><h3>Megatron 3D</h3><p>Combine tensor, pipeline, and data parallelism.</p></div>
    <div class="road-item" data-road="2"><span class="year">2021–22</span><h3>GSPMD / Alpa</h3><p>Describe or choose device placements more generally.</p></div>
    <div class="road-item" data-road="3"><span class="year">2022</span><h3>Sequence</h3><p>Shard sequence activations to save memory.</p></div>
  </div><p class="demo-cue" style="margin-top:29px"></p>
`, 'ZeRO (2020); Narayanan et al. (2021); GSPMD (2021); Alpa (2022); sequence parallelism (2022).', 'roadmap1');

const slide17 = interactivePage(17, 'From parallelism to full training systems', `
  <p class="lead">At production scale, placement, overlap, and reliability all matter</p><span class="evidence-mode">Research roadmap — paper-reported examples</span>
  <div class="roadmap" data-roadmap>
    <div class="road-item" data-road="0"><span class="year">2021</span><h3>Compose axes</h3><p>Tensor × pipeline × data parallelism for larger models.</p></div>
    <div class="road-item" data-road="1"><span class="year">2024</span><h3>MegaScale</h3><p>12,288 GPUs; emphasize overlap, stragglers, and fault tolerance.</p></div>
    <div class="road-item" data-road="2"><span class="year">2024–25</span><h3>DeepSeek-V3</h3><p>MoE adds expert routing and placement to the systems problem.</p></div>
    <div class="road-item" data-road="3"><span class="year">2026</span><h3>Megatron Core</h3><p>Documented combinations of TP, PP, DP, CP, EP, and sharded states.</p></div>
  </div><p class="demo-cue" style="margin-top:29px"></p>
`, 'MegaScale (NSDI 2024); DeepSeek-V3 Technical Report; NVIDIA Megatron Core Parallelism Guide, accessed 2026-09-20.', 'roadmap2', 'pale');

const slide18 = page(18, 'What Megatron changed', `
  <div style="width:810px;margin:32px 0 0 0"><div class="takeaway-row"><span class="bullet">1</span><span>More data-parallel GPUs do not make an oversized model fit on one GPU.</span></div><div class="takeaway-row"><span class="bullet" style="background:#f1b64a">2</span><span>Megatron splits each Transformer layer so most computation stays local.</span></div><div class="takeaway-row"><span class="bullet">3</span><span>Later systems combine this tensor-parallel idea with other ways to divide work.</span></div></div>
  <p style="font-size:31px;color:#73d7f4;font-weight:750;margin-top:20px">Which work stays local, and when must GPUs communicate?</p>
`, 'Synthesis of Shoeybi et al. (2020) and later work.', 'dark');

function erf(x) {
  const sign = Math.sign(x) || 1;
  const a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  return sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a));
}
const gelu = x => 0.5 * x * (1 + erf(x / Math.SQRT2));
const geluSeparate = gelu(1) + gelu(-1);
const slide19 = interactivePage(19, 'Appendix A: Why GeLU cannot happen too early', `
  <p class="lead">Two partial sums: +1 on GPU 1 and −1 on GPU 2</p><span class="evidence-mode">Computed toy example — not paper training data</span>
  <div style="height:330px;margin-top:36px">
    <div class="scene" data-scene="0"><div class="split-panel"><div><h3>GPU 1</h3><div class="calc-number">+1</div><p>Partial result</p></div><div><h3>GPU 2</h3><div class="calc-number">−1</div><p>Partial result</p></div></div></div>
    <div class="scene" data-scene="1" hidden><div class="calc-equation">Combine first: +1 + (−1) = 0</div><div class="calc-equation">Then GeLU(0) = ${gelu(0).toFixed(3)}</div><p class="scene-note">This is the correct output when GeLU sees the complete input.</p></div>
    <div class="scene" data-scene="2" hidden><div class="calc-equation">GeLU(+1) + GeLU(−1) ≈ ${geluSeparate.toFixed(3)}</div><p class="scene-note">Applying GeLU separately before adding produces a different result.</p></div>
    <div class="scene" data-scene="3" hidden><p class="big-number">0 ≠ ${geluSeparate.toFixed(3)}</p><p class="callout" style="margin-top:45px">Megatron's chosen MLP partition avoids a reduction before GeLU.</p></div>
  </div><p class="demo-cue"></p>
`, 'Shoeybi et al. (2020), Equations 1–3. Toy values are computed in the browser.', 'gelu');

const slide20 = interactivePage(20, 'Appendix B: What do f and g do?', `
  <p class="lead">The operators put communication in the correct pass</p><span class="evidence-mode">Conceptual implementation map — paper Figure 4 and Code 1</span>
  <div style="height:350px;margin-top:32px">
    <div class="scene" data-scene="0"><div class="split-panel"><div><h3>Operator f</h3><p class="calc-equation">Forward: identity</p><p>Each GPU continues locally.</p></div><div><h3>Operator g</h3><p class="calc-equation">Forward: all-reduce</p><p>Partial outputs are combined.</p></div></div></div>
    <div class="scene" data-scene="1" hidden><div class="split-panel"><div><h3>Operator f</h3><p class="calc-equation">Backward: all-reduce</p><p>Gradients are combined.</p></div><div><h3>Operator g</h3><p class="calc-equation">Backward: identity</p><p>Each GPU continues locally.</p></div></div></div>
    <div class="scene" data-scene="2" hidden><p class="big-number">2 forward + 2 backward</p><p class="callout" style="margin-top:40px">That is the communication count for one model-parallel Transformer layer.</p></div>
  </div><p class="demo-cue"></p>
`, 'Shoeybi et al. (2020), Figure 4 and Code 1.', 'fg', 'pale');

const toyLogits = [0, 1, 2, -1];
const targetLogit = toyLogits[2];
const toyLoss = Math.log(toyLogits.reduce((sum, x) => sum + Math.exp(x), 0)) - targetLogit;
const slide21 = interactivePage(21, 'Appendix C: A toy vocabulary-loss calculation', `
  <p class="lead">Same loss; much less vocabulary-sized communication</p><span class="evidence-mode">Computed toy example — invented logits [0, 1, 2, −1]</span>
  <div style="height:330px;margin-top:27px">
    <div class="scene" data-scene="0"><div class="gpu-pair"><div class="gpu"><h3>GPU 1</h3><p class="calc-equation">cat 0<br>dog 1</p></div><div class="gpu amber-gpu"><h3>GPU 2</h3><p class="calc-equation">bird 2<br>fish −1</p></div></div><p class="scene-note" style="text-align:center">The correct word is “bird”.</p></div>
    <div class="scene" data-scene="1" hidden><div class="packet" style="background:#db5a63;width:630px;margin:55px auto">Naive: gather all four logits before cross-entropy</div><p class="scene-note" style="text-align:center">With a real vocabulary, that transfer grows with vocabulary size.</p></div>
    <div class="scene" data-scene="2" hidden><div class="packet small" style="width:670px;margin:55px auto">Megatron: local max / exp-sum and target information</div><p class="scene-note" style="text-align:center">Combine small per-token information instead of all word scores.</p></div>
    <div class="scene" data-scene="3" hidden><p class="big-number" style="text-align:center">Toy loss ≈ ${toyLoss.toFixed(3)}</p><p class="scene-note" style="text-align:center;margin-top:35px">Both paths calculate the same cross-entropy on these four logits.</p></div>
  </div><p class="demo-cue"></p>
`, 'Shoeybi et al. (2020), Section 3. Toy logits and loss are computed in the browser.', 'loss');

const slide22 = page(22, 'Appendix D: Original configuration tables', `
  <p class="lead">Click any original table to read its exact settings</p>
  <div class="tables-grid">${thumb('table-1','Original paper Table 1: scaling study configurations')}${thumb('table-2','Original paper Table 2: GPT-2 model configurations')}${thumb('table-4','Original paper Table 4: BERT model configurations')}</div>
`, 'Shoeybi et al. (2020), Tables 1, 2, and 4.', 'pale');

const terms = [
  ['DP','Batch','More examples in parallel'], ['TP','Within a layer','Large matrices across GPUs'], ['PP','Model depth','Different layers on stages'],
  ['SP / CP','Sequence positions','Activation memory or long context'], ['EP','Experts','Mixture-of-experts routing'], ['FSDP','Training states','Shard weights, gradients, optimizer state']
];
const slide23 = page(23, 'Appendix E: Modern parallelism names', `
  <p class="lead">Each abbreviation says what gets divided</p>
  <div class="term-table" style="margin-top:24px"><div class="head">NAME</div><div class="head">SPLIT</div><div class="head">WHY</div>${terms.map(([a,b,c])=>`<div class="abbr">${a}</div><div>${b}</div><div>${c}</div>`).join('')}</div>
`, 'NVIDIA Megatron Core Parallelism Strategies Guide, accessed 2026-09-20.');

const questions = [
  ['Why all-reduce?', 'Each GPU has one contribution to the same result, and both need the combined result.'],
  ['Why keep TP groups relatively small?', 'Every layer exchanges activations, so fast nearby links matter.'],
  ['Does TP change the calculation?', 'It reconstructs the same matrix operations, apart from normal floating-point ordering effects.'],
  ['What did the 2021 follow-up add?', 'It combined tensor, pipeline, and data parallelism and improved pipeline scheduling.'],
  ['What is the main evidence limit?', 'The best scaling results use the authors’ implementation and a particular fast hardware hierarchy.']
];
const slide24 = page(24, 'Appendix F: Likely questions', `<div class="qa-table" style="margin-top:15px">${questions.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>`, 'Prepared from Shoeybi et al. (2020), Narayanan et al. (2021), and NVIDIA Megatron Core.', 'dark');

stage.innerHTML = [...firstEight, slide9, slide10, slide11, slide12, slide13, slide14, slide15, slide16, slide17, slide18, slide19, slide20, slide21, slide22, slide23, slide24].join('');
const slides = [...stage.querySelectorAll('.slide')];
const demoCues = {
  vocab: ['The next-word scores are split between GPUs.', 'The naive path copies the whole vocabulary vector.', 'Megatron computes the loss locally first.', 'Only small per-token information crosses GPUs.'],
  hardware: ['Start with one 16-GPU DGX-2H server.', 'Keep frequent tensor-parallel traffic on fast local links.', 'The largest experiment used 32 servers: 512 GPUs.', 'The hierarchy shapes the result.'],
  scaling: ['The single-GPU run defines 100%.', 'The 8-GPU model-parallel case keeps 77%.', 'The 512-GPU combined case keeps 74%.', 'Weak scaling is not fixed-model speedup.'],
  bert: ['First compare the two block orders.', 'The red original 752M curve diverges.', 'The rearranged version remains stable.'],
  roadmap1: ['ZeRO attacks redundant state.', 'The 2021 follow-up composes three parallel dimensions.', 'GSPMD and Alpa broaden placement planning.', 'Sequence parallelism reduces activation memory.'],
  roadmap2: ['The 2021 paper combines parallel axes.', 'MegaScale adds production reliability and overlap.', 'DeepSeek-V3 adds expert routing as a systems concern.', 'Megatron Core documents composable strategies by 2026.'],
  gelu: ['Start with two partial inputs.', 'Combine first, then apply GeLU.', 'Applying GeLU separately changes the result.', 'The partition order matters.'],
  fg: ['Forward-pass behavior of f and g.', 'Backward-pass behavior of f and g.', 'Together: two all-reduces in each pass.'],
  loss: ['Four logits are split across two GPUs.', 'The naive route gathers all logits.', 'The parallel route shares small statistics.', 'Both routes return the same toy loss.']
};

let current = 0;
let timeline = null;
let activeDemo = null;
function resizeStage() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  shell.style.width = `${1280 * scale}px`;
  shell.style.height = `${720 * scale}px`;
  stage.style.transform = `scale(${scale})`;
}
function updateDemo(progress, state) {
  if (!activeDemo) return;
  const cues = demoCues[activeDemo.dataset.demo];
  const step = Math.min(cues.length - 1, Math.round(progress * (cues.length - 1)));
  activeDemo.querySelectorAll('.scene').forEach((scene, index) => { scene.hidden = index !== step; });
  activeDemo.querySelectorAll('[data-road]').forEach((item, index) => { item.classList.toggle('active', index === step); });
  const cue = activeDemo.querySelector('.demo-cue');
  if (cue) cue.textContent = cues[step];
  const slide = activeDemo.closest('.slide');
  slide.querySelector('[data-action="seek"]').value = String(Math.round(progress * 100));
  slide.querySelector('.step-count').textContent = `Step ${step + 1} / ${cues.length}`;
  const play = slide.querySelector('[data-action="play"]');
  play.textContent = state.playing ? 'Ⅱ' : '▶';
  play.setAttribute('aria-label', state.playing ? 'Pause animation' : 'Play animation');
}
function setupDemo(slide) {
  activeDemo = slide.querySelector('[data-demo]');
  if (!activeDemo) return;
  const cues = demoCues[activeDemo.dataset.demo];
  timeline = createTimeline({ duration: 14000, steps: cues.length - 1, render: updateDemo });
  applyMotionPreference();
}
function applyMotionPreference() {
  slides.forEach(slide => {
    const play = slide.querySelector('[data-action="play"]');
    if (!play) return;
    play.disabled = prefersReducedMotion();
    play.title = prefersReducedMotion()
      ? 'Automatic playback is disabled by reduced-motion settings; use step controls.'
      : 'Play or pause';
  });
  if (prefersReducedMotion() && timeline) timeline.pause();
}
function stopDemo() {
  if (timeline) timeline.destroy();
  timeline = null;
  activeDemo = null;
}
function goTo(index, updateHash = true) {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  stopDemo();
  slides[current].hidden = true;
  current = next;
  slides[current].hidden = false;
  pageStatus.textContent = `${current + 1} / ${slides.length}`;
  previousButton.disabled = current === 0;
  nextButton.disabled = current === slides.length - 1;
  setupDemo(slides[current]);
  if (updateHash) history.replaceState(null, '', `#slide-${current + 1}`);
}
function hashIndex() {
  const value = Number((location.hash.match(/^#slide-(\d+)$/) || [])[1]);
  return Number.isInteger(value) && value >= 1 && value <= slides.length ? value - 1 : 0;
}
previousButton.addEventListener('click', () => goTo(current - 1));
nextButton.addEventListener('click', () => goTo(current + 1));
document.querySelector('#fullscreen').addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.querySelector('#presentation').requestFullscreen();
  resizeStage();
});
window.addEventListener('resize', resizeStage);
window.addEventListener('hashchange', () => goTo(hashIndex(), false));
reducedMotion.addEventListener('change', applyMotionPreference);
document.addEventListener('visibilitychange', () => { if (document.hidden && timeline) timeline.pause(); });
stage.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (control && timeline) {
    const action = control.dataset.action;
    if (action === 'reset') timeline.reset();
    if (action === 'back') timeline.step(-1);
    if (action === 'forward') timeline.step(1);
    if (action === 'play' && !prefersReducedMotion()) timeline.state.playing ? timeline.pause() : timeline.play();
  }
  const figure = event.target.closest('[data-figure]');
  if (figure) {
    if (timeline) timeline.pause();
    figureFull.src = figure.dataset.figure;
    figureFull.alt = figure.dataset.caption;
    figureCaption.textContent = figure.dataset.caption;
    figureModal.showModal();
  }
});
stage.addEventListener('input', event => {
  if (event.target.matches('[data-action="seek"]') && timeline) timeline.seek(Number(event.target.value) / 100);
  if (event.target.matches('[data-action="speed"]') && timeline) timeline.setSpeed(Number(event.target.value));
});
document.querySelector('#close-figure').addEventListener('click', () => figureModal.close());
figureModal.addEventListener('click', event => { if (event.target === figureModal) figureModal.close(); });
document.addEventListener('keydown', event => {
  if (figureModal.open) return;
  if (event.key === 'ArrowRight' && !event.target.matches('input')) { event.preventDefault(); goTo(current + 1); }
  if (event.key === 'ArrowLeft' && !event.target.matches('input')) { event.preventDefault(); goTo(current - 1); }
  if (event.key === ' ' && timeline && !prefersReducedMotion() && !event.target.matches('button,input,select')) { event.preventDefault(); timeline.state.playing ? timeline.pause() : timeline.play(); }
});
resizeStage();
current = hashIndex();
slides.forEach((slide, index) => { slide.hidden = index !== current; });
goTo(current, false);
setTimeout(applyMotionPreference, 0);

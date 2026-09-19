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

const paper = name => `./assets/paper/${name}.png`;
const thumb = (name, caption, extra = '') => `<button class="paper-thumb ${extra}" type="button" data-figure="${paper(name)}" data-caption="${caption}" aria-label="Enlarge ${caption}"><img src="${paper(name)}" alt="${caption}" /></button>`;
const source = text => `<div class="source-line">${text}</div>`;
const head = (number, title) => `<header class="slide-header"><h1>${title}</h1><span class="num">${String(number).padStart(2, '0')}</span></header>`;
const page = (number, title, body, footer, type = '') => `<section class="slide ${type}" data-slide="${number}" aria-label="Slide ${number}: ${title}" hidden>${head(number, title)}<div class="slide-body">${body}</div>${source(footer)}</section>`;
const mode = text => `<span class="evidence-mode">${text}</span>`;
const firstEight = Array.from({ length: 8 }, (_, index) => {
  const number = index + 1;
  return `<section class="slide image-slide" data-slide="${number}" aria-label="Original slide ${number}, preserved from the PowerPoint" hidden><img src="./assets/slides/slide-${String(number).padStart(2, '0')}.png" alt="Original PowerPoint slide ${number}, preserved without content changes" /></section>`;
});

const slide9 = page(9, 'Why fuse the vocabulary-parallel loss?', `
  <div class="lab-layout vocab-lab">
    <div class="lab-main">
      <p class="lead">Move less data without changing the toy loss</p>
      ${mode('Computed toy loss + communication-shape illustration')}
      <div class="lab-toolbar" aria-label="Vocabulary simulator controls">
        <label>Vocabulary <select id="vocab-size"><option value="8">8 visible words</option><option value="1000">1,000 words</option><option value="51200" selected>51,200 words</option></select></label>
        <label>GPUs <select id="vocab-gpus"><option value="2" selected>2</option><option value="4">4</option></select></label>
        <div class="segmented" role="group" aria-label="Communication route"><button type="button" data-vocab-method="naive">Gather logits</button><button type="button" data-vocab-method="fused" aria-pressed="true">Fuse loss</button></div>
        <button id="vocab-run" class="action-button" type="button">Run messages</button>
      </div>
      <div id="vocab-visual" class="vocab-visual" aria-live="polite"></div>
      <div class="formula-ribbon"><span>Cross-entropy:</span> <b>L = log Σ exp(zᵢ) − z<sub>target</sub></b><span id="vocab-formula-note"></span></div>
      <div id="vocab-metrics" class="metric-strip"></div>
    </div>
    <aside class="evidence-panel">
      <h2>What the paper changes</h2>
      <div class="shape-compare"><div><b>Naive</b><span>b × s × v logits</span></div><div class="arrow-glyph">→</div><div><b>Fused</b><span>b × s losses</span></div></div>
      <p>The paper avoids communicating the vocabulary dimension. The eight visible logits determine the toy loss; the selected vocabulary size determines only the communication-scale comparison. Payload-bar width uses a log scale.</p>
      <div class="paper-quote">“Communicating scalar losses instead of logits is a huge reduction.”</div>
    </aside>
  </div>
`, 'Shoeybi et al. (2020), Section 3. GPT-2 vocabulary is padded to 51,200 in the scaling study.', 'pale');

const slide10 = page(10, 'Why hardware topology changes the answer', `
  <div class="lab-layout topology-lab">
    <div class="lab-main">
      <p class="lead">Same tensor split; different communication path</p>
      ${mode('Conceptual placement + paper-reported bandwidth')}
      <div class="lab-toolbar">
        <div class="segmented" role="group" aria-label="Tensor parallel placement"><button type="button" data-topology="local" aria-pressed="true">Keep TP local</button><button type="button" data-topology="cross">Cross servers</button></div>
        <label>Traffic illustration <select id="traffic-size"><option value="0.25">0.25 GB</option><option value="1" selected>1 GB</option><option value="4">4 GB</option></select></label>
        <button id="topology-run" class="action-button" type="button">Send partial results</button>
      </div>
      <div id="topology-visual" class="topology-visual" aria-live="polite"></div>
      <div id="topology-metrics" class="metric-strip"></div>
      <p class="tiny-note">Bandwidth-only time is an idealized division of bytes by link bandwidth—not a measured all-reduce latency.</p>
    </div>
    <aside class="evidence-panel compact-evidence">
      ${thumb('figure-1', 'Original paper Figure 1: throughput versus GPU count')}
      ${thumb('table-1', 'Original paper Table 1: scaling configurations')}
      <p>Paper setup: 300 GB/s inside a DGX-2H via NVSwitch; 100 GB/s between servers.</p>
    </aside>
  </div>
`, 'Shoeybi et al. (2020), Section 5.1, Figure 1, and Table 1.');

const slide11 = page(11, 'What do 77% and 74% actually mean?', `
  <div class="lab-layout scaling-lab">
    <div class="lab-main">
      <p class="lead">Replay the paper's recorded scaling points</p>
      ${mode('Recorded paper data replay — no interpolated measurements')}
      <div class="lab-toolbar">
        <label>Experiment <select id="scaling-scenario"><option value="model">Weak scaling: model parallel</option><option value="combined">Weak scaling: model + data</option><option value="strong">Strong scaling: fixed model</option></select></label>
        <label class="grow-control"><span id="scaling-point-label">Point</span><input id="scaling-point" type="range" min="0" max="3" step="1" value="3" /></label>
      </div>
      <div id="scaling-context" class="context-line"></div>
      <div id="scaling-bars" class="scaling-bars" aria-live="polite"></div>
      <div id="scaling-equation" class="formula-ribbon"></div>
      <p id="scaling-interpretation" class="teaching-line"></p>
    </div>
    <aside class="evidence-panel compact-evidence">
      ${thumb('figure-5', 'Original paper Figure 5: weak-scaling efficiency')}
      ${thumb('table-8', 'Original paper Table 8: fixed-model strong scaling')}
      <p>Weak scaling grows the model. Strong scaling holds the 1.2B model fixed.</p>
    </aside>
  </div>
`, 'Shoeybi et al. (2020), Figure 5 and Appendix D.2 Table 8.', 'pale');

const slide12 = page(12, 'Did larger GPT models improve results?', `
  <div class="lab-layout quality-lab">
    <div class="lab-main">
      <p class="lead">Select a model and read the recorded outcomes</p>
      ${mode('Recorded paper data explorer')}
      <div class="model-selector" role="group" aria-label="Model size"><button type="button" data-model="0">355M</button><button type="button" data-model="1">2.5B</button><button type="button" data-model="2" aria-pressed="true">8.3B</button></div>
      <div id="quality-visual" class="quality-visual" aria-live="polite"></div>
      <p class="teaching-line">Larger capacity correlates with better results here; tensor parallelism is the enabler, not the source of accuracy by itself.</p>
    </div>
    <aside class="evidence-panel compact-evidence">
      ${thumb('figure-6', 'Original paper Figure 6: validation perplexity')}
      ${thumb('table-3', 'Original paper Table 3: zero-shot results')}
      <p id="quality-paper-note"></p>
    </aside>
  </div>
`, 'Shoeybi et al. (2020), Figure 6 and Tables 2–3.');

const slide13 = page(13, 'What changed in the BERT block?', `
  <div class="lab-layout bert-lab">
    <div class="lab-main">
      <p class="lead">Watch where the residual branch begins</p>
      ${mode('Conceptual signal path + recorded paper outcome')}
      <div class="lab-toolbar"><div class="segmented" role="group" aria-label="BERT block order"><button type="button" data-bert="original">Original order</button><button type="button" data-bert="rearranged" aria-pressed="true">Rearranged order</button></div><button id="bert-run" class="action-button" type="button">Send a signal</button></div>
      <div id="bert-block" class="bert-block" aria-live="polite"></div>
      <div id="bert-outcome" class="result-callout"></div>
      <p class="tiny-note">The moving signal shows the residual branch point, not a simulated training run. Stability is evidenced by the original Figure 7 curve.</p>
    </div>
    <aside class="evidence-panel compact-evidence">
      ${thumb('figure-7', 'Original paper Figure 7: BERT block order and training loss')}
      ${thumb('table-5', 'Original paper Table 5: downstream results')}
    </aside>
  </div>
`, 'Shoeybi et al. (2020), Figure 7 and Tables 4–5.', 'pale');

const slide14 = page(14, 'Match the claim to the right evidence', `
  <p class="lead">A systems paper needs different evidence for different claims</p>
  ${mode('Interactive evidence-matching exercise')}
  <div class="match-layout">
    <div><h2>1. Select a claim</h2><div id="claim-list" class="choice-stack"></div></div>
    <div class="match-arrow">→</div>
    <div><h2>2. Select its evidence</h2><div id="evidence-list" class="choice-stack"></div></div>
  </div>
  <div id="match-feedback" class="result-callout" aria-live="polite">Select one claim, then choose the evidence that can actually support it.</div>
`, 'Shoeybi et al. (2020), Figures 3–7 and Tables 3, 5, and 8.');

const slide15 = page(15, 'Where does the evidence stop?', `
  <p class="lead">Probe the boundary between tested, partly examined, and outside scope</p>
  ${mode('Evidence-scope audit')}
  <div class="scope-layout"><div id="scope-grid" class="scope-grid"></div><div id="scope-detail" class="scope-detail" aria-live="polite"></div></div>
  <div class="scope-legend"><span class="tested">● Tested</span><span class="partial">● Limited / not isolated</span><span class="outside">● Outside this paper</span></div>
`, 'Critical synthesis from Shoeybi et al. (2020), Sections 5–6 and Appendix D.2.', 'dark');

const slide16 = page(16, 'Which later method solves which bottleneck?', `
  <div class="lab-layout roadmap-lab">
    <div class="lab-main">
      <p class="lead">Choose the bottleneck; watch a different dimension split</p>
      ${mode('Conceptual roadmap — effects are schematic')}
      <div id="bottleneck-buttons" class="model-selector four-way" role="group" aria-label="Bottleneck"></div>
      <div class="lab-toolbar"><label>Partitions <select id="road-parts"><option value="2">2</option><option value="4" selected>4</option><option value="8">8</option></select></label></div>
      <div id="road-visual" class="road-visual" aria-live="polite"></div>
      <div id="road-formula" class="formula-ribbon"></div>
    </div>
    <aside class="evidence-panel roadmap-evidence"><h2>Milestones</h2><ol><li><b>2020 ZeRO</b><span>state memory</span></li><li><b>2021 Megatron 3D</b><span>tensor × pipeline × data</span></li><li><b>2021–22 GSPMD / Alpa</b><span>placement plans</span></li><li><b>2022 sequence parallelism</b><span>activation memory</span></li></ol></aside>
  </div>
`, 'ZeRO (2020); Narayanan et al. (2021); GSPMD (2021); Alpa (2022); sequence parallelism (2022).', 'pale');

const slide17 = page(17, 'Compose the parallel axes yourself', `
  <p class="lead">Modern training systems multiply several independent choices</p>
  ${mode('Computed topology example — not a measured training run')}
  <div class="composer-layout">
    <div class="composer-controls">
      <label>Tensor (TP)<select data-axis="tp"><option>1</option><option selected>2</option><option>4</option><option>8</option></select></label>
      <label>Pipeline (PP)<select data-axis="pp"><option>1</option><option selected>2</option><option>4</option></select></label>
      <label>Data (DP)<select data-axis="dp"><option>1</option><option selected>2</option><option>4</option></select></label>
      <label>Expert (EP)<select data-axis="ep"><option selected>1</option><option>2</option><option>4</option></select></label>
      <div id="composer-equation" class="composer-equation"></div>
      <p id="composer-note"></p>
    </div>
    <div><div id="gpu-grid" class="gpu-grid" aria-live="polite"></div><p id="gpu-grid-note" class="tiny-note"></p></div>
  </div>
  <div class="milestone-line"><span>2021: combine TP × PP × DP</span><span>2024–25: add production reliability and expert routing</span><span>2026: composable strategies</span></div>
`, 'Narayanan et al. (2021); MegaScale (2024); DeepSeek-V3; NVIDIA Megatron Core guide, accessed 2026-09-20.');

const slide18 = page(18, 'Run one complete Transformer layer', `
  <p class="lead">Local compute → synchronize → local compute → synchronize</p>
  ${mode('Conceptual whole-system recap')}
  <div class="layer-toolbar"><button id="layer-reset" type="button">Reset</button><button id="layer-back" type="button">Previous phase</button><button id="layer-play" class="action-button" type="button">Play</button><button id="layer-forward" type="button">Next phase</button><label class="grow-control">Layer progress<input id="layer-seek" type="range" min="0" max="100" value="0" /></label></div>
  <div id="layer-simulator" class="layer-simulator" aria-live="polite">
    <svg viewBox="0 0 1060 300" role="img" aria-label="Two GPU lanes running attention and MLP with two synchronization points">
      <line class="lane-line" x1="80" y1="95" x2="980" y2="95"/><line class="lane-line" x1="80" y1="225" x2="980" y2="225"/>
      <text x="18" y="102">GPU 1</text><text x="18" y="232">GPU 2</text>
      <g class="phase-node" data-phase="0"><rect x="78" y="60" width="100" height="200"/><text x="128" y="44">Input</text></g>
      <g class="phase-node" data-phase="1"><rect x="225" y="60" width="185" height="200"/><text x="317" y="44">Attention: local heads</text></g>
      <g class="phase-node sync-node" data-phase="2"><rect x="435" y="35" width="100" height="250"/><text x="485" y="20">All-reduce 1</text></g>
      <g class="phase-node" data-phase="3"><rect x="560" y="60" width="185" height="200"/><text x="652" y="44">MLP: local shards</text></g>
      <g class="phase-node sync-node" data-phase="4"><rect x="770" y="35" width="100" height="250"/><text x="820" y="20">All-reduce 2</text></g>
      <g class="phase-node" data-phase="5"><rect x="895" y="60" width="85" height="200"/><text x="938" y="44">Output</text></g>
      <circle id="layer-dot-1" class="activation-dot gpu-one" r="13" cx="80" cy="95"/><circle id="layer-dot-2" class="activation-dot gpu-two" r="13" cx="80" cy="225"/>
    </svg>
  </div>
  <div id="layer-caption" class="result-callout"></div>
`, 'Synthesis of Shoeybi et al. (2020), Figures 3–4.', 'pale');

const slide19 = page(19, 'Appendix A: See why GeLU breaks the row-first split', `
  <p class="lead">Move the two partial inputs and compare both expressions</p>
  ${mode('Computed toy example — values recompute live')}
  <div class="gelu-layout">
    <div class="gelu-controls"><label>x₁ from GPU 1 <span id="x1-value"></span><input id="x1" type="range" min="-2" max="2" step="0.1" value="1" /></label><label>x₂ from GPU 2 <span id="x2-value"></span><input id="x2" type="range" min="-2" max="2" step="0.1" value="-1" /></label><div id="gelu-equations" class="equation-stack"></div></div>
    <svg id="gelu-plot" viewBox="0 0 720 315" role="img" aria-label="GeLU curve with two partial inputs and their sum"></svg>
  </div>
  <div id="gelu-conclusion" class="result-callout" aria-live="polite"></div>
`, 'Shoeybi et al. (2020), Equations 1–3. GeLU values are computed in the browser.');

const slide20 = page(20, 'Appendix B: Test the f and g operators', `
  <p class="lead">Choose a pass; numeric values show identity or all-reduce</p>
  ${mode('Computed operator example')}
  <div class="operator-toolbar"><div class="segmented"><button type="button" data-operator="f" aria-pressed="true">Operator f</button><button type="button" data-operator="g">Operator g</button></div><div class="segmented"><button type="button" data-pass="forward" aria-pressed="true">Forward</button><button type="button" data-pass="backward">Backward</button></div><button id="operator-run" class="action-button" type="button">Apply operator</button></div>
  <div class="operator-layout"><div class="operator-inputs"><label>GPU 1 value <input id="op-a" type="number" min="-9" max="9" step="1" value="1" /></label><label>GPU 2 value <input id="op-b" type="number" min="-9" max="9" step="1" value="2" /></label></div><div id="operator-visual" class="operator-visual" aria-live="polite"></div></div>
  <div id="operator-rule" class="formula-ribbon"></div>
`, 'Shoeybi et al. (2020), Code 1 and Figure 4.', 'pale');

const slide21 = page(21, 'Appendix C: Build distributed softmax loss', `
  <p class="lead">Change the logits, then construct the exact loss from local pieces</p>
  ${mode('Computed toy example — every value derives from the inputs')}
  <div class="softmax-toolbar"><label>Target <select id="softmax-target"><option value="0">cat</option><option value="1">dog</option><option value="2" selected>bird</option><option value="3">fish</option></select></label><button id="softmax-back" type="button">Previous calculation</button><button id="softmax-next" class="action-button" type="button">Next calculation</button><button id="softmax-reset" type="button">Reset</button></div>
  <div class="softmax-layout"><div id="logit-controls" class="logit-controls"></div><div id="softmax-calc" class="softmax-calc" aria-live="polite"></div></div>
  <div id="softmax-stage" class="formula-ribbon"></div>
`, 'Shoeybi et al. (2020), Section 3. The displayed distributed log-sum-exp is a deterministic teaching construction.');

const slide22 = page(22, 'Appendix D: Original configuration tables', `
  <p class="lead">Enlarge the unmodified paper tables for exact settings</p>
  <div class="tables-grid">${thumb('table-1', 'Original paper Table 1: scaling study configurations')}${thumb('table-2', 'Original paper Table 2: GPT-2 model configurations')}${thumb('table-4', 'Original paper Table 4: BERT model configurations')}</div>
`, 'Shoeybi et al. (2020), Tables 1, 2, and 4.', 'pale');

const slide23 = page(23, 'Appendix E: What does each parallelism name split?', `
  <p class="lead">Select a name; the affected model dimension becomes visible</p>
  ${mode('Conceptual glossary')}
  <div id="glossary-buttons" class="glossary-buttons" role="group" aria-label="Parallelism names"></div>
  <div class="glossary-layout"><div id="glossary-visual" class="glossary-visual"></div><div id="glossary-detail" class="glossary-detail" aria-live="polite"></div></div>
`, 'NVIDIA Megatron Core Parallelism Strategies Guide, accessed 2026-09-20.');

stage.innerHTML = [...firstEight, slide9, slide10, slide11, slide12, slide13, slide14, slide15, slide16, slide17, slide18, slide19, slide20, slide21, slide22, slide23].join('');
const slides = [...stage.querySelectorAll('.slide')];

const toyWords = [
  ['cat', 0.2], ['dog', 1.0], ['bird', 2.0], ['fish', 0.5],
  ['tree', -0.4], ['car', 1.4], ['book', 0.7], ['moon', -1.0]
];
const logSumExp = values => {
  const maximum = Math.max(...values);
  return maximum + Math.log(values.reduce((sum, value) => sum + Math.exp(value - maximum), 0));
};
const toyLoss = logSumExp(toyWords.map(item => item[1])) - toyWords[2][1];
let vocabMethod = 'fused';

function renderVocab() {
  const vocabulary = Number(document.querySelector('#vocab-size').value);
  const gpus = Number(document.querySelector('#vocab-gpus').value);
  const visual = document.querySelector('#vocab-visual');
  const shards = Array.from({ length: gpus }, (_, gpu) => toyWords.filter((_, index) => index % gpus === gpu));
  const payloadWidth = vocabMethod === 'naive' ? Math.round(17 + Math.log10(vocabulary) * 12) : 12;
  visual.innerHTML = `<div class="vocab-shards">${shards.map((shard, gpu) => `<div class="vocab-gpu"><b>GPU ${gpu + 1}</b>${shard.map(([word, value]) => `<span class="token-logit ${word === 'bird' ? 'target-token' : ''}">${word}<i>${value.toFixed(1)}</i></span>`).join('')}<small>${(vocabulary / gpus).toLocaleString()} vocabulary rows</small></div>`).join('')}</div><div class="message-bus ${vocabMethod}" aria-hidden="true"><i class="payload-object" style="width:${payloadWidth}%">${vocabMethod === 'naive' ? `${vocabulary.toLocaleString()} logits` : 'small statistics'}</i><b>${vocabMethod === 'naive' ? 'Gather full vocabulary vector' : 'Reduce max, exp-sum, and target logit'}</b></div>`;
  document.querySelectorAll('[data-vocab-method]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.vocabMethod === vocabMethod)));
  const width = vocabMethod === 'naive' ? vocabulary : 1;
  const ratio = vocabulary;
  document.querySelector('#vocab-formula-note').textContent = vocabMethod === 'naive' ? 'All logits move before the same formula is evaluated.' : 'Local pieces are reduced before the same formula is evaluated.';
  document.querySelector('#vocab-metrics').innerHTML = `<div><span>Communicated dimension</span><b>${vocabMethod === 'naive' ? `v = ${width.toLocaleString()}` : '1 loss / token'}</b></div><div><span>Toy loss</span><b>${toyLoss.toFixed(3)}</b></div><div><span>Vocabulary factor removed</span><b>${vocabMethod === 'fused' ? `${ratio.toLocaleString()}×` : 'none'}</b></div>`;
}

let topologyMode = 'local';
function serverMarkup(number, active) {
  return `<div class="server ${active ? 'active' : ''}"><b>DGX-2H ${number}</b><div class="gpu-dots">${Array.from({ length: 8 }, (_, index) => `<i class="gpu-dot ${active ? 'tp-member' : ''}">${index + 1}</i>`).join('')}</div><span>NVSwitch: 300 GB/s</span></div>`;
}
function renderTopology() {
  const traffic = Number(document.querySelector('#traffic-size').value);
  const visual = document.querySelector('#topology-visual');
  visual.innerHTML = `${serverMarkup(1, true)}<div class="interconnect ${topologyMode}"><span>InfiniBand: 100 GB/s</span><i class="topology-packet">partial result</i></div>${serverMarkup(2, topologyMode === 'cross')}`;
  document.querySelectorAll('[data-topology]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topology === topologyMode)));
  const bandwidth = topologyMode === 'local' ? 300 : 100;
  const milliseconds = traffic / bandwidth * 1000;
  document.querySelector('#topology-metrics').innerHTML = `<div><span>Bottleneck tier used</span><b>${topologyMode === 'local' ? 'NVSwitch only' : 'Inter-server link'}</b></div><div><span>Paper bandwidth</span><b>${bandwidth} GB/s</b></div><div><span>${traffic} GB ÷ bandwidth</span><b>${milliseconds.toFixed(2)} ms</b></div>`;
}

const scalingData = {
  model: { label: 'Weak scaling · tensor parallel only', gpus: [1, 2, 4, 8], model: [1.2, 2.5, 4.2, 8.3], efficiency: [100, 95, 82, 77] },
  combined: { label: 'Weak scaling · tensor + data parallel', gpus: [64, 128, 256, 512], model: [1.2, 2.5, 4.2, 8.3], efficiency: [96, 83, 79, 74] },
  strong: { label: 'Strong scaling · fixed 1.2B model', gpus: [1, 2, 4, 8], speedup: [1, 1.64, 2.34, 2.98] }
};
function renderScaling() {
  const scenario = document.querySelector('#scaling-scenario').value;
  const index = Number(document.querySelector('#scaling-point').value);
  const data = scalingData[scenario];
  const gpus = data.gpus[index];
  document.querySelector('#scaling-point-label').textContent = `${gpus} GPUs`;
  document.querySelector('#scaling-context').innerHTML = `<b>${data.label}</b><span>${scenario === 'strong' ? 'Model stays at 1.2B parameters' : `Model grows to ${data.model[index]}B parameters`}</span>`;
  if (scenario === 'strong') {
    const observed = data.speedup[index];
    const efficiency = observed / gpus * 100;
    document.querySelector('#scaling-bars').innerHTML = `<div class="scale-bar ideal"><span>Ideal speedup</span><i style="--bar:${100}%"></i><b>${gpus.toFixed(0)}×</b></div><div class="scale-bar observed"><span>Recorded speedup</span><i style="--bar:${observed / gpus * 100}%"></i><b>${observed.toFixed(2)}×</b></div>`;
    document.querySelector('#scaling-equation').innerHTML = `<b>Efficiency = ${observed.toFixed(2)} ÷ ${gpus} = ${efficiency.toFixed(1)}%</b>`;
    document.querySelector('#scaling-interpretation').textContent = 'Adding GPUs accelerates the fixed model, but diminishing computation per GPU makes communication dominate.';
  } else {
    const efficiency = data.efficiency[index];
    const equivalent = gpus * efficiency / 100;
    document.querySelector('#scaling-bars').innerHTML = `<div class="scale-bar ideal"><span>Ideal linear throughput</span><i style="--bar:100%"></i><b>100%</b></div><div class="scale-bar observed"><span>Recorded efficiency</span><i style="--bar:${efficiency}%"></i><b>${efficiency}%</b></div>`;
    document.querySelector('#scaling-equation').innerHTML = `<b>${efficiency}% = observed throughput ÷ ideal throughput</b><span>Equivalent to ${equivalent.toFixed(1)} ideally scaling GPUs at this point</span>`;
    document.querySelector('#scaling-interpretation').textContent = 'This does not mean one fixed model became that many times faster: model size increased with the GPU count.';
  }
}

const qualityData = [
  { name: '355M', ppl: 19.31, acc: 45.18, gpus: 64, epoch: 0.86 },
  { name: '2.5B', ppl: 12.76, acc: 61.73, gpus: 128, epoch: 2.27 },
  { name: '8.3B', ppl: 10.81, acc: 66.51, gpus: 512, epoch: 2.10 }
];
let qualityIndex = 2;
function renderQuality() {
  const item = qualityData[qualityIndex];
  document.querySelectorAll('[data-model]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.model) === qualityIndex)));
  const pplScore = (22 - item.ppl) / 14 * 100;
  document.querySelector('#quality-visual').innerHTML = `<div class="quality-row"><span>WikiText103 perplexity <small>lower is better</small></span><div class="quality-track"><i style="width:${Math.max(8, pplScore)}%"></i></div><b>${item.ppl.toFixed(2)}</b></div><div class="quality-row accuracy"><span>LAMBADA accuracy <small>higher is better</small></span><div class="quality-track"><i style="width:${item.acc}%"></i></div><b>${item.acc.toFixed(2)}%</b></div><div class="quality-context"><b>${item.name} model</b><span>${item.gpus} GPUs in Table 2</span><span>${item.epoch.toFixed(2)} days per epoch</span></div>`;
  document.querySelector('#quality-paper-note').textContent = item.name === '8.3B' ? 'Figure 6 also reports validation perplexity 9.27 for the 8.3B model.' : 'The bars use the exact zero-shot values from Table 3.';
}

let bertMode = 'rearranged';
function renderBert() {
  document.querySelectorAll('[data-bert]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.bert === bertMode)));
  const branchX = bertMode === 'original' ? 295 : 110;
  const branchLabel = bertMode === 'original' ? 'Residual copies the normalized input' : 'Residual copies the raw input';
  document.querySelector('#bert-block').innerHTML = `<svg class="bert-mechanism" viewBox="0 0 760 230" role="img" aria-label="LayerNorm and sublayer stay in the main path; the residual branch begins ${bertMode === 'original' ? 'after' : 'before'} LayerNorm">
    <defs><marker id="bert-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#67808f"/></marker></defs>
    <path class="bert-main-path" d="M45 155 H655" marker-end="url(#bert-arrow)"/>
    <path id="bert-branch-path" class="bert-branch-path" d="M${branchX} 155 V70 Q${branchX} 48 ${branchX + 22} 48 H626 Q650 48 650 72 V154"/>
    <circle cx="110" cy="155" r="6" fill="#db5a63"/><circle cx="295" cy="155" r="6" fill="#db5a63"/>
    <rect x="160" y="125" width="105" height="60" rx="9" class="bert-ln"/><text x="212" y="160">LayerNorm</text>
    <rect x="355" y="125" width="158" height="60" rx="9" class="bert-sublayer"/><text x="434" y="160">Attention / MLP</text>
    <circle cx="650" cy="155" r="29" class="bert-add"/><text x="650" y="162" class="bert-plus">+</text>
    <text x="48" y="203">input</text><text x="719" y="203">output</text>
    <text x="378" y="32" class="bert-branch-label">${branchLabel}</text>
    <circle id="bert-signal-main" cx="45" cy="155" r="8" fill="#db5a63" opacity="0"><animateMotion id="bert-main-motion" dur="1.8s" path="M45 155 H655" fill="freeze" begin="indefinite"/></circle>
    <circle id="bert-signal-branch" cx="${branchX}" cy="155" r="8" fill="#f1b64a" opacity="0"><animateMotion id="bert-branch-motion" dur="1.8s" path="M${branchX} 155 V70 Q${branchX} 48 ${branchX + 22} 48 H626 Q650 48 650 72 V154" fill="freeze" begin="indefinite"/></circle>
  </svg>`;
  document.querySelector('#bert-outcome').innerHTML = bertMode === 'original' ? '<b>Paper observation:</b> the original 752M curve develops a large loss spike.' : '<b>Paper observation:</b> the rearranged 752M curve remains stable and reaches lower loss.';
}

const claimData = [
  { id: 'mechanism', text: 'The Transformer can be partitioned with only a few synchronization points.', evidence: 'fig34', explanation: 'Figures 3–4 show where matrices are split and where collectives occur.' },
  { id: 'scaling', text: 'The implementation uses many GPUs efficiently on the tested system.', evidence: 'fig5', explanation: 'Figure 5 and Table 8 report scaling behavior and its limits.' },
  { id: 'quality', text: 'The larger trainable models improve language and BERT results.', evidence: 'fig67', explanation: 'Figures 6–7 and Tables 3 and 5 report model-quality outcomes.' }
];
const evidenceData = [
  { id: 'fig67', text: 'Figures 6–7 + Tables 3 and 5', tag: 'quality metrics' },
  { id: 'fig34', text: 'Figures 3–4', tag: 'partition mechanism' },
  { id: 'fig5', text: 'Figure 5 + Table 8', tag: 'systems performance' }
];
let selectedClaim = null;
let matchedClaims = new Set();
function renderMatcher() {
  document.querySelector('#claim-list').innerHTML = claimData.map((item, index) => `<button type="button" data-claim="${item.id}" aria-pressed="${selectedClaim === item.id}"><span>${index + 1}</span>${item.text}${matchedClaims.has(item.id) ? '<b>✓</b>' : ''}</button>`).join('');
  document.querySelector('#evidence-list').innerHTML = evidenceData.map(item => `<button type="button" data-evidence="${item.id}"><span>${item.tag}</span>${item.text}</button>`).join('');
}

const scopeItems = [
  ['Dense GPT and BERT', 'tested', 'The experiments train dense GPT-2-style and BERT-style Transformers.'],
  ['DGX-2H hierarchy', 'tested', 'All experiments use up to 32 DGX-2H servers with V100 GPUs.'],
  ['Weak scaling', 'tested', 'Figure 5 grows model size with the number of GPUs.'],
  ['Fixed-model strong scaling', 'partial', 'Appendix Table 8 tests a fixed 1.2B model only up to eight GPUs.'],
  ['Alternative network topology', 'partial', 'The paper reports one hardware hierarchy; topology effects are not isolated experimentally.'],
  ['Head-to-head framework baseline', 'outside', 'The main comparison is the authors’ own single-GPU implementation, not GPipe or Mesh-TensorFlow.'],
  ['Mixture-of-experts models', 'outside', 'MoE architectures are outside this 2020 study.'],
  ['More than 8-way tensor parallel', 'outside', 'The main tensor-parallel experiments stop at eight-way model parallelism.']
];
function renderScope() {
  document.querySelector('#scope-grid').innerHTML = scopeItems.map(([label, status], index) => `<button type="button" data-scope="${index}" class="${status}"><span>${status === 'tested' ? '✓' : status === 'partial' ? '△' : '—'}</span>${label}</button>`).join('');
  document.querySelector('#scope-detail').innerHTML = '<b>Click any cell</b><p>The color marks what the paper can and cannot establish.</p>';
}

const bottlenecks = [
  { id: 'states', button: 'Optimizer state', paper: 'ZeRO · 2020', dimension: 'training state', before: 'every worker holds full training states', item: 'state blocks', note: 'Shard optimizer states, gradients, and parameters instead of duplicating every copy.' },
  { id: 'depth', button: 'Model depth', paper: 'Megatron 3D · 2021', dimension: 'layer depth', before: 'every worker holds all layers', item: 'layer groups', note: 'Pipeline stages own different consecutive layers.' },
  { id: 'sequence', button: 'Activations', paper: 'Sequence parallel · 2022', dimension: 'sequence positions', before: 'each TP worker holds all token activations', item: 'token ranges', note: 'Shard sequence activations within a tensor-parallel region.' },
  { id: 'placement', button: 'Placement search', paper: 'GSPMD / Alpa · 2021–22', dimension: 'device mapping', before: 'manually choose device placement', item: 'TP ranks', note: 'Compare device mappings for the same shards; a placement plan is not another 1/N split.' }
];
let bottleneckIndex = 0;
function renderRoadmap() {
  const parts = Number(document.querySelector('#road-parts').value);
  const item = bottlenecks[bottleneckIndex];
  document.querySelector('#bottleneck-buttons').innerHTML = bottlenecks.map((entry, index) => `<button type="button" data-bottleneck="${index}" aria-pressed="${index === bottleneckIndex}">${entry.button}</button>`).join('');
  const after = item.id === 'placement'
    ? `<div class="placement-options"><div><b>Candidate A</b><span>scatter ${parts} TP ranks across servers</span><i>more slow-link crossings</i></div><div><b>Candidate B</b><span>group the same ${parts} ranks locally</span><i>fewer slow-link crossings</i></div></div>`
    : `<div class="tensor-parts">${Array.from({ length: parts }, (_, index) => `<i style="--part:${index}">${item.item} ${index + 1}</i>`).join('')}</div>`;
  document.querySelector('#road-visual').innerHTML = `<div class="tensor-before"><b>Before</b><div class="whole-tensor">${item.before}</div></div><div class="split-arrow">→</div><div class="tensor-after"><b>${item.paper}</b>${after}</div></div><p>${item.note}</p>`;
  document.querySelector('#road-formula').innerHTML = item.id === 'placement' ? '<b>Goal: choose a legal, lower-cost mapping</b><span>No universal 1/N memory rule is claimed.</span>' : `<b>Illustrative share of ${item.dimension} per partition ≈ 1 / ${parts}</b><span>The exact system cost also depends on communication and replication.</span>`;
}

function axisValues() {
  return Object.fromEntries([...document.querySelectorAll('[data-axis]')].map(select => [select.dataset.axis, Number(select.value)]));
}
function renderComposer() {
  const axes = axisValues();
  const total = axes.tp * axes.pp * axes.dp * axes.ep;
  document.querySelector('#composer-equation').innerHTML = `<span>Total GPUs</span><b>${axes.tp} × ${axes.pp} × ${axes.dp} × ${axes.ep} = ${total}</b>`;
  document.querySelector('#composer-note').textContent = `TP splits matrices; PP splits layers; DP repeats the model for different batches; EP splits experts.`;
  const maximum = Math.min(total, 64);
  const cells = [];
  outer: for (let d = 0; d < axes.dp; d++) for (let p = 0; p < axes.pp; p++) for (let e = 0; e < axes.ep; e++) for (let t = 0; t < axes.tp; t++) {
    if (cells.length >= maximum) break outer;
    cells.push(`<i style="--d:${d};--p:${p}" aria-label="data ${d + 1}, pipeline ${p + 1}, expert ${e + 1}, tensor ${t + 1}"><span>D${d + 1} P${p + 1}</span><b>T${t + 1} E${e + 1}</b></i>`);
  }
  document.querySelector('#gpu-grid').innerHTML = cells.join('');
  document.querySelector('#gpu-grid').style.setProperty('--grid-columns', String(Math.min(8, Math.max(2, axes.tp * axes.ep))));
  document.querySelector('#gpu-grid-note').textContent = total > 64 ? `Showing 64 representative ranks out of ${total}.` : `Every cell is one GPU rank with a coordinate on four axes.`;
}

const layerPhases = [
  'Input is available on both tensor-parallel workers.',
  'Each GPU computes its own attention heads locally.',
  'All-reduce #1 combines partial attention outputs.',
  'Each GPU computes its own MLP shard locally.',
  'All-reduce #2 combines partial MLP outputs.',
  'Both GPUs now hold the complete layer output.'
];
let layerTimeline;
function layerGeometry(progress) {
  const anchors = [80, 225, 435, 560, 770, 950];
  const scaled = progress * (anchors.length - 1);
  const phase = Math.min(anchors.length - 1, Math.floor(scaled + 1e-8));
  const next = Math.min(anchors.length - 1, phase + 1);
  const local = scaled - phase;
  const x = anchors[phase] + (anchors[next] - anchors[phase]) * local;
  const syncDistance = Math.min(Math.abs(scaled - 2), Math.abs(scaled - 4));
  const syncAmount = Math.max(0, 1 - syncDistance / .65);
  return { phase: Math.min(5, Math.round(scaled)), x, y1: 95 + 65 * syncAmount, y2: 225 - 65 * syncAmount };
}
function renderLayer(progress, state) {
  const geometry = layerGeometry(progress);
  const dot1 = document.querySelector('#layer-dot-1');
  const dot2 = document.querySelector('#layer-dot-2');
  if (!dot1 || !dot2) return;
  dot1.setAttribute('cx', geometry.x.toFixed(1)); dot1.setAttribute('cy', geometry.y1.toFixed(1));
  dot2.setAttribute('cx', geometry.x.toFixed(1)); dot2.setAttribute('cy', geometry.y2.toFixed(1));
  document.querySelectorAll('.phase-node').forEach((node, index) => node.classList.toggle('active', index === geometry.phase));
  document.querySelector('#layer-caption').innerHTML = `<b>Phase ${geometry.phase + 1} of 6</b><span>${layerPhases[geometry.phase]}</span>`;
  document.querySelector('#layer-seek').value = String(Math.round(progress * 100));
  document.querySelector('#layer-play').textContent = state.playing ? 'Pause' : 'Play';
}

function erf(x) {
  const sign = Math.sign(x) || 1;
  const absolute = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absolute);
  return sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-absolute * absolute));
}
const gelu = x => 0.5 * x * (1 + erf(x / Math.SQRT2));
function renderGelu() {
  const x1 = Number(document.querySelector('#x1').value);
  const x2 = Number(document.querySelector('#x2').value);
  const combined = gelu(x1 + x2);
  const separate = gelu(x1) + gelu(x2);
  const difference = separate - combined;
  document.querySelector('#x1-value').textContent = x1.toFixed(1);
  document.querySelector('#x2-value').textContent = x2.toFixed(1);
  document.querySelector('#gelu-equations').innerHTML = `<div><span>Correct: combine first</span><b>GeLU(${x1.toFixed(1)} + ${x2.toFixed(1)}) = ${combined.toFixed(3)}</b></div><div><span>Wrong: activate separately</span><b>GeLU(${x1.toFixed(1)}) + GeLU(${x2.toFixed(1)}) = ${separate.toFixed(3)}</b></div>`;
  const svg = document.querySelector('#gelu-plot');
  const sx = x => 60 + (x + 4) / 8 * 620;
  const sy = y => 270 - (y + 0.25) / 4.8 * 230;
  const points = Array.from({ length: 161 }, (_, index) => -4 + index * .05).map(x => `${sx(x).toFixed(1)},${sy(gelu(x)).toFixed(1)}`).join(' ');
  const marks = [[x1, gelu(x1), 'x₁'], [x2, gelu(x2), 'x₂'], [x1 + x2, combined, 'x₁+x₂']];
  svg.innerHTML = `<line class="plot-axis" x1="60" y1="${sy(0)}" x2="680" y2="${sy(0)}"/><line class="plot-axis" x1="${sx(0)}" y1="35" x2="${sx(0)}" y2="270"/><polyline class="gelu-curve" points="${points}"/>${marks.map(([x, y, label], index) => `<g class="plot-mark mark-${index}"><line x1="${sx(x)}" y1="${sy(0)}" x2="${sx(x)}" y2="${sy(y)}"/><circle cx="${sx(x)}" cy="${sy(y)}" r="8"/><text x="${sx(x) + 10}" y="${sy(y) - 10}">${label}: (${x.toFixed(1)}, ${y.toFixed(2)})</text></g>`).join('')}<text class="axis-label" x="655" y="${sy(0) - 8}">input x</text><text class="axis-label" x="${sx(0) + 8}" y="48">GeLU(x)</text>`;
  document.querySelector('#gelu-conclusion').innerHTML = `<b>Difference = ${Math.abs(difference).toFixed(3)}</b><span>${Math.abs(difference) < .001 ? 'These inputs happen to agree; move a slider to see the general nonlinear case.' : 'The two orders are not equivalent, so a row-first split would need synchronization before GeLU.'}</span>`;
}

let operatorName = 'f';
let operatorPass = 'forward';
function operatorAllReduce() { return (operatorName === 'f' && operatorPass === 'backward') || (operatorName === 'g' && operatorPass === 'forward'); }
function renderOperator() {
  document.querySelectorAll('[data-operator]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.operator === operatorName)));
  document.querySelectorAll('[data-pass]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pass === operatorPass)));
  const a = Number(document.querySelector('#op-a').value);
  const b = Number(document.querySelector('#op-b').value);
  const reduce = operatorAllReduce();
  const sum = a + b;
  document.querySelector('#operator-visual').innerHTML = `<div class="op-gpu"><b>GPU 1</b><span class="op-value">${a}</span></div><div class="op-center ${reduce ? 'reduce' : 'identity'}"><i class="op-packet left">${a}</i><i class="op-packet right">${b}</i><b>${reduce ? `all-reduce: ${a} + ${b}` : 'identity: no communication'}</b></div><div class="op-gpu"><b>GPU 2</b><span class="op-value">${b}</span></div><div class="op-outputs"><span>GPU 1 output <b>${reduce ? sum : a}</b></span><span>GPU 2 output <b>${reduce ? sum : b}</b></span></div>`;
  document.querySelector('#operator-rule').innerHTML = `<b>${operatorName} in the ${operatorPass} pass → ${reduce ? 'all-reduce' : 'identity'}</b><span>${reduce ? 'Both GPUs receive the sum.' : 'Each GPU keeps its local value.'}</span>`;
}

const softmaxNames = ['cat', 'dog', 'bird', 'fish'];
let softmaxStep = 0;
function softmaxValues() { return [...document.querySelectorAll('[data-logit]')].map(input => Number(input.value)); }
function renderSoftmax() {
  const values = softmaxValues();
  const target = Number(document.querySelector('#softmax-target').value);
  const groups = [values.slice(0, 2), values.slice(2, 4)];
  const localMax = groups.map(group => Math.max(...group));
  const globalMax = Math.max(...localMax);
  const localSums = groups.map(group => group.reduce((sum, value) => sum + Math.exp(value - globalMax), 0));
  const globalSum = localSums.reduce((sum, value) => sum + value, 0);
  const loss = globalMax + Math.log(globalSum) - values[target];
  document.querySelector('#logit-controls').innerHTML = values.map((value, index) => `<label class="logit-row ${index === target ? 'target' : ''}"><span>${softmaxNames[index]}</span><input data-logit="${index}" type="range" min="-2" max="3" step="0.1" value="${value}"/><b>${value.toFixed(1)}</b></label>`).join('');
  const stages = [
    `<div class="softmax-gpus"><div><b>GPU 1 logits</b><span>${values[0].toFixed(1)}, ${values[1].toFixed(1)}</span></div><div><b>GPU 2 logits</b><span>${values[2].toFixed(1)}, ${values[3].toFixed(1)}</span></div></div>`,
    `<div class="calc-focus"><span>Local maxima</span><b>m₁ = ${localMax[0].toFixed(1)}, m₂ = ${localMax[1].toFixed(1)}</b></div>`,
    `<div class="calc-focus"><span>All-reduce MAX</span><b>m = max(${localMax[0].toFixed(1)}, ${localMax[1].toFixed(1)}) = ${globalMax.toFixed(1)}</b></div>`,
    `<div class="softmax-gpus"><div><b>GPU 1 exp-sum</b><span>${localSums[0].toFixed(3)}</span></div><div><b>GPU 2 exp-sum</b><span>${localSums[1].toFixed(3)}</span></div></div>`,
    `<div class="calc-focus"><span>All-reduce SUM + target lookup</span><b>S = ${globalSum.toFixed(3)}, z<sub>${softmaxNames[target]}</sub> = ${values[target].toFixed(1)}</b></div>`,
    `<div class="calc-focus final"><span>Exact cross-entropy</span><b>${globalMax.toFixed(1)} + log(${globalSum.toFixed(3)}) − ${values[target].toFixed(1)} = ${loss.toFixed(3)}</b></div>`
  ];
  document.querySelector('#softmax-calc').innerHTML = stages[softmaxStep];
  const captions = ['Split the vocabulary logits.', 'Compute one maximum per GPU.', 'Exchange only the maxima.', 'Compute local exponential sums using the global maximum.', 'Exchange the sums and obtain the target logit.', 'Assemble the same exact loss as a full softmax.'];
  document.querySelector('#softmax-stage').innerHTML = `<b>Calculation ${softmaxStep + 1} / 6</b><span>${captions[softmaxStep]}</span>`;
  document.querySelector('#softmax-back').disabled = softmaxStep === 0;
  document.querySelector('#softmax-next').disabled = softmaxStep === 5;
}

const glossary = [
  ['DP', 'batch examples', 'Each replica processes different data; model parameters are replicated or sharded.'],
  ['TP', 'matrix dimensions', 'One layer is split across GPUs; Megatron 2020 focuses here.'],
  ['PP', 'layer depth', 'Different groups own consecutive model stages.'],
  ['SP / CP', 'sequence positions', 'Token positions or context work are divided to reduce activation pressure.'],
  ['EP', 'experts', 'Different MoE experts are assigned to different workers.'],
  ['FSDP', 'training states', 'Weights, gradients, and optimizer states are sharded across data-parallel workers.']
];
let glossaryIndex = 1;
function renderGlossary() {
  document.querySelector('#glossary-buttons').innerHTML = glossary.map((item, index) => `<button type="button" data-glossary="${index}" aria-pressed="${index === glossaryIndex}">${item[0]}</button>`).join('');
  const item = glossary[glossaryIndex];
  const dimensions = ['batch', 'matrix', 'layers', 'sequence', 'experts', 'states'];
  document.querySelector('#glossary-visual').innerHTML = `<div class="model-cube">${dimensions.map((dimension, index) => `<div class="cube-dimension ${index === glossaryIndex ? 'active' : ''}"><span>${dimension}</span>${Array.from({ length: 4 }, (_, part) => `<i>${part + 1}</i>`).join('')}</div>`).join('')}</div>`;
  document.querySelector('#glossary-detail').innerHTML = `<b>${item[0]} splits ${item[1]}</b><p>${item[2]}</p>`;
}

function wireInteractions() {
  document.querySelectorAll('[data-vocab-method]').forEach(button => button.addEventListener('click', () => { vocabMethod = button.dataset.vocabMethod; renderVocab(); }));
  document.querySelector('#vocab-size').addEventListener('change', renderVocab);
  document.querySelector('#vocab-gpus').addEventListener('change', renderVocab);
  document.querySelector('#vocab-run').addEventListener('click', () => { const visual = document.querySelector('#vocab-visual'); visual.classList.remove('is-running'); requestAnimationFrame(() => visual.classList.add('is-running')); });

  document.querySelectorAll('[data-topology]').forEach(button => button.addEventListener('click', () => { topologyMode = button.dataset.topology; renderTopology(); }));
  document.querySelector('#traffic-size').addEventListener('change', renderTopology);
  document.querySelector('#topology-run').addEventListener('click', () => { const visual = document.querySelector('#topology-visual'); visual.classList.remove('is-running'); requestAnimationFrame(() => visual.classList.add('is-running')); });

  document.querySelector('#scaling-scenario').addEventListener('change', renderScaling);
  document.querySelector('#scaling-point').addEventListener('input', renderScaling);
  document.querySelectorAll('[data-model]').forEach(button => button.addEventListener('click', () => { qualityIndex = Number(button.dataset.model); renderQuality(); }));
  document.querySelectorAll('[data-bert]').forEach(button => button.addEventListener('click', () => { bertMode = button.dataset.bert; renderBert(); }));
  document.querySelector('#bert-run').addEventListener('click', () => {
    if (reducedMotion.matches) return;
    const main = document.querySelector('#bert-signal-main');
    const branch = document.querySelector('#bert-signal-branch');
    main.setAttribute('opacity', '1'); branch.setAttribute('opacity', '1');
    document.querySelector('#bert-main-motion').beginElement();
    document.querySelector('#bert-branch-motion').beginElement();
  });

  stage.addEventListener('click', event => {
    const claim = event.target.closest('[data-claim]');
    if (claim) { selectedClaim = claim.dataset.claim; renderMatcher(); document.querySelector('#match-feedback').textContent = 'Now select the evidence that can support this claim.'; }
    const evidence = event.target.closest('[data-evidence]');
    if (evidence && selectedClaim) {
      const item = claimData.find(entry => entry.id === selectedClaim);
      if (item.evidence === evidence.dataset.evidence) { matchedClaims.add(selectedClaim); document.querySelector('#match-feedback').innerHTML = `<b>Correct.</b> ${item.explanation}`; selectedClaim = null; renderMatcher(); }
      else document.querySelector('#match-feedback').innerHTML = '<b>Try again.</b> Ask whether this evidence measures the mechanism, scaling, or model quality.';
    }
    const scope = event.target.closest('[data-scope]');
    if (scope) { const [label, status, explanation] = scopeItems[Number(scope.dataset.scope)]; document.querySelector('#scope-detail').innerHTML = `<b>${label}</b><span class="scope-status ${status}">${status === 'tested' ? 'Tested' : status === 'partial' ? 'Limited / not isolated' : 'Outside this paper'}</span><p>${explanation}</p>`; }
    const bottleneck = event.target.closest('[data-bottleneck]');
    if (bottleneck) { bottleneckIndex = Number(bottleneck.dataset.bottleneck); renderRoadmap(); }
    const glossaryButton = event.target.closest('[data-glossary]');
    if (glossaryButton) { glossaryIndex = Number(glossaryButton.dataset.glossary); renderGlossary(); }
    const figure = event.target.closest('[data-figure]');
    if (figure) { layerTimeline.pause(); figureFull.src = figure.dataset.figure; figureFull.alt = figure.dataset.caption; figureCaption.textContent = figure.dataset.caption; figureModal.showModal(); }
  });
  document.querySelector('#road-parts').addEventListener('change', renderRoadmap);
  document.querySelectorAll('[data-axis]').forEach(select => select.addEventListener('change', renderComposer));

  document.querySelector('#layer-reset').addEventListener('click', () => layerTimeline.reset());
  document.querySelector('#layer-back').addEventListener('click', () => layerTimeline.step(-1));
  document.querySelector('#layer-forward').addEventListener('click', () => layerTimeline.step(1));
  document.querySelector('#layer-play').addEventListener('click', () => { if (reducedMotion.matches) return; layerTimeline.state.playing ? layerTimeline.pause() : layerTimeline.play(); });
  document.querySelector('#layer-seek').addEventListener('input', event => layerTimeline.seek(Number(event.target.value) / 100));
  document.querySelector('#x1').addEventListener('input', renderGelu);
  document.querySelector('#x2').addEventListener('input', renderGelu);

  document.querySelectorAll('[data-operator]').forEach(button => button.addEventListener('click', () => { operatorName = button.dataset.operator; renderOperator(); }));
  document.querySelectorAll('[data-pass]').forEach(button => button.addEventListener('click', () => { operatorPass = button.dataset.pass; renderOperator(); }));
  document.querySelector('#op-a').addEventListener('input', renderOperator);
  document.querySelector('#op-b').addEventListener('input', renderOperator);
  document.querySelector('#operator-run').addEventListener('click', () => { const visual = document.querySelector('#operator-visual'); visual.classList.remove('is-running'); requestAnimationFrame(() => visual.classList.add('is-running')); });

  document.querySelector('#softmax-target').addEventListener('change', renderSoftmax);
  document.querySelector('#softmax-back').addEventListener('click', () => { softmaxStep = Math.max(0, softmaxStep - 1); renderSoftmax(); });
  document.querySelector('#softmax-next').addEventListener('click', () => { softmaxStep = Math.min(5, softmaxStep + 1); renderSoftmax(); });
  document.querySelector('#softmax-reset').addEventListener('click', () => { softmaxStep = 0; renderSoftmax(); });
  document.querySelector('#logit-controls').addEventListener('input', event => {
    if (!event.target.matches('[data-logit]')) return;
    const values = softmaxValues(); values[Number(event.target.dataset.logit)] = Number(event.target.value);
    const inputs = [...document.querySelectorAll('[data-logit]')];
    inputs.forEach((input, index) => input.value = values[index]);
    renderSoftmax();
  });
}

function initializeLabs() {
  document.querySelector('#logit-controls').innerHTML = [0, 1, 2, -1].map((value, index) => `<input data-logit="${index}" value="${value}"/>`).join('');
  layerTimeline = createTimeline({ duration: 12000, steps: 5, render: renderLayer });
  renderVocab(); renderTopology(); renderScaling(); renderQuality(); renderBert(); renderMatcher(); renderScope(); renderRoadmap(); renderComposer(); renderGelu(); renderOperator(); renderSoftmax(); renderGlossary();
  wireInteractions();
  function syncMotionPreference() {
    const button = document.querySelector('#layer-play');
    button.disabled = reducedMotion.matches;
    button.title = reducedMotion.matches ? 'Use the phase buttons or scrubber when reduced motion is enabled.' : '';
    if (reducedMotion.matches) layerTimeline.pause();
  }
  syncMotionPreference();
  reducedMotion.addEventListener('change', syncMotionPreference);
}

let current = 0;
function resizeStage() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  shell.style.width = `${1280 * scale}px`;
  shell.style.height = `${720 * scale}px`;
  stage.style.transform = `scale(${scale})`;
}
function hashIndex() {
  const value = Number((location.hash.match(/^#slide-(\d+)$/) || [])[1]);
  return Number.isInteger(value) && value >= 1 && value <= slides.length ? value - 1 : 0;
}
function goTo(index, updateHash = true) {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  layerTimeline.pause();
  slides[current].hidden = true;
  current = next;
  slides[current].hidden = false;
  pageStatus.textContent = `${current + 1} / ${slides.length}`;
  previousButton.disabled = current === 0;
  nextButton.disabled = current === slides.length - 1;
  if (updateHash) history.replaceState(null, '', `#slide-${current + 1}`);
}

previousButton.addEventListener('click', () => goTo(current - 1));
nextButton.addEventListener('click', () => goTo(current + 1));
document.querySelector('#fullscreen').addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('#presentation').requestFullscreen();
  resizeStage();
});
document.querySelector('#close-figure').addEventListener('click', () => figureModal.close());
figureModal.addEventListener('click', event => { if (event.target === figureModal) figureModal.close(); });
window.addEventListener('resize', resizeStage);
window.addEventListener('hashchange', () => goTo(hashIndex(), false));
document.addEventListener('visibilitychange', () => { if (document.hidden) layerTimeline.pause(); });
document.addEventListener('keydown', event => {
  if (figureModal.open) return;
  if (event.key === 'ArrowRight' && !event.target.matches('input,select')) { event.preventDefault(); goTo(current + 1); }
  if (event.key === 'ArrowLeft' && !event.target.matches('input,select')) { event.preventDefault(); goTo(current - 1); }
});
reducedMotion.addEventListener('change', event => {
  const play = document.querySelector('#layer-play');
  play.disabled = event.matches;
  if (event.matches) layerTimeline.pause();
});

initializeLabs();
resizeStage();
current = hashIndex();
slides.forEach((slide, index) => slide.hidden = index !== current);
goTo(current, false);

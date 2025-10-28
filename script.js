/* script.js - Funil gamificado para partituras
   Salve como script.js. Não depende de bibliotecas externas.
*/

/* ========== CONFIGURAÇÃO ========== */
const INSTRUMENTS = [
  "Flauta","Trompete","Trombone","Viola","Violino","Violoncelo",
  "Sax Alto","Sax Tenor","Sax Soprano","Teclado","Piano","Clarinete"
];

// mapeamento: gera slug com letras minúsculas, sublinhado e sem acentos
function slugify(s){
  return s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/\s+/g,"_").replace(/[^\w\-]+/g,"");
}

/* Steps do quiz */
const STEPS = [
  {
    id: 'instrument',
    title: 'Qual instrumento você toca?',
    subtitle: 'Escolha o instrumento principal — isso definirá o seu combo.',
    type: 'grid',
    options: INSTRUMENTS.map(i => ({ key: slugify(i), label: i, meta: null }))
  },
  {
    id: 'genre',
    title: 'Qual estilo você prefere tocar?',
    subtitle: 'Isso ajuda a personalizar a descrição do seu combo.',
    type: 'grid',
    options: [
      { key:'sertanejo', label:'Sertanejo' },
      { key:'classico', label:'Clássico' },
      { key:'pop', label:'Pop' },
      { key:'jazz', label:'Jazz' },
      { key:'gospel', label:'Gospel' },
      { key:'outros', label:'Outros' }
    ]
  },
  {
    id: 'level',
    title: 'Nível de domínio',
    subtitle: 'Qual seu nível atual no instrumento?',
    type: 'grid',
    options: [
      { key:'iniciante', label:'Iniciante' },
      { key:'intermediario', label:'Intermediário' },
      { key:'avancado', label:'Avançado' }
    ]
  }
];

/* URL base para redirecionamento dos combos (ajuste se necessário) */
const COMBOS_BASE = '/combos/';

/* ========== UI ========== */
const root = document.getElementById('step-root');
const nextBtn = document.getElementById('next-btn');
const backBtn = document.getElementById('back-btn');
const progressBar = document.getElementById('progress-bar');
const toggleSoundBtn = document.getElementById('toggle-sound');

let current = 0;
let answers = {}; // {stepId: optionKey}
let soundEnabled = true;

/* WebAudio simples — efeitos curtos (click e chime). */
let audioCtx;
function ensureAudio(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playClick(){
  if(!soundEnabled) return;
  ensureAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(700, audioCtx.currentTime);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.07, audioCtx.currentTime + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.16);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.18);
}
function playChime(){
  if(!soundEnabled) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const freqs = [520, 660, 880];
  freqs.forEach((f,i)=>{
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, now + i*0.06);
    g.gain.setValueAtTime(0.0001, now + i*0.06);
    g.gain.linearRampToValueAtTime(0.06, now + i*0.06 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i*0.06 + 0.26);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now + i*0.06); o.stop(now + i*0.06 + 0.3);
  });
}

/* toggle sound */
toggleSoundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  toggleSoundBtn.textContent = soundEnabled ? '🔈' : '🔇';
  toggleSoundBtn.setAttribute('aria-pressed', String(soundEnabled));
});

/* Render step */
function renderStep(index){
  current = index;
  const step = STEPS[index];
  // update progress
  const pct = Math.round((index) / STEPS.length * 100);
  progressBar.style.width = pct + '%';

  // back button visibility
  backBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
  nextBtn.textContent = index === STEPS.length - 1 ? 'Ver meu combo' : (index === 0 ? 'Próximo' : 'Próximo');

  // mount content
  root.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'question';

  const h = document.createElement('h2'); h.textContent = step.title;
  const p = document.createElement('p'); p.textContent = step.subtitle;
  wrapper.appendChild(h); wrapper.appendChild(p);

  // options
  const grid = document.createElement('div'); grid.className = 'options-grid';
  step.options.forEach(opt => {
    const card = document.createElement('button');
    card.className = 'option';
    card.type = 'button';
    card.dataset.key = opt.key;
    card.innerHTML = `
      <div class="emoji">${emojiFor(opt.label)}</div>
      <div class="label">${opt.label}</div>
    `;
    if(answers[step.id] === opt.key) card.classList.add('selected');

    card.addEventListener('click', () => {
      // select one
      document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
      card.classList.add('selected');
      answers[step.id] = opt.key;
      playClick();
    });

    grid.appendChild(card);
  });

  wrapper.appendChild(grid);
  root.appendChild(wrapper);
}

/* emoji helper (deixa visual mais musical) */
function emojiFor(label){
  label = (label||'').toLowerCase();
  if(label.includes('sax')) return '🎷';
  if(label.includes('violino') || label.includes('violoncelo') || label.includes('viola')) return '🎻';
  if(label.includes('flauta')) return '🎼';
  if(label.includes('trompete') || label.includes('trombone')) return '🎺';
  if(label.includes('clarinete')) return '🎵';
  if(label.includes('teclado') || label.includes('piano')) return '🎹';
  if(label.includes('sertanejo')) return '🤠';
  if(label.includes('classico')) return '🎶';
  if(label.includes('jazz')) return '🎷';
  if(label.includes('pop')) return '🎧';
  if(label.includes('gospel')) return '✝️';
  if(label.includes('iniciante')) return '🟢';
  if(label.includes('intermediario')) return '🟡';
  if(label.includes('avancado')) return '🔵';
  return '🎵';
}

/* Next / Back handlers */
nextBtn.addEventListener('click', () => {
  // ensure selection
  const step = STEPS[current];
  if(!answers[step.id]){
    // flash a tiny shake and play click
    playClick();
    flashNotice('Escolha uma opção para continuar');
    return;
  }
  playClick();

  if(current < STEPS.length - 1){
    renderStep(current + 1);
  } else {
    // final -> show result and redirect soon
    showResult();
  }
});

backBtn.addEventListener('click', () => {
  playClick();
  if(current > 0) renderStep(current - 1);
});

/* Flash notice (breve) */
function flashNotice(text){
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.left='50%';
  el.style.top='10%';
  el.style.transform='translateX(-50%)';
  el.style.padding='8px 14px';
  el.style.background='rgba(0,0,0,0.6)';
  el.style.border='1px solid rgba(255,255,255,0.04)';
  el.style.borderRadius='10px';
  el.style.color='white';
  el.style.zIndex=999;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(()=> el.style.opacity='0', 1600);
  setTimeout(()=> el.remove(), 2100);
}

/* Result screen then redirect */
function showResult(){
  const selectedInstrumentKey = answers['instrument'];
  const selectedInstrumentLabel = (STEPS[0].options.find(o=>o.key===selectedInstrumentKey)||{}).label || 'seu instrumento';
  const genreLabel = (STEPS[1].options.find(o=>o.key===answers['genre'])||{}).label || '';
  const levelLabel = (STEPS[2].options.find(o=>o.key===answers['level'])||{}).label || '';

  // build result markup
  root.innerHTML = '';
  const r = document.createElement('div'); r.className='result';
  const h = document.createElement('h3'); h.textContent = `Você é o músico: ${selectedInstrumentLabel}`;
  const p = document.createElement('p'); 
  p.innerHTML = `Combo montado para <strong>${selectedInstrumentLabel}</strong> • Estilo: ${genreLabel} • Nível: ${levelLabel}`;

  const cta = document.createElement('button');
  cta.className='btn primary';
  cta.textContent = 'Ver meu combo agora';
  cta.addEventListener('click', ()=>{
    playChime();
    redirectToCombo(selectedInstrumentKey);
  });

  r.appendChild(h); r.appendChild(p);
  r.appendChild(document.createElement('br'));
  r.appendChild(cta);

  root.appendChild(r);

  // change footer
  backBtn.style.visibility = 'hidden';
  nextBtn.style.display = 'none';
  progressBar.style.width = '100%';
  playChime();

  // auto-redirect após 2s (força a experiência); usuário pode clicar no botão se preferir.
  setTimeout(()=> redirectToCombo(selectedInstrumentKey), 2000);
}

/* Redirect logic: monta url com slug do instrumento */
function redirectToCombo(instrumentKey){
  // os slugs esperados: combo_<slug>.html
  const url = COMBOS_BASE + 'combo_' + instrumentKey + '.html';
  // redireciona (se for local file use ./combos/...)
  window.location.href = url;
}

/* inicialização */
(function init(){
  // render first step
  renderStep(0);

  // keyboard enter to advance when an option is selected
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      nextBtn.click();
    } else if(e.key === 'Backspace'){
      backBtn.click();
    }
  });

  // small accessibility: focus first option when step loads
  const obs = new MutationObserver(()=> {
    const opt = document.querySelector('.option');
    if(opt) opt.focus();
  });
  obs.observe(root, {childList:true, subtree:true});
})();

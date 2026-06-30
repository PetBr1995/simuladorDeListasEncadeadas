"use strict";
/* ===========================================================================
   Simulador de Listas Encadeadas — execução passo a passo
   A lista é guardada como um array de valores (a ordem = ligações "proximo").
   Cada operação gera uma sequência de PASSOS; cada passo aponta a linha do
   código, uma narração e o estado da lista + a posição do ponteiro "atual".
   Os identificadores do código estão em PORTUGUÊS para facilitar o estudo.
=========================================================================== */
const $ = id => document.getElementById(id);
const ERR_VAZIA="A lista está vazia.", ERR_POS="Posição inválida.", ERR_NF="Valor não encontrado.";

const lists = { singly:[], doubly:[], circular:[] };
let currentType = "singly";
let selectedNode = -1;

/* estado do "player" de passos */
let steps=[], codeLines=[], stepIdx=0, playing=false, timer=null;

const labelType = t => t==="singly"?"Simplesmente encadeada":t==="doubly"?"Duplamente encadeada":"Circular";

/* ===========================================================================
   NAVEGAÇÃO ENTRE TELAS
=========================================================================== */
function openSim(type){
  currentType = type;
  $("home").classList.add("hidden");
  $("sim").classList.remove("hidden");
  $("simTitle").textContent = (type==="singly"?"➡️ ":type==="doubly"?"↔️ ":"🔁 ") + labelType(type);
  $("analogy").innerHTML = ANALOGY[type];
  $("legend").innerHTML = LEGEND[type];
  selectedNode = -1;
  resetRunner("Escolha uma operação para ver o código rodar passo a passo.");
  showStruct();
  drawIdle();
  window.scrollTo({top:0,behavior:"smooth"});
}
function goHome(){
  stopPlay();
  $("sim").classList.add("hidden");
  $("home").classList.remove("hidden");
}

/* ===========================================================================
   OPERAÇÃO -> gera passos e inicia o player
=========================================================================== */
function doOp(op){
  const arr = lists[currentType].slice();
  const v = parseInt($("value").value||"0",10);
  const pos = parseInt($("pos").value||"0",10);
  let gen;

  switch(op){
    case "clear": lists[currentType]=[]; selectedNode=-1; resetRunner("🧹 Lista esvaziada."); showStruct(); drawIdle(); return;
    case "insertHead": gen = genInsertHead(currentType, arr, v); break;
    case "insertTail": gen = genInsertTail(currentType, arr, v); break;
    case "insertAt":   gen = genInsertAt(currentType, arr, v, pos); break;
    case "removeHead": gen = genRemoveEnd(currentType, arr, true); break;
    case "removeTail": gen = genRemoveEnd(currentType, arr, false); break;
    case "removeValue":gen = genRemoveValue(currentType, arr, v); break;
    case "search":     gen = genSearch(currentType, arr, v); break;
    case "traverse":   gen = genTraverse(currentType, arr); break;
  }
  if(!gen) return;

  lists[currentType] = gen.final;
  startPlayer(gen.code, gen.steps);
}

/* ===========================================================================
   PLAYER DE PASSOS
=========================================================================== */
function startPlayer(code, st){
  codeLines = code; steps = st; stepIdx = 0;
  renderCode();
  showStep(0);
  autoPlay();
}
function showStep(i){
  stepIdx = Math.max(0, Math.min(i, steps.length-1));
  const s = steps[stepIdx];
  $("narration").innerHTML = s.msg;
  $("progress").textContent = `passo ${stepIdx+1} de ${steps.length}`;
  highlightLine(s.line);
  drawState(s.values, {cur:s.cur, mark:s.mark});
  $("btnPrev").disabled = stepIdx===0;
  $("btnNext").disabled = stepIdx===steps.length-1;
  if(stepIdx===steps.length-1) stopPlay();
}
function next(){ if(stepIdx<steps.length-1) showStep(stepIdx+1); else stopPlay(); }
function prev(){ if(stepIdx>0){ stopPlay(); showStep(stepIdx-1); } }
function restart(){ stopPlay(); showStep(0); }
function autoPlay(){
  stopPlay(); playing=true; $("btnPlay").textContent="⏸ Pausar";
  const delay = parseInt($("speed").value,10);
  timer = setInterval(()=>{ if(stepIdx<steps.length-1) showStep(stepIdx+1); else stopPlay(); }, delay);
}
function stopPlay(){ playing=false; if(timer){clearInterval(timer);timer=null;} $("btnPlay").textContent="▶ Play"; }
function togglePlay(){ if(playing) stopPlay(); else if(stepIdx<steps.length-1) autoPlay(); else { showStep(0); autoPlay(); } }
function resetRunner(msg){
  stopPlay(); steps=[]; stepIdx=0;
  $("narration").textContent = msg;
  $("progress").textContent = "—";
  $("btnPrev").disabled = $("btnNext").disabled = true;
}

/* ===========================================================================
   CÓDIGO (render + highlight)
=========================================================================== */
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function renderCode(){
  $("code").innerHTML = codeLines.map((l,i)=>`<div class="cline" data-l="${i}">${esc(l)||" "}</div>`).join("");
}
function highlightLine(i){
  document.querySelectorAll(".cline").forEach(el=>{
    el.classList.toggle("active", parseInt(el.dataset.l,10)===i);
  });
}
function showStruct(){ codeLines = STRUCT[currentType]; renderCode(); }

/* ===========================================================================
   DESENHO (SVG)
=========================================================================== */
const NW=78, NH=54, GAP=60, PADX=54;
function drawIdle(){ drawState(lists[currentType], {cur:-1, mark:-1}); }

function drawState(values, opts){
  const cur = opts.cur ?? -1, mark = opts.mark ?? -1;
  const doubly = currentType==="doubly", circular = currentType==="circular";
  const stage = $("stage");
  $("meta").textContent = `Tamanho: ${values.length}` + (circular && values.length? " · cauda → cabeça":"");

  if(values.length===0){
    stage.innerHTML = `<div class="empty">Lista vazia 🚉 — insira valores para começar.</div>`;
    return;
  }
  const n = values.length;
  const width  = PADX*2 + n*NW + (n-1)*GAP;
  const yTop   = circular ? 118 : 86;
  const height = yTop + NH + (circular ? 64 : 88);

  let s = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`+defs();

  for(let i=0;i<n;i++){
    const x = PADX + i*(NW+GAP), yc = yTop+NH/2;
    if(i<n-1){ const x1=x+NW, x2=x+NW+GAP;
      s+=arrow(x1, yc-(doubly?8:0), x2, yc-(doubly?8:0), "#38bdf8");
      s+=txt((x1+x2)/2, yc-(doubly?20:12), "proximo", "#7dd3fc", 11);
    } else if(!circular){ const x1=x+NW, x2=x+NW+GAP;
      s+=arrow(x1, yc-(doubly?8:0), x2-14, yc-(doubly?8:0), "#64748b");
      s+=txt(x2+6, yc+4, "nil", "#64748b", 13);
    }
    if(doubly && i<n-1){ const x1=x+NW, x2=x+NW+GAP;
      s+=arrow(x2, yc+12, x1, yc+12, "#818cf8"); s+=txt((x1+x2)/2, yc+30, "anterior", "#a5b4fc", 11); }
    if(doubly && i===0){ s+=arrow(x, yc+12, x-30, yc+12, "#64748b"); s+=txt(x-44, yc+16, "∅", "#64748b", 14); }
  }
  const wagon = !circular;
  const headY = yTop-(wagon?52:24);   // sobe para passar acima da locomotiva
  const tailY = yTop-(wagon?30:24);
  for(let i=0;i<n;i++){
    const x = PADX + i*(NW+GAP);
    s+=node(x, yTop, values[i], i, i===mark, i===selectedNode);
    if(n===1){
      s+=badge(x+NW/2, headY, "cabeca · cauda", "#7dd3fc");
    } else {
      if(i===0)   s+=badge(x+NW/2, headY, "cabeca", "#34d399");
      if(i===n-1) s+=badge(x+NW/2, tailY, "cauda", "#fbbf24");
    }
    if(i===cur) s+=pointer(x+NW/2, yTop+NH+(wagon?40:20), "atual");
  }
  if(circular){
    const xT=PADX+(n-1)*(NW+GAP)+NW/2, xH=PADX+NW/2, tY=yTop-44;
    s+=`<path d="M ${xT} ${yTop} C ${xT} ${tY-28}, ${xH} ${tY-28}, ${xH} ${yTop}" fill="none" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#ah-blue)" opacity="0.9"/>`;
    s+=txt((xT+xH)/2, tY-32, "cauda → cabeça", "#7dd3fc", 12);
  }
  s+=`</svg>`;
  stage.innerHTML = s;

  stage.querySelectorAll(".nodeG").forEach(g=>g.addEventListener("click",()=>{
    selectedNode = parseInt(g.dataset.idx,10);
    drawState(values, opts);
  }));
}
function defs(){ return `<defs>
  <marker id="ah-blue" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#38bdf8"/></marker>
  <marker id="ah-indigo" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#818cf8"/></marker>
  <marker id="ah-gray" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#64748b"/></marker>
  <linearGradient id="gNode" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#33406b"/><stop offset="1" stop-color="#27325a"/></linearGradient>
</defs>`; }
function node(x,y,val,idx,mark,selected){
  const wagon = currentType!=="circular";
  let fill="url(#gNode)", stroke= selected?"#38bdf8":"#5b6aa0", sw= selected?3:1.6, vc="#eef2ff";
  if(mark){ fill="#78350f"; stroke="#fbbf24"; sw=3; vc="#fbbf24"; }
  let g = `<g class="nodeG" data-idx="${idx}"><animate attributeName="opacity" from="0.25" to="1" dur="0.25s"/>`;

  if(wagon){
    const rim = mark?"#fbbf24":"#8b97c9", wheelY = y+NH+9, r=8;
    // locomotiva na cabeça: cabine alta + chaminé com "fumaça"
    if(idx===0){
      g += `<rect x="${x+NW-26}" y="${y-30}" width="13" height="20" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      g += `<circle cx="${x+NW-19}" cy="${y-34}" r="4" fill="#9fb0d0" opacity="0.5"/>`;
      g += `<circle cx="${x+NW-12}" cy="${y-40}" r="3" fill="#9fb0d0" opacity="0.35"/>`;
    }
    // teto do vagão
    g += `<rect x="${x+7}" y="${y-10}" width="${NW-14}" height="13" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    // corpo
    g += `<rect class="box" x="${x}" y="${y}" width="${NW}" height="${NH}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    // janelinha decorativa
    g += `<rect x="${x+10}" y="${y+8}" width="${NW-20}" height="11" rx="3" fill="#0b1020" opacity="0.35"/>`;
    // valor
    g += `<text x="${x+NW/2}" y="${y+NH/2+12}" text-anchor="middle" font-size="22" font-weight="800" fill="${vc}">${val}</text>`;
    // rodas
    g += `<circle cx="${x+19}" cy="${wheelY}" r="${r}" fill="#0b1020" stroke="${rim}" stroke-width="2.5"/>`;
    g += `<circle cx="${x+19}" cy="${wheelY}" r="2" fill="${rim}"/>`;
    g += `<circle cx="${x+NW-19}" cy="${wheelY}" r="${r}" fill="#0b1020" stroke="${rim}" stroke-width="2.5"/>`;
    g += `<circle cx="${x+NW-19}" cy="${wheelY}" r="2" fill="${rim}"/>`;
    // índice
    g += `<text x="${x+NW/2}" y="${y+NH+34}" text-anchor="middle" font-size="11" fill="#9fb0d0">índice ${idx}</text>`;
  } else {
    g += `<rect class="box" x="${x}" y="${y}" width="${NW}" height="${NH}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    g += `<text x="${x+NW/2}" y="${y+NH/2+7}" text-anchor="middle" font-size="21" font-weight="800" fill="${vc}">${val}</text>`;
    g += `<text x="${x+NW/2}" y="${y+NH+16}" text-anchor="middle" font-size="11" fill="#9fb0d0">índice ${idx}</text>`;
  }
  return g + `</g>`;
}
function pointer(xc,topY,label){
  return `<g><animate attributeName="opacity" from="0.2" to="1" dur="0.2s"/>
    <path d="M ${xc} ${topY} l -7 11 l 14 0 z" fill="#f43f5e"/>
    <rect x="${xc-26}" y="${topY+11}" width="52" height="20" rx="7" fill="#f43f5e"/>
    <text x="${xc}" y="${topY+25}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">${label}</text></g>`;
}
function arrow(x1,y1,x2,y2,c){ const m=c==="#38bdf8"?"ah-blue":c==="#818cf8"?"ah-indigo":"ah-gray";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2.5" marker-end="url(#${m})"/>`; }
function txt(x,y,t,c,s){ return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s}" fill="${c}">${t}</text>`; }
function badge(x,y,t,c){ return `<text x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="800" fill="${c}">${t}</text>`; }

/* ===========================================================================
   GERADORES DE PASSOS   (step = { line, msg, values, cur, mark })
=========================================================================== */
function mk(line,msg,values,cur,mark){ return {line,msg,values,cur:cur??-1,mark:mark??-1}; }

// ---- Buscar -------------------------------------------------------------
function genSearch(type, arr, v){
  const circular = type==="circular";
  const code = circular ? [
    "func (l *ListaCircular) Buscar(v int) int {",
    "    atual := l.cauda.proximo       // cabeça",
    "    for i := 0; i < l.tamanho; i++ {",
    "        if atual.valor == v {",
    "            return i",
    "        }",
    "        atual = atual.proximo",
    "    }",
    "    return -1",
    "}"
  ] : [
    "func Buscar(v int) int {",
    "    atual := cabeca",
    "    i := 0",
    "    for atual != nil {",
    "        if atual.valor == v {",
    "            return i",
    "        }",
    "        atual = atual.proximo",
    "        i++",
    "    }",
    "    return -1",
    "}"
  ];
  const last = code.length-2;
  const forL = circular?2:3, ifL = circular?3:4, retOk = circular?4:5, advL = circular?6:7;
  const st=[];
  if(arr.length===0){ st.push(mk(1,"A lista está vazia — não há por onde começar.",arr,-1)); st.push(mk(last,"Retorna -1 (não encontrado).",arr,-1)); return {code,steps:st,final:arr}; }
  st.push(mk(1,"<b>atual</b> começa na cabeça (índice 0).",arr,0));
  let found=-1;
  for(let i=0;i<arr.length;i++){
    st.push(mk(forL, circular?`Volta ${i+1} de ${arr.length}.`:"Ainda há vagão? <b>Sim</b>.", arr, i));
    if(arr[i]===v){ st.push(mk(ifL,`atual.valor (${arr[i]}) == ${v}? <b>Sim!</b> 🎯`,arr,i,i)); st.push(mk(retOk,`Achou na posição <b>${i}</b>. Retorna ${i}.`,arr,i,i)); found=i; break; }
    st.push(mk(ifL,`atual.valor (${arr[i]}) == ${v}? Não.`,arr,i));
    if(i<arr.length-1) st.push(mk(advL,"atual = atual.proximo → anda para o próximo vagão.",arr,i+1));
    else st.push(mk(advL, circular?"Daria a volta à cabeça…":"atual = atual.proximo → chega ao fim (nil).",arr,-1));
  }
  if(found<0) st.push(mk(last,`Percorreu tudo e não achou <b>${v}</b>. Retorna -1.`,arr,-1));
  return {code,steps:st,final:arr};
}

// ---- Percorrer ----------------------------------------------------------
function genTraverse(type, arr){
  const circular = type==="circular";
  const code = circular ? [
    "func (l *ListaCircular) Percorrer() {",
    "    atual := l.cauda.proximo",
    "    for i := 0; i < l.tamanho; i++ {",
    "        visita(atual.valor)",
    "        atual = atual.proximo",
    "    }",
    "}"
  ] : [
    "func Percorrer() {",
    "    atual := cabeca",
    "    for atual != nil {",
    "        visita(atual.valor)",
    "        atual = atual.proximo",
    "    }",
    "}"
  ];
  const st=[];
  if(arr.length===0){ st.push(mk(1,"Lista vazia — nada para percorrer.",arr,-1)); return {code,steps:st,final:arr}; }
  st.push(mk(1,"<b>atual</b> começa na cabeça.",arr,0));
  for(let i=0;i<arr.length;i++){
    st.push(mk(2, circular?`Volta ${i+1} de ${arr.length}.`:"Há vagão? <b>Sim</b>.", arr, i));
    st.push(mk(3,`Visita o vagão <b>${arr[i]}</b> (índice ${i}).`,arr,i,i));
    if(i<arr.length-1) st.push(mk(4,"atual = atual.proximo → próximo.",arr,i+1));
    else st.push(mk(4, circular?"O próximo é a cabeça de novo — fim das voltas. 🔁":"atual = atual.proximo → nil. Fim. 🏁",arr,-1));
  }
  return {code,steps:st,final:arr};
}

// ---- Inserir início -----------------------------------------------------
function genInsertHead(type, arr, v){
  const final=[v,...arr], st=[];
  let code;
  if(type==="doubly"){
    code=["func (l *ListaDupla) InserirInicio(v int) {","    novo := &No{valor: v, proximo: l.cabeca}","    if l.cabeca != nil { l.cabeca.anterior = novo } else { l.cauda = novo }","    l.cabeca = novo","}"];
    st.push(mk(1,`Cria o vagão <b>${v}</b>; seu <b>proximo</b> aponta para a antiga cabeça.`,arr,-1));
    st.push(mk(2,"A antiga cabeça passa a ter <b>anterior</b> = novo vagão.",arr,-1));
    st.push(mk(3,`<b>cabeca</b> agora é o vagão ${v}. (O(1))`,final,0,0));
  } else if(type==="circular"){
    code=["func (l *ListaCircular) InserirInicio(v int) {","    novo := &No{valor: v}","    if l.cauda == nil { novo.proximo = novo; l.cauda = novo; return }","    novo.proximo = l.cauda.proximo   // novo -> antiga cabeça","    l.cauda.proximo = novo           // cauda -> novo (vira cabeça)","}"];
    if(arr.length===0){ st.push(mk(2,`Lista vazia: ${v} aponta para si mesmo e vira cauda/cabeça.`,final,0,0)); }
    else { st.push(mk(1,`Cria o vagão <b>${v}</b>.`,arr,-1)); st.push(mk(3,"proximo do novo aponta para a antiga cabeça.",arr,-1)); st.push(mk(4,`A cauda aponta para ${v} — ele é a nova cabeça.`,final,0,0)); }
  } else {
    code=["func InserirInicio(v int) {","    novo := &No{valor: v}","    novo.proximo = cabeca","    cabeca = novo","}"];
    st.push(mk(1,`Cria o vagão <b>${v}</b>.`,arr,-1));
    st.push(mk(2,"<b>proximo</b> do novo vagão aponta para a antiga cabeça.",arr,-1));
    st.push(mk(3,`<b>cabeca</b> agora é o vagão ${v}. (O(1))`,final,0,0));
  }
  return {code,steps:st,final};
}

// ---- Inserir fim --------------------------------------------------------
function genInsertTail(type, arr, v){
  const final=[...arr,v], st=[], lastIdx=arr.length-1;
  let code;
  if(type==="doubly"){
    code=["func (l *ListaDupla) InserirFim(v int) {","    novo := &No{valor: v, anterior: l.cauda}","    if l.cauda != nil { l.cauda.proximo = novo } else { l.cabeca = novo }","    l.cauda = novo","}"];
    if(arr.length===0){ st.push(mk(2,`Lista vazia: ${v} vira cabeca e cauda.`,final,0,0)); }
    else { st.push(mk(1,`Cria o vagão <b>${v}</b>; <b>anterior</b> aponta para a antiga cauda.`,arr,lastIdx)); st.push(mk(2,"A antiga cauda passa a ter <b>proximo</b> = novo vagão.",arr,lastIdx)); st.push(mk(3,`<b>cauda</b> agora é ${v}. (O(1) — graças ao ponteiro cauda!)`,final,final.length-1,final.length-1)); }
  } else if(type==="circular"){
    code=["func (l *ListaCircular) InserirFim(v int) {","    novo := &No{valor: v}","    if l.cauda == nil { novo.proximo = novo; l.cauda = novo; return }","    novo.proximo = l.cauda.proximo   // -> cabeça","    l.cauda.proximo = novo           // antiga cauda -> novo","    l.cauda = novo                   // novo vira a cauda","}"];
    if(arr.length===0){ st.push(mk(2,`Lista vazia: ${v} aponta para si mesmo.`,final,0,0)); }
    else { st.push(mk(1,`Cria o vagão <b>${v}</b>.`,arr,lastIdx)); st.push(mk(3,"proximo do novo aponta para a cabeça (mantém o anel).",arr,lastIdx)); st.push(mk(4,"A antiga cauda aponta para o novo.",arr,lastIdx)); st.push(mk(5,`${v} vira a nova cauda. (O(1))`,final,final.length-1,final.length-1)); }
  } else {
    code=["func InserirFim(v int) {","    novo := &No{valor: v}","    if cabeca == nil { cabeca = novo; return }","    atual := cabeca","    for atual.proximo != nil {","        atual = atual.proximo","    }","    atual.proximo = novo","}"];
    if(arr.length===0){ st.push(mk(2,`Lista vazia: ${v} vira a cabeça.`,final,0,0)); }
    else {
      st.push(mk(1,`Cria o vagão <b>${v}</b>.`,arr,-1));
      st.push(mk(3,"<b>atual</b> começa na cabeça.",arr,0));
      for(let i=0;i<arr.length-1;i++){ st.push(mk(4,"atual.proximo existe? <b>Sim</b> — ainda não é o último.",arr,i)); st.push(mk(5,"atual = atual.proximo",arr,i+1)); }
      st.push(mk(4,"atual.proximo existe? <b>Não</b> — chegamos ao último vagão.",arr,arr.length-1));
      st.push(mk(7,`Liga o último ao novo vagão <b>${v}</b>. (O(n) — precisou andar até o fim)`,final,final.length-1,final.length-1));
    }
  }
  return {code,steps:st,final};
}

// ---- Inserir na posição -------------------------------------------------
function genInsertAt(type, arr, v, pos){
  if(pos<0||pos>arr.length){ return {code:STRUCT[type],steps:[mk(0,`❌ ${ERR_POS} Use de 0 a ${arr.length}.`,arr,-1)],final:arr}; }
  if(pos===0) return genInsertHead(type,arr,v);
  if(pos===arr.length) return genInsertTail(type,arr,v);
  const final=arr.slice(0,pos).concat(v, arr.slice(pos)), st=[];
  const code=["func InserirEm(pos, v int) {","    atual := cabeca","    for i := 0; i < pos-1; i++ {","        atual = atual.proximo","    }","    novo := &No{valor: v}","    novo.proximo = atual.proximo   // novo -> sucessor","    atual.proximo = novo           // anterior -> novo","}"];
  st.push(mk(1,"<b>atual</b> começa na cabeça.",arr,0));
  for(let i=0;i<pos-1;i++){ st.push(mk(2,`Avança até a posição ${pos-1}. (i = ${i})`,arr,i)); st.push(mk(3,"atual = atual.proximo",arr,i+1)); }
  st.push(mk(5,`Cria o vagão <b>${v}</b>.`,arr,pos-1));
  st.push(mk(6,"proximo do novo aponta para o sucessor de atual.",arr,pos-1));
  st.push(mk(7,`atual.proximo aponta para o novo. Inserido na posição ${pos}!`,final,pos,pos));
  return {code,steps:st,final};
}

// ---- Remover início/fim -------------------------------------------------
function genRemoveEnd(type, arr, head){
  if(arr.length===0) return {code:STRUCT[type],steps:[mk(0,`❌ ${ERR_VAZIA}`,arr,-1)],final:arr};
  if(head){
    const final=arr.slice(1);
    const code=["func RemoverInicio() {","    if cabeca == nil { return }","    cabeca = cabeca.proximo   // descarta o 1º vagão","}"];
    return {code,steps:[
      mk(1,"cabeca == nil? Não, há vagões.",arr,0),
      mk(2,`A cabeça (<b>${arr[0]}</b>) sai; <b>cabeca</b> passa a ser o 2º vagão.`,arr,0,0),
      mk(2,"Removido! ✂️",final,-1)
    ],final};
  }
  const final=arr.slice(0,-1);
  if(type==="doubly"){
    const code=["func (l *ListaDupla) RemoverFim() {","    if l.cauda == nil { return }","    l.cauda = l.cauda.anterior","    if l.cauda != nil { l.cauda.proximo = nil } else { l.cabeca = nil }","}"];
    return {code,steps:[
      mk(2,`Usa o ponteiro <b>cauda</b> e seu <b>anterior</b> — não precisa andar! (O(1))`,arr,arr.length-1,arr.length-1),
      mk(3,"cauda volta um vagão (para o anterior).",arr,arr.length-2<0?-1:arr.length-2),
      mk(3,"Removido o último! ✂️",final,-1)
    ],final};
  }
  const code=["func RemoverFim() {","    if cabeca.proximo == nil { cabeca = nil; return }","    atual := cabeca","    for atual.proximo.proximo != nil {","        atual = atual.proximo","    }","    atual.proximo = nil   // descarta o último","}"];
  const st=[];
  if(arr.length===1){ st.push(mk(1,`Só há um vagão — a lista fica vazia.`,arr,0,0)); st.push(mk(1,"Removido! ✂️",final,-1)); return {code,steps:st,final}; }
  st.push(mk(2,"<b>atual</b> começa na cabeça.",arr,0));
  for(let i=0;i<arr.length-2;i++){ st.push(mk(3,"atual.proximo.proximo existe? Sim — anda.",arr,i)); st.push(mk(4,"atual = atual.proximo",arr,i+1)); }
  st.push(mk(3,"atual.proximo.proximo == nil? Sim — atual é o penúltimo.",arr,arr.length-2,arr.length-1));
  st.push(mk(6,`Solta o último vagão (<b>${arr[arr.length-1]}</b>). Removido! ✂️ (O(n))`,final,-1));
  return {code,steps:st,final};
}

// ---- Remover por valor --------------------------------------------------
function genRemoveValue(type, arr, v){
  const idx = arr.indexOf(v);
  const st=[];
  if(type==="doubly"){
    const code=["func (l *ListaDupla) RemoverValor(v int) {","    atual := l.cabeca","    for atual != nil && atual.valor != v {","        atual = atual.proximo","    }","    if atual == nil { return }   // não achou","    // religa os vizinhos nos dois sentidos:","    atual.anterior.proximo = atual.proximo","    atual.proximo.anterior = atual.anterior","}"];
    if(arr.length===0){ return {code,steps:[mk(1,`❌ ${ERR_VAZIA}`,arr,-1)],final:arr}; }
    st.push(mk(1,"<b>atual</b> começa na cabeça.",arr,0));
    for(let i=0;i<arr.length;i++){
      if(arr[i]===v){ st.push(mk(2,`atual.valor (${arr[i]}) == ${v}? <b>Sim</b> — para o laço.`,arr,i,i)); break; }
      st.push(mk(2,`atual.valor (${arr[i]}) == ${v}? Não.`,arr,i));
      st.push(mk(3,"atual = atual.proximo",arr, i+1<arr.length?i+1:-1));
    }
    if(idx<0) return {code,steps:st.concat(mk(5,`atual == nil — <b>${v}</b> não está na lista.`,arr,-1)),final:arr};
    const final=arr.filter((_,k)=>k!==idx);
    st.push(mk(7,"O anterior passa a apontar direto para o sucessor.",arr,idx,idx));
    st.push(mk(8,`O sucessor aponta de volta para o anterior. Removido! ✂️`,final,-1));
    return {code,steps:st,final};
  }
  if(type==="circular"){
    const code=["func (l *ListaCircular) RemoverValor(v int) {","    atual := l.cauda.proximo     // cabeça","    for k := 0; k < l.tamanho; k++ {","        if atual.valor == v {","            // religa o anterior ao próximo de atual","            l.tamanho--; return","        }","        atual = atual.proximo","    }","}"];
    if(arr.length===0){ return {code,steps:[mk(1,`❌ ${ERR_VAZIA}`,arr,-1)],final:arr}; }
    st.push(mk(1,"<b>atual</b> começa na cabeça.",arr,0));
    for(let i=0;i<arr.length;i++){
      st.push(mk(2,`Volta ${i+1} de ${arr.length}.`,arr,i));
      if(arr[i]===v){ st.push(mk(3,`atual.valor (${arr[i]}) == ${v}? <b>Sim</b>.`,arr,i,i));
        const final=arr.filter((_,k)=>k!==idx);
        st.push(mk(5,`Religa os vizinhos pulando ${v}. O anel continua fechado. ✂️`,final,-1));
        return {code,steps:st,final};
      }
      st.push(mk(3,`atual.valor (${arr[i]}) == ${v}? Não.`,arr,i));
      st.push(mk(7,"atual = atual.proximo",arr,(i+1)%arr.length));
    }
    return {code,steps:st.concat(mk(2,`Deu a volta inteira sem achar <b>${v}</b>.`,arr,-1)),final:arr};
  }
  // singly
  const code=["func RemoverValor(v int) {","    if cabeca == nil { return }","    if cabeca.valor == v { cabeca = cabeca.proximo; return }","    atual := cabeca","    for atual.proximo != nil && atual.proximo.valor != v {","        atual = atual.proximo","    }","    if atual.proximo == nil { return }   // não achou","    atual.proximo = atual.proximo.proximo  // pula o vagão","}"];
  if(arr.length===0){ return {code,steps:[mk(1,`❌ cabeca == nil — ${ERR_VAZIA}`,arr,-1)],final:arr}; }
  if(arr[0]===v){ const final=arr.slice(1);
    st.push(mk(2,`cabeca.valor == ${v}? <b>Sim</b> — a cabeça sai.`,arr,0,0));
    st.push(mk(2,"cabeca = cabeca.proximo. Removido! ✂️",final,-1)); return {code,steps:st,final}; }
  st.push(mk(2,`cabeca.valor (${arr[0]}) == ${v}? Não.`,arr,0));
  st.push(mk(3,"<b>atual</b> começa na cabeça.",arr,0));
  for(let i=0;i<arr.length-1;i++){
    if(arr[i+1]===v){ st.push(mk(4,`atual.proximo.valor (${arr[i+1]}) == ${v}? <b>Sim</b> — atual é o anterior.`,arr,i,i+1));
      const final=arr.filter((_,k)=>k!==(i+1));
      st.push(mk(8,"atual.proximo = atual.proximo.proximo → pula o vagão. Removido! ✂️",final,-1));
      return {code,steps:st,final};
    }
    st.push(mk(4,`atual.proximo.valor (${arr[i+1]}) == ${v}? Não.`,arr,i));
    st.push(mk(5,"atual = atual.proximo",arr,i+1));
  }
  st.push(mk(7,`atual.proximo == nil — <b>${v}</b> não está na lista.`,arr,-1));
  return {code,steps:st,final:arr};
}

/* ===========================================================================
   TEXTOS (analogias, legendas, struct padrão)
=========================================================================== */
const ANALOGY={
  singly:`<span class="tag">Analogia</span> Um <b>trenzinho de mão única</b>: cada vagão só conhece quem vem logo atrás (<code>proximo</code>). Para chegar ao último, caminhe vagão por vagão. O fim aponta para <code>nil</code>.`,
  doubly:`<span class="tag">Analogia</span> Cada vagão tem <b>engate dos dois lados</b>: além do <code>proximo</code>, lembra o <code>anterior</code>. Dá para ir e voltar — por isso remover é fácil.`,
  circular:`<span class="tag">Analogia</span> Um <b>carrossel</b> 🎠: o último vagão se engata de volta no primeiro. Não existe <code>nil</code> — seguindo os <code>proximo</code>, dá voltas para sempre.`
};
const LEGEND={
  singly:`<b>Legenda:</b> caixa = vagão (nó) · seta azul <code>proximo →</code> · <code>nil</code> = fim · <b>cabeca</b>/<b>cauda</b> = primeiro/último · ponteiro vermelho <b>atual</b> mostra onde o código está. Clique num vagão para selecioná-lo.`,
  doubly:`<b>Legenda:</b> seta azul <code>proximo →</code> (em cima) e seta roxa <code>← anterior</code> (embaixo) · <code>∅</code> = sem vizinho · ponteiro vermelho <b>atual</b> mostra onde o código está.`,
  circular:`<b>Legenda:</b> seta curva azul = <code>cauda → cabeça</code> (o anel) · sem <code>nil</code> · ponteiro vermelho <b>atual</b> mostra onde o código está.`
};
const STRUCT={
  singly:["// Estrutura — lista simplesmente encadeada","type No struct {","    valor    int","    proximo *No   // só aponta para frente","}","","// cabeca guarda o primeiro nó; o último proximo é nil.","// ▶ Escolha uma operação acima para ver o código rodar."],
  doubly:["// Estrutura — lista duplamente encadeada","type No struct {","    valor             int","    anterior, proximo *No   // aponta para os dois lados","}","","// cabeca e cauda nas pontas tornam as bordas O(1).","// ▶ Escolha uma operação acima para ver o código rodar."],
  circular:["// Estrutura — lista circular","type No struct {","    valor    int","    proximo *No","}","","// Guardamos só a cauda; a cabeça é cauda.proximo.","// O proximo do último volta para a cabeça (anel).","// ▶ Escolha uma operação acima para ver o código rodar."]
};

/* ===========================================================================
   EVENTOS
=========================================================================== */
document.querySelectorAll(".card").forEach(c=>c.addEventListener("click",()=>openSim(c.dataset.go)));
$("back").addEventListener("click", goHome);
document.querySelectorAll("button[data-op]").forEach(b=>b.addEventListener("click",()=>doOp(b.dataset.op)));
$("btnNext").addEventListener("click", next);
$("btnPrev").addEventListener("click", prev);
$("btnRestart").addEventListener("click", restart);
$("btnPlay").addEventListener("click", togglePlay);
$("speed").addEventListener("input", ()=>{ if(playing) autoPlay(); });
$("value").addEventListener("keydown",e=>{ if(e.key==="Enter") doOp("insertTail"); });

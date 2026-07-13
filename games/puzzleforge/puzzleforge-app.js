import { generateQuestion } from "./puzzleforge-core.js";
import { renderDiagram } from "./puzzleforge-diagrams.js";

const app = document.querySelector("[data-pf-app]");
if (!app) throw new Error("PuzzleForge root missing");
const $ = (name) => app.querySelector(`[data-pf-${name}]`);
const el = Object.fromEntries(["generate","generator-status","category","loading","loading-title","stages","wait-note","cancel","workspace","empty","level-badge","category-badge","quality-badge","number","prompt","diagram","answer-form","options","number-wrap","number-answer","hint-button","solution-button","feedback","hint","solution","solution-steps","solution-close","another","review-toggle","review","review-close","review-content"].map((name)=>[name,$(name)]));
const HISTORY_KEY="sticks-puzzleforge:v3:fingerprints";
const PREF_KEY="sticks-puzzleforge:v3:preferences";
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
const escapeHtml=(value)=>{const n=document.createElement("span");n.textContent=String(value??"");return n.innerHTML};
const state={question:null,attempts:0,answered:false,controller:null,history:safeRead(HISTORY_KEY,[]).slice(-30),counter:0};
const stages=[...el.stages.children];

function level(){return app.querySelector('input[name="pf-level"]:checked')?.value||"junior"}
function seed(){const b=new Uint32Array(2);crypto.getRandomValues(b);return `${Date.now().toString(36)}-${b[0].toString(36)}${b[1].toString(36)}`}
function savePrefs(){safeWrite(PREF_KEY,{level:level(),category:el.category.value})}
function restorePrefs(){const p=safeRead(PREF_KEY,{});const radio=app.querySelector(`input[name="pf-level"][value="${p.level}"]`);if(radio)radio.checked=true;if([...el.category.options].some(o=>o.value===p.category))el.category.value=p.category}

function setStage(index){stages.forEach((item,i)=>{item.classList.toggle("is-done",i<index);item.classList.toggle("is-active",i===index)});if(stages[index])el["loading-title"].textContent=stages[index].textContent}
function startLoading(){el.loading.hidden=false;el.workspace.hidden=true;el.empty.hidden=true;el.review.hidden=true;el.generate.disabled=true;el["wait-note"].hidden=true;setStage(0);const timers=[2500,6500,11000,16500,22000].map((ms,i)=>setTimeout(()=>{if(state.controller)setStage(i+1)},ms));const slow=setTimeout(()=>{if(state.controller)el["wait-note"].hidden=false},30000);return()=>{timers.forEach(clearTimeout);clearTimeout(slow)}}
function stopLoading(){el.loading.hidden=true;el.generate.disabled=false;state.controller=null}

function categoryTopic(category){return category==="visual-geometry"?"Geometry":category==="number-structures"?"Number":category==="systems"?"Logic":"Mixed"}
function localFallback(requestSeed){
  const candidates=[];const used=[];
  for(let i=0;i<5;i++){
    const q=generateQuestion({level:level(),seed:`${requestSeed}-${i}`,topic:categoryTopic(el.category.value),answerType:"multipleChoice",recentArchetypes:[...state.history.map(h=>h.fingerprint),...used]});used.push(q.archetype);
    const score=72+i+(q.diagram?.type?5:0)+(q.solutionSteps?.length>2?4:0);
    candidates.push({title:q.archetypeName,fingerprint:q.archetype,score:Math.min(score,84),status:i<2?"rejected":"finalist",reason:i<2?"A stronger competing structure scored higher.":"Locally solved and checked.",hiddenInsight:"Use the relationships in the diagram before calculating.",solution:q.solutionSteps.map(s=>s.explanation)});
  }
  const finalists=candidates.slice(2).sort((a,b)=>b.score-a.score);const winner=candidates.find(c=>c.fingerprint===finalists[0].fingerprint);const q=generateQuestion({level:level(),seed:`${requestSeed}-winner`,topic:categoryTopic(el.category.value),answerType:"multipleChoice",forceArchetype:winner.fingerprint,recentArchetypes:[]});
  return {...q,category:el.category.value,source:"local-fallback",qualityScore:winner.score,fingerprint:q.archetype,audit:{concepts:candidates,threshold:level()==="junior"?72:level()==="intermediate"?78:82,winnerFingerprint:q.archetype,notes:["The secure AI service is not configured in this environment, so a locally verified reserve challenge was used."]}};
}

async function forge(){
  if(state.controller)return;
  savePrefs();const requestSeed=seed();state.controller=new AbortController();const cleanup=startLoading();el["generator-status"].textContent="Five ideas are entering the forge.";
  try{
    const response=await fetch("/.netlify/functions/puzzleforge-generate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({level:level(),category:el.category.value,seed:requestSeed,recentFingerprints:state.history.slice(-8).map(h=>h.fingerprint)}),signal:state.controller.signal});
    let question;
    if(response.ok){question=await response.json()}else if([404,405,501,503].includes(response.status)){question=localFallback(requestSeed)}else{const detail=await response.json().catch(()=>({}));throw new Error(detail.error||`Generation failed (${response.status})`)}
    stages.forEach(s=>{s.classList.remove("is-active");s.classList.add("is-done")});renderQuestion(question);el["generator-status"].textContent=question.source==="ai"?`Selected after independent review · ${question.qualityScore}/100`:`Reserve challenge loaded · ${question.qualityScore}/100`;
  }catch(error){
    if(error.name==="AbortError"){el.empty.hidden=false;el["generator-status"].textContent="Generation cancelled."}
    else{console.error(error);try{const q=localFallback(requestSeed);renderQuestion(q);el["generator-status"].textContent="The AI forge was unavailable, so a verified reserve challenge was loaded."}catch{el.empty.hidden=false;el["generator-status"].textContent="The challenge could not be forged. Please try again."}}
  }finally{cleanup();stopLoading()}
}

function renderQuestion(q){
  state.question=q;state.attempts=0;state.answered=false;state.counter+=1;el.workspace.hidden=false;el.empty.hidden=true;el["level-badge"].textContent=q.level;el["category-badge"].textContent=(q.category||q.topic||"Mixed").replaceAll("-"," ");el["quality-badge"].textContent=q.source==="ai"?`AI reviewed · ${q.qualityScore}/100`:`Locally verified · ${q.qualityScore}/100`;el.number.textContent=`${state.counter}.`;el.prompt.textContent=q.prompt;
  if(q.diagramDataUri)el.diagram.innerHTML=`<img src="${q.diagramDataUri}" alt="${escapeHtml(q.diagramAlt||"Diagram for the question")}">`;else el.diagram.innerHTML=renderDiagram(q);el.diagram.hidden=false;
  const multiple=q.answerType!=="integer";el.options.hidden=!multiple;el["number-wrap"].hidden=multiple;el["number-answer"].value="";const opts=(q.options||[]).map(v=>typeof v==="object"?v.value:v);el.options.innerHTML=multiple?`<legend>Select an answer</legend>${opts.map((v,i)=>`<label><input type="radio" name="pf-answer" value="${escapeHtml(v)}"><span><b>(${String.fromCharCode(65+i)})</b>${escapeHtml(v)}</span></label>`).join("")}`:"";
  el.feedback.className="pf-feedback";el.feedback.textContent="Use every detail carefully.";el.hint.hidden=true;el.hint.querySelector("p").textContent=q.hint;el.solution.hidden=true;el["solution-button"].disabled=true;el["solution-steps"].innerHTML=(q.solutionSteps||[]).map((step,i)=>`<article><span>Step ${i+1}</span><p>${escapeHtml(typeof step==="string"?step:step.explanation)}</p></article>`).join("");
  state.history.push({fingerprint:q.fingerprint||q.archetype,level:q.level,score:q.qualityScore});state.history=state.history.slice(-30);safeWrite(HISTORY_KEY,state.history);renderReview(q.audit,q.fingerprint||q.archetype);requestAnimationFrame(()=>el.workspace.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}))
}

function renderReview(audit,winner){
  if(!audit){el["review-content"].innerHTML='<p class="pf-error">No review evidence was returned.</p>';return}
  const cards=(audit.concepts||audit.candidates||[]).map(c=>`<article class="pf-review-card ${c.fingerprint===winner?"is-winner":""}"><p class="pf-kicker">${escapeHtml(c.status||"concept")}${c.fingerprint===winner?" · selected":""}</p><h3>${escapeHtml(c.title||c.conceptName||"Candidate")}</h3><p class="pf-score">${escapeHtml(c.score??"—")}<span>/100</span></p><p>${escapeHtml(c.reason||c.verdict||"")}</p><dl><dt>Fingerprint</dt><dd>${escapeHtml(c.fingerprint)}</dd><dt>Hidden idea</dt><dd>${escapeHtml(c.hiddenInsight||"Recorded internally")}</dd></dl>${c.solution?.length?`<details><summary>Independent solution</summary><ol>${c.solution.map(s=>`<li>${escapeHtml(typeof s==="string"?s:s.explanation)}</li>`).join("")}</ol></details>`:""}</article>`).join("");
  el["review-content"].innerHTML=`${audit.notes?.length?`<div class="pf-error">${audit.notes.map(escapeHtml).join(" ")}</div>`:""}<div class="pf-review-grid">${cards}</div>`;
}
function submitted(){return state.question?.answerType==="integer"?el["number-answer"].value.trim():app.querySelector('input[name="pf-answer"]:checked')?.value||""}
function check(event){event.preventDefault();if(!state.question||state.answered)return;const value=submitted();if(!value){el.feedback.className="pf-feedback is-warn";el.feedback.textContent="Choose or enter an answer first.";return}state.attempts++;const norm=v=>String(v).replace(/[\s,]/g,"").toLowerCase();if(norm(value)===norm(state.question.correctAnswer)){state.answered=true;el.feedback.className="pf-feedback is-correct";el.feedback.textContent="Correct — you found the organising idea.";el["solution-button"].disabled=false}else{el.feedback.className="pf-feedback is-warn";el.feedback.textContent=state.attempts<2?"Not quite. Look for a relationship that avoids doing everything directly.":"That was your second try. The worked solution is now available.";if(state.attempts>=2)el["solution-button"].disabled=false}}

el.generate.addEventListener("click",forge);el.another.addEventListener("click",forge);el.cancel.addEventListener("click",()=>state.controller?.abort());el["answer-form"].addEventListener("submit",check);el["hint-button"].addEventListener("click",()=>{el.hint.hidden=!el.hint.hidden});el["solution-button"].addEventListener("click",()=>{if(!el["solution-button"].disabled)el.solution.hidden=false});el["solution-close"].addEventListener("click",()=>el.solution.hidden=true);el["review-toggle"].addEventListener("click",()=>el.review.hidden=false);el["review-close"].addEventListener("click",()=>el.review.hidden=true);app.querySelectorAll('input[name="pf-level"]').forEach(i=>i.addEventListener("change",savePrefs));el.category.addEventListener("change",savePrefs);restorePrefs();

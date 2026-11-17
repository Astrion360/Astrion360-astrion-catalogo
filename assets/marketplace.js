/** Astrion Marketplace Final — busca, filtros, comparação e recomendações orientadas a objetivos.
 * Interface inteiramente local. Não usa modelo de IA, API de pesquisa ou endpoint privado.
 */
(function(){'use strict';
const DATA=window.ASTRION_DATA,UI=window.ASTRION_UI;if(!DATA||!UI)return;
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const esc=UI.escape;
const href=(type,id)=>UI.urlFor(type,id);
const tokens=s=>norm(s).split(' ').filter(w=>w.length>2&&!['uma','uns','das','dos','com','para','por','que','sao','tem','ser','mais','nos','nossa','quero','preciso','empresa','meu','minha','sobre','fazer'].includes(w));
const stem=w=>w.replace(/(coes|cao|mente|amento|imento|idades|idade|adores|adora|adores|adas|ados|agem|icas|icos|icas|ar|er|ir|es|s)$/,'');
const goalName=g=>DATA.goals[g]?.name||'Serviço Astrion';
const money=x=>UI.money(x);
const wrapItem=(x,type)=>({type,id:type==='servico'?x.code:x.id,data:x});
const ALL=[...DATA.solutions.map(x=>wrapItem(x,'solucao')),...DATA.services.map(x=>wrapItem(x,'servico'))];
const describe=x=>x.data.valueProposition||x.data.short||x.data.scope||'';
const deliverables=x=>(x.type==='servico'?x.data.included:x.data.outcomes)||[];
function card(x){const item=x.data,ref=x.id,out=deliverables(x).slice(0,2),sol=x.type==='solucao';return `<article class="product-card"><div class="product-category"><span class="tag">${esc(goalName(item.goal))}</span><span class="product-kind">${sol?'Solução combinada':'Serviço individual'}</span></div><h3><a href="${href(x.type,ref)}">${esc(item.name)}</a></h3><p class="product-prop">${esc(describe(x))}</p><div class="product-items">${out.map(s=>`<div><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>${esc(s)}</div>`).join('')}</div><div class="product-meta"><span>${item.priceType==='mensal'?'Mensalidade':item.priceType==='projeto'?'Projeto':'Sob consulta'}</span><strong>${esc(item.price)}</strong></div><div class="product-actions"><a class="btn outline" href="${href(x.type,ref)}">Ver detalhes →</a><button type="button" class="btn tiny-solid" data-add="${esc(x.type)}" data-id="${esc(ref)}">+ Selecionar</button></div><label class="product-checkbox"><input type="checkbox" data-compare="${esc(x.type)}:${esc(ref)}" ${comparison.has(x.type+':'+x.id)?'checked':''}> Comparar esta oferta</label></article>`;}
let comparison=new Set(),visible=12,lastResults=[];
function initMarket(){const host=$('#shop-grid');if(!host)return;const fg=$('#goal-filters');const qs=new URLSearchParams(location.search);const preselect=qs.get('objetivo');fg.innerHTML=Object.entries(DATA.goals).map(([id,g])=>`<label class="filter-option"><input type="checkbox" name="goal" value="${esc(id)}" ${id===preselect?'checked':''}><span>${esc(g.name)}</span><small>${ALL.filter(x=>x.data.goal===id).length}</small></label>`).join('');
 const input=$('#shop-search');const urlQuery=qs.get('q');if(urlQuery)input.value=urlQuery.slice(0,160);
 const kindSelections=()=>$$('input[name="shop-kind"]:checked').map(e=>e.value);const goals=()=>$$('input[name="goal"]:checked').map(e=>e.value),billings=()=>$$('input[name="billing"]:checked').map(e=>e.value);
 const sort=$('#shop-sort'),count=$('#shop-count'),chip=$('#active-filters'),empty=$('#shop-empty'),more=$('#shop-more');
 const match=(x,search)=>{if(!search)return true;const hay=norm([x.data.name,x.data.goal,x.data.area||'',x.data.valueProposition, x.data.scope||'',x.data.problem||'',...(x.data.included||[]),...(x.data.outcomes||[]),...(x.data.topics||[]),x.id].join(' '));const query=norm(search);if(hay.includes(query))return true;const tok=tokens(query);return !!tok.length&&tok.every(w=>hay.split(' ').some(h=>stem(h).startsWith(stem(w).slice(0,Math.max(3,stem(w).length-2)))));};
 const refresh=(reset=true)=>{if(reset)visible=12;const search=input.value.trim(),chosen=goals(),kinds=kindSelections(),billing=billings();let scored=ALL.filter(x=>kinds.includes(x.type)&&(!chosen.length||chosen.includes(x.data.goal))&&(!billing.length||billing.includes(x.data.priceType))&&match(x,search));
 const score=x=>{if(!search)return x.type==='solucao'?15:0;const name=norm(x.data.name),q=norm(search),topic=norm(x.data.valueProposition||'');let val=x.type==='solucao'?1:0;if(name.includes(q))val+=30;if(topic.includes(q))val+=12;for(const w of tokens(q)){if(tokens(name).some(a=>stem(a)===stem(w)))val+=7;if(tokens(topic).some(a=>stem(a)===stem(w)))val+=2;}return val;};
 if(sort.value==='az')scored.sort((a,b)=>a.data.name.localeCompare(b.data.name,'pt-BR'));
 else if(sort.value==='price')scored.sort((a,b)=>(a.data.priceType==='consulta'?Infinity:a.data.priceValue||Infinity)-(b.data.priceType==='consulta'?Infinity:b.data.priceValue||Infinity));
 else scored.sort((a,b)=>score(b)-score(a));lastResults=scored;host.innerHTML=scored.slice(0,visible).map(card).join('');count.textContent=`${scored.length} ${scored.length===1?'oferta encontrada':'ofertas encontradas'}`;empty.hidden=scored.length>0;more.hidden=visible>=scored.length;more.textContent=`Mostrar mais (${scored.length-visible} restantes) →`;
 chip.innerHTML=[...chosen.map(v=>({value:v,label:goalName(v)})),...(search?[{value:'__query',label:'Busca: '+search}]:[])].map(x=>`<button type="button" data-remove-filter="${esc(x.value)}">${esc(x.label)} ×</button>`).join('');
 };
 document.querySelectorAll('#shop-filters input').forEach(x=>x.addEventListener('change',()=>refresh()));input.addEventListener('input',()=>refresh());sort.addEventListener('change',()=>refresh());more.addEventListener('click',()=>{visible+=12;refresh(false);});
 const reset=()=>{input.value='';$$('#shop-filters input[name="goal"]').forEach(e=>e.checked=false);$$('#shop-filters input[name="billing"]').forEach(e=>e.checked=false);$$('#shop-filters input[name="shop-kind"]').forEach(e=>e.checked=true);sort.value='relevance';refresh();};
 $('#shop-clear').addEventListener('click',reset);$('#shop-empty-clear').addEventListener('click',reset);
 $('#active-filters').addEventListener('click',e=>{const t=e.target.closest('[data-remove-filter]');if(!t)return;if(t.dataset.removeFilter==='__query')input.value='';else{const checkbox=$$('[name="goal"]').find(x=>x.value===t.dataset.removeFilter);if(checkbox)checkbox.checked=false;}refresh();});
 $('#show-filters').addEventListener('click',()=>{const filters=$('#shop-filters');const open=filters.classList.toggle('open');$('#show-filters').setAttribute('aria-expanded',String(open));if(open)filters.scrollIntoView({block:'nearest'});});
 host.addEventListener('change',e=>{const cb=e.target.closest('[data-compare]');if(!cb)return;const key=cb.dataset.compare;if(cb.checked&&comparison.size>=3){cb.checked=false;UI.message('Você pode comparar até três ofertas.');return;}if(cb.checked)comparison.add(key);else comparison.delete(key);syncCompare();});
 $('#compare-clear')?.addEventListener('click',()=>{comparison.clear();refresh(false);syncCompare();});$('#compare-open')?.addEventListener('click',openCompare);$('#compare-close')?.addEventListener('click',()=>$('#compare-dialog').close());
 const dia=$('#compare-dialog');dia?.addEventListener('click',e=>{if(e.target===dia)dia.close();});refresh();syncCompare();
 }
 function syncCompare(){const tray=$('#compare-tray'),n=$('#compare-count');if(!tray||!n)return;tray.hidden=!comparison.size;n.textContent=comparison.size+' '+(comparison.size===1?'oferta selecionada':'ofertas selecionadas')+' para comparar';$$('[data-compare]').forEach(c=>c.checked=comparison.has(c.dataset.compare));}
 function openCompare(){const dialog=$('#compare-dialog'),target=$('#compare-content');if(!dialog||!target)return;const rows=[...comparison].map(k=>{const [type,id]=k.split(':');return ALL.find(x=>x.type===type&&x.id===id);}).filter(Boolean);target.innerHTML='<div class="compare-columns">'+rows.map(x=>`<article class="comparison-item"><span class="tag">${esc(goalName(x.data.goal))}</span><h3>${esc(x.data.name)}</h3><p>${esc(describe(x))}</p><div class="compare-field"><strong>Investimento referencial</strong>${esc(x.data.price)}</div><div class="compare-field"><strong>Modelo</strong>${x.data.priceType==='mensal'?'Mensal':'Pontual / a confirmar'}</div><div class="compare-field"><strong>Principais entregas</strong><ul>${deliverables(x).slice(0,4).map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div><a class="btn outline" href="${href(x.type,x.id)}">Ver escopo</a><button style="margin-top:10px" class="btn dark wide" type="button" data-add="${esc(x.type)}" data-id="${esc(x.id)}">Selecionar serviço</button></article>`).join('')+'</div>';dialog.showModal();}

// Intent map: problema/resultado, com marcadores morfológicos; não presume compra.
const INTENT={
 estrategia:['business plan','bp','viabil','estud','diagnost','oportunidad','invest','mercad','rfp','edital','concorrenc','proposta comercial','planejament'],
 canais:['corretor','parceir','vended','distribu','canal','b2b2c','b2b','comiss','credenc','agenciad','varejo','lojas','produtividad comercial','captac'],
 produtos:['produto','seguro','sqg','prestamista','sinistro','mga','mgu','garantia','receitas acess','drones','rastre','portfolio','portifolio'],
 operacao:['implant','process','digital','sistema','portal','crm','autom','ia','inteligencia artificial','simulad','excel','fluxo','integrac','operacao','administradora','white label'],
 bpo:['bpo','backoffice','terceiriz','mensal','recorrent','gestao continu','suporte','prestador','sustentac','célula','celula'],
 financeiro:['rentabil','margem','resultado','caixa','valuation','retorno','inadimpl','cobranc','recuperac','recebiv','leil','financeir','sinistro'],
 governanca:['regulat','bacen','banco central','compliance','pld','lgpd','governanc','risco','contrat','juridic','comite','pmo','autoriza']
};
function hasTerm(text,term){const n=norm(term);if(!n)return false;return (n.length<=3||n.includes(' '))?(' '+text+' ').includes(' '+n+' '):text.includes(n);}
const SPECIFIC=[
 [['precificacao','precificar','precos','pricing'],['precificacao-produtos']],
 [['reduzir custos','reducao de custos','eficiencia'],['eficiencia-custos']],
 [['aliancas estrategicas','gestao de parcerias'],['aliancas-estrategicas']],
 [['produtividade comercial','performance comercial','metas dos corretores'],['performance-canais']],
 [['simulad','excel','planilha'],['T02','T03']], [['simulad','consorcio'],['T03','T02']],
 [['rfp','edital','concorrenc'],['V09','grande-conta-rfp']], [['mga','mgu'],['seguros-mga']],
 [['sinistro'],['sinistros-prestadores']], [['corretor','corretores','b2b2c'],['canais-b2b2c','lancamento-canal']],
 [['inadimpl','cobranc','recuperac'],['O04','R01','R09']], [['administradora','white label','wl','consorcio'],['wl-administradora','V06']],
 [['dashboard','painel'],['T01']], [['pmo'],['G07','B04']], [['treinament','treinar','playbook'],['lancamento-canal','C07']]
];
const PRIORITY={estrategia:['bp-b2b','triagem-b2b','grande-conta-rfp'],canais:['canais-b2b2c','performance-canais','aliancas-estrategicas','lancamento-canal','C01'],produtos:['produtos-receitas','precificacao-produtos','seguros-mga','O01'],operacao:['implantacao-processos','eficiencia-custos','wl-administradora','transformacao-ia'],bpo:['bpo-gerencial','bpo-comercial','bpo-tecnico'],financeiro:['viabilidade-retorno','performance-portfolio','O04'],governanca:['executivo-fracionado','G07','G03']};
const SIGNALS={
 'triagem-b2b':['avaliar parceiro','triagem','pre viabilidade','primeira analise','qualificar'],
 'bp-b2b':['business plan','plano de negocios','viabilidade','parceria bancaria','parceria b2b','projecoes','modelo economico'],
 'grande-conta-rfp':['rfp','edital','grande conta','concorrencia','proposta tecnico financeira'],
 'canais-b2b2c':['corretor','b2b2c','comissao','lojas','distribuicao','credenciamento','parceiros','vendas'],
 'lancamento-canal':['treinar','treinamento','playbook','vendedores','capacitacao','lancamento'],
 'wl-administradora':['abrir administradora','white label','operacao propria','administradora consorcio','banco central','bacen'],
 'implantacao-processos':['implantar','processos','implantacao','tecnologia','simulador multicanal'],
 'transformacao-ia':['automat','ia','robotiz','retrabalho','automacao','rpa'],
 'bpo-gerencial':['pipeline','bpo','backoffice','gestao comercial mensal','relatorios mensais','propostas'],
 'bpo-comercial':['higienizar leads','qualificacao de oportunidades','relatorios comerciais'],
 'bpo-tecnico':['prestadores','suporte tecnico','terceirizacao tecnica'],
 'produtos-receitas':['seguros','sqg','prestamista','receita acessoria','novo produto'],
 'viabilidade-retorno':['valuation','tir','retorno','fluxo de caixa','viabilidade economica'],
 'performance-portfolio':['portfolio','rentabilidade','mix','margem','carteira'],
 'seguros-mga':['mga','mgu','subscricao','seguradora'],
 'sinistros-prestadores':['sinistros','sinistro','regulacao de sinistros'],
 'performance-canais':['produtividade comercial','performance dos canais','conversao de corretores','metas comerciais','gestao de performance'],
 'precificacao-produtos':['precificacao','precificar','estrategia de precos','revisao de precos','politica de precos'],
 'eficiencia-custos':['reduzir custos','reducao de custos','eficiencia operacional','despesas operacionais','gestao de custos'],
 'aliancas-estrategicas':['aliancas','alianca estrategica','gestao de parcerias','negociar parceria','acordos comerciais'],
 'executivo-fracionado':['executivo fracionado','fractional','diretor interino','gestao interina']
};
function isNegated(text,word){const w=stem(norm(word)).slice(0,5),source=norm(text);return new RegExp('(?:nao|sem|dispenso|evitar)\\s+(?:quero\\s+|preciso\\s+)?(?:\\w+\\s+){0,2}'+w).test(source);}
function score(x,text,goals,stage,choice){const item=x.data;const name=norm(item.name),prop=norm(describe(x)),words=tokens(text),textNorm=norm(text);let score=0;const matches=[];
 if(goals.includes(item.goal)){score+=22;matches.push('objetivo '+goalName(item.goal).toLowerCase());}else if(goals.length)score-=8;
 for(const [goal,aliases] of Object.entries(INTENT)){for(const term of aliases){if(hasTerm(textNorm,term)&&!isNegated(text,term)){if(item.goal===goal){score+=2.7;matches.push('necessidade relacionada a '+goalName(goal).toLowerCase());}break;}}}
 for(const w of words){const st=stem(w);if(st.length<3)continue;if(tokens(name).some(t=>stem(t).startsWith(st.slice(0,Math.min(5,st.length)))))score+=4.8;if(tokens(prop).some(t=>stem(t).startsWith(st.slice(0,Math.min(5,st.length)))))score+=2;}
 for(const alias of SIGNALS[x.id]||[]){if(hasTerm(textNorm,alias)&&!isNegated(text,alias)){score+=12;matches.push(alias);}}
 for(const [terms,ids] of SPECIFIC){if(terms.some(t=>textNorm.includes(norm(t)))&&!terms.some(t=>isNegated(text,t))&&ids.includes(x.id)){score+=24;matches.push('demanda específica');}}
 if(item.code && new RegExp('\\b'+item.code.toLowerCase()+'\\b').test(textNorm)){score+=80;matches.push('código solicitado');}
 if(textNorm.includes('excel')&&x.id==='T02')score+=24;
 if(!textNorm&&goals.length&&PRIORITY[goals[0]]?.includes(x.id))score+=(4-PRIORITY[goals[0]].indexOf(x.id))*3;
 if(stage!=='auto')score+=(item.line===stage?6:-3);
 if(choice==='combo')score+=(x.type==='solucao'?10:-25);else if(choice==='unique')score+=(x.type==='servico'?10:-25);
 else if(x.type==='solucao')score+=6;
 if(textNorm.length<5&&goals.length===0)return {score:-1,matches:[]};
 return {score,matches:[...new Set(matches)].slice(0,3)};
}
function recCard(result,index){const x=result.entry,item=x.data,out=deliverables(x).slice(0,3),label=index===0?'Opção mais aderente':'Alternativa para comparar',reason=result.matches.length?result.matches.join(' · '):'Descrição, entregáveis e objetivo próximos da sua necessidade.';
 return `<article class="recommendation-card"><div><span class="tag">${label}</span><span class="tag">${esc(x.type==='servico'?'Serviço individual':'Solução combinada')}</span><h3>${esc(item.name)}</h3><p>${esc(describe(x))}</p><p class="reason"><strong>Por que considerar:</strong> ${esc(reason)}.</p><div class="product-items">${out.map(s=>`<div><svg class="ico" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>${esc(s)}</div>`).join('')}</div><div class="rec-actions"><button class="btn dark" type="button" data-add="${esc(x.type)}" data-id="${esc(x.id)}">+ Adicionar ao carrinho</button><button type="button" class="btn outline" data-recommend-skip>Não adicionar</button><a class="btn outline" href="${href(x.type,x.id)}">Ver escopo completo →</a></div></div><div class="rec-price"><span>Referência</span><strong>${esc(item.price)}</strong><span>${item.priceType==='mensal'?'Mensal':'Projeto / a confirmar'}</span></div></article>`;
}
function initAssistant(){const form=$('#assistant-form'),input=$('#assistant-description');if(!form||!input)return;const goals=$('#assistant-goals'),selected=new Set();const params=new URLSearchParams(location.search);input.value=params.get('necessidade')?.slice(0,3000)||'';
 goals.innerHTML=Object.entries(DATA.goals).map(([id,g])=>`<button class="choice-card" type="button" data-goal="${esc(id)}" aria-pressed="false"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>${esc(g.name)}</button>`).join('');
 goals.addEventListener('click',e=>{const btn=e.target.closest('[data-goal]');if(!btn)return;const id=btn.dataset.goal;selected.has(id)?selected.delete(id):selected.add(id);btn.setAttribute('aria-pressed',String(selected.has(id)));});
 $$('[data-example]').forEach(btn=>btn.addEventListener('click',()=>{input.value=btn.dataset.example;input.focus();}));
 $('#assistant-clear').addEventListener('click',()=>{input.value='';selected.clear();$$('[data-goal]').forEach(b=>b.setAttribute('aria-pressed','false'));$('#assistant-phase').value='auto';$('#assistant-intent').value='auto';$('#assistant-results').hidden=true;input.focus();try{sessionStorage.removeItem('astrion-briefing-need-v5');}catch(_){}});
 form.addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim(),chosen=[...selected];const stage=$('#assistant-phase').value,choice=$('#assistant-intent').value;
 if(text.length<7&&!chosen.length){UI.message('Escolha um objetivo ou descreva o desafio para começar.');input.focus();return;}
 try{sessionStorage.setItem('astrion-briefing-need-v5',text||chosen.map(goalName).join(', '));}catch(_){ }
 const filtered=ALL.map(x=>({entry:x,...score(x,text,chosen,stage,choice)})).sort((a,b)=>b.score-a.score||a.entry.data.name.localeCompare(b.entry.data.name,'pt-BR'));
 const primary=filtered.filter(x=>x.score>1),boxes=$('#recommendation-items'),result=$('#assistant-results'),context=$('#assistant-context'),questions=$('#assistant-questions');result.hidden=false;
 if(!primary.length){boxes.innerHTML='<div class="empty-state"><h3>Não há indicação específica com os dados informados</h3><p>Informe um objetivo e o tipo de entrega. Você também pode solicitar uma avaliação humana sem selecionar serviços.</p></div>';context.textContent='Precisamos de mais informações para sugerir uma oferta.';questions.hidden=false;questions.textContent='Ajuda: qual resultado a empresa espera, em que fase está e se precisa de projeto pontual ou suporte recorrente?';}
 else{const top=primary[0];const alternatives=primary.slice(1).filter(x=>!(top.entry.type==='solucao'&&x.entry.type==='servico'&&top.entry.data.codes?.includes(x.entry.id))).slice(0,2);boxes.innerHTML=[top,...alternatives].map(recCard).join('');context.textContent=chosen.length?'Relacionamos seu objetivo ('+chosen.map(goalName).join(', ')+') às entregas das ofertas.':'Relacionamos seu texto aos serviços e objetivos do catálogo.';questions.hidden=text.length>=25;questions.textContent='Para uma indicação mais precisa, informe o tamanho da operação, os canais envolvidos, o prazo e o resultado que deseja receber.';}
 result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
 });
 $('#recommendation-items').addEventListener('click',e=>{const b=e.target.closest('[data-recommend-skip]');if(!b)return;const card=b.closest('.recommendation-card');if(!card)return;card.classList.toggle('rejected');b.textContent=card.classList.contains('rejected')?'Reconsiderar':'Não adicionar';const add=card.querySelector('[data-add]');if(add)add.disabled=card.classList.contains('rejected');});
 }
window.ASTRION_RECOMMENDER={score,all:ALL,normalize:norm,searchText:tokens};
function init(){initMarket();initAssistant();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

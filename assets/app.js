"use strict";
const catalog = window.ASTRION_DATA;
const cart = window.ASTRION_CART;
const intelligence = window.ASTRION_INTELLIGENCE;
const config = window.ASTRION_CONFIG || { formEndpoint: 'https://formspree.io/f/mwleqwkr', contactEmail: 'contato@astrion360.com.br' };
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const route = (p) => '../'.repeat(Number(document.body.dataset.depth || 0)) + p;
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function icon(name = 'arrow') {
    return name === 'arrow' ? '<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' : '<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2 12h12l2-9H6M9 21h.01M18 21h.01"/></svg>';
}
let toastTimer;
function toast(msg) { const el = $('#toast'); if (!el)
    return; el.textContent = msg; el.hidden = false; window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { el.hidden = true; }, 4200); }
function updateCount() { if (cart) {
    const el = $('#cart-count');
    if (el)
        el.textContent = String(cart.get().length);
} }
function add(type, id, origin = 'manual') { if (!cart)
    return; if (cart.add(type, id, origin))
    toast('Adicionado ao carrinho de orçamento.');
else
    toast('Este item já está no carrinho, ou o limite de itens foi atingido.'); updateCount(); updateActionButtons(); }
function remove(type, id) { if (cart?.remove(type, id))
    toast('Item retirado do carrinho.'); updateCount(); updateActionButtons(); }
function updateActionButtons() { if (!cart)
    return; const selected = new Set(cart.get().map(i => i.type + ':' + i.id)); $$('[data-add]').forEach(b => { let key = b.dataset.add + ':' + b.dataset.id; const exists = selected.has(key); b.textContent = exists ? 'No carrinho ✓' : 'Adicionar ao carrinho +'; b.disabled = exists; }); }
function navigateMenu() { const toggle = $('#menu-toggle'), links = $('#main-navigation'); if (!toggle || !links)
    return; toggle.addEventListener('click', () => { const open = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); }); links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); })); window.addEventListener('keydown', e => { if (e.key === 'Escape') {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
} }); }
function initHome() { const input = $('#hero-need'); if (!input)
    return; $$('[data-fill-hero]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.fillHero || ''; input.focus(); })); }
function initListing() {
    const search = $('#catalog-search');
    const line = $('#catalog-line');
    const price = $('#catalog-price');
    if (search && line && price) {
        const cards = $$('#catalog-results > article');
        const count = $('#catalog-count');
        const empty = $('#catalog-empty');
        const apply = () => { const q = norm(search.value.trim()); let n = 0; for (const card of cards) {
            const valid = (!q || norm(card.dataset.text || '').includes(q)) && (line.value === 'all' || card.dataset.line === line.value) && (price.value === 'all' || card.dataset.price === price.value);
            card.hidden = !valid;
            if (valid)
                n++;
        } if (count)
            count.textContent = `${n} ${n === 1 ? 'serviço encontrado' : 'serviços encontrados'}`; if (empty)
            empty.hidden = n !== 0; };
        [search, line, price].forEach(el => el.addEventListener('input', apply));
        apply();
    }
    const sSearch = $('#solution-search'), sLine = $('#solution-line');
    if (sSearch && sLine) {
        const cards = $$('#solution-results > div');
        const count = $('#solution-count');
        const urlLine = new URLSearchParams(location.search).get('linha');
        if (['01', '02', '03'].includes(urlLine || ''))
            sLine.value = urlLine;
        const apply = () => { const q = norm(sSearch.value.trim()); let n = 0; for (const c of cards) {
            const match = (!q || norm(c.dataset.text || '').includes(q)) && (sLine.value === 'all' || c.dataset.line === sLine.value);
            c.hidden = !match;
            if (match)
                n++;
        } if (count)
            count.textContent = `${n} ${n === 1 ? 'solução encontrada' : 'soluções encontradas'}`; };
        [sSearch, sLine].forEach(el => el.addEventListener('input', apply));
        apply();
    }
}
function findItem(item) { return item.type === 'servico' ? catalog?.services.find(s => s.code === item.id) : catalog?.solutions.find(s => s.id === item.id); }
function itemCost(it) { return it.priceType === 'consulta' ? 'Sob consulta' : it.price; }
function extraCodeList(item) { if ('code' in item)
    return ''; if (!item.codes.length)
    return '<div class="code-list"><p>Escopo especializado definido com a equipe Astrion.</p></div>'; return '<div class="code-list">' + item.codes.map(code => { const s = catalog?.services.find(a => a.code === code); return s ? `<div class="code-row"><span><strong>${esc(code)}</strong> · ${esc(s.name)}</span><span>${esc(s.price)}</span></div>` : ''; }).join('') + '</div>'; }
function cardForRecommendation(item, alternative = false) {
    const data = findItem(item);
    if (!data)
        return '';
    const code = item.type === 'servico' ? data.code : data.id;
    const link = item.type === 'servico' ? route('catalogo/' + code.toLowerCase() + '/index.html') : route('solucoes/' + code + '/index.html');
    const selected = cart?.get().some(x => x.type === item.type && x.id === item.id);
    const keyword = item.match?.length ? 'Identificamos relação com: ' + item.match.join(', ') + '.' : 'Correspondência entre sua necessidade e os serviços cadastrados.';
    return `<article class="result-card" data-result-type="${esc(item.type)}" data-result-id="${esc(item.id)}"><div><div class="card-label"><span class="pill ${alternative ? '' : 'gold'}">${alternative ? 'Alternativa para avaliar' : 'Indicação principal'}</span><span class="pill">${item.type === 'solucao' ? 'Solução combinada' : 'Serviço individual'}</span></div><h3>${esc(data.name)}</h3><p class="matches">${esc(keyword)}</p><p>${esc('short' in data ? data.short : data.scope || 'Escopo definido na proposta.')}</p>${extraCodeList(data)}<div class="result-actions"><button type="button" class="btn navy small" data-recommend-add="${esc(item.type)}" data-id="${esc(item.id)}" ${selected ? 'disabled' : ''}>${selected ? 'Incluído no carrinho ✓' : 'Adicionar ao carrinho +'}</button><button class="btn light small" type="button" data-recommend-skip="${esc(item.type)}" data-id="${esc(item.id)}">Não adicionar</button><a class="btn textonly small" href="${esc(link)}">Ver detalhes ${icon()}</a></div></div><div class="result-price"><small>Valor de referência</small><strong>${esc(itemCost(data))}</strong><small>${data.priceType === 'mensal' ? 'Cobrança mensal' : 'Escopo sujeito à proposta'}</small></div></article>`;
}
function setProgress(active) { $$('.progress span').forEach((span, i) => { span.classList.toggle('active', i === active - 1); }); }
function initAssistant() {
    const form = $('#assistant-form'), input = $('#assistant-description');
    if (!form || !input || !intelligence || !catalog)
        return;
    const fromUrl = new URLSearchParams(location.search).get('necessidade');
    if (fromUrl)
        input.value = fromUrl.slice(0, 3000);
    else {
        try {
            const prior = sessionStorage.getItem('astrion-briefing-need-v4');
            if (prior)
                input.value = prior.slice(0, 3000);
        }
        catch { }
    }
    $$('[data-example]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.example || ''; input.focus(); }));
    $('#assistant-clear')?.addEventListener('click', () => { form.reset(); $('#assistant-results')?.setAttribute('hidden', ''); setProgress(1); input.focus(); try {
        sessionStorage.removeItem('astrion-briefing-need-v4');
    }
    catch { } });
    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!form.reportValidity())
            return;
        const need = input.value.trim();
        if (need.length < 12) {
            toast('Descreva a necessidade com mais detalhes.');
            return;
        }
        try {
            sessionStorage.setItem('astrion-briefing-need-v4', need);
        }
        catch { }
        const result = intelligence.recommend({ need, choice: ($('#assistant-intent')?.value || 'auto'), stage: ($('#assistant-phase')?.value || 'auto') }, catalog);
        const box = $('#assistant-results'), items = $('#recommendation-items'), alts = $('#recommendation-alternatives'), context = $('#assistant-context');
        if (!box || !items || !alts)
            return;
        box.hidden = false;
        setProgress(2);
        if (context)
            context.textContent = result.message || 'Avaliação do catálogo Astrion';
        if (!result.items?.length) {
            items.innerHTML = '<div class="empty-state" style="margin-top:16px"><h3>Precisamos de mais contexto para indicar um serviço com segurança.</h3><p style="margin:12px 0">' + esc(result.message) + '</p><p>' + esc(result.questions?.join(' · ') || 'Informe o setor e o resultado que deseja receber.') + '</p></div>';
            alts.innerHTML = '';
        }
        else {
            items.innerHTML = result.items.map(i => cardForRecommendation(i)).join('');
            alts.innerHTML = result.alternatives?.length ? '<h3 style="margin-top:24px;margin-bottom:4px">Alternativas para comparar</h3>' + result.alternatives.slice(0, 2).map(i => cardForRecommendation(i, true)).join('') : '';
        }
        box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    document.addEventListener('click', e => {
        const t = e.target;
        const addBtn = t.closest('[data-recommend-add]');
        if (addBtn) {
            add(addBtn.dataset.recommendAdd, addBtn.dataset.id || '', 'assistant');
            const parent = addBtn.closest('.result-card');
            const btn = parent?.querySelector('[data-recommend-add]');
            if (btn) {
                btn.textContent = 'Incluído no carrinho ✓';
                btn.disabled = true;
            }
            setProgress(3);
            return;
        }
        const skip = t.closest('[data-recommend-skip]');
        if (skip) {
            const row = skip.closest('.result-card');
            if (!row)
                return;
            const skipped = !row.classList.toggle('rejected');
            skip.textContent = skipped ? 'Não adicionar' : 'Reconsiderar';
            if (!skipped) {
                const add = row.querySelector('[data-recommend-add]');
                if (add)
                    add.disabled = true;
            }
            else {
                const add = row.querySelector('[data-recommend-add]');
                if (add) {
                    const exists = cart?.get().some(i => i.type === add.dataset.recommendAdd && i.id === add.dataset.id);
                    add.disabled = !!exists;
                }
            }
        }
    });
}
function cartItemView(entry) {
    const item = entry.type === 'servico' ? catalog?.services.find(x => x.code === entry.id) : catalog?.solutions.find(x => x.id === entry.id);
    if (!item)
        return '';
    const uri = entry.type === 'servico' ? 'catalogo/' + entry.id.toLowerCase() + '/index.html' : 'solucoes/' + entry.id + '/index.html';
    return `<article class="selection-row"><div><div class="card-label"><span class="pill">${entry.type === 'servico' ? 'Serviço' : 'Solução'}</span><span class="card-index">${esc(entry.id.toUpperCase())}</span></div><h3>${esc(item.name)}</h3><p>${esc(entry.type === 'servico' ? item.area : item.short)}</p><a class="text-link" style="display:inline-block;margin-top:12px" href="${route(uri)}">Ver escopo completo</a></div><div class="selection-actions"><span class="price">${esc(item.price)}</span><button type="button" class="btn light small" data-remove="${esc(entry.type)}" data-id="${esc(entry.id)}">Retirar</button></div></article>`;
}
function initCart() {
    const host = $('#cart-items');
    if (!host || !cart)
        return;
    const empty = $('#cart-empty');
    const clear = $('#cart-clear');
    const show = () => { const rows = cart.get(); host.innerHTML = rows.map(cartItemView).join(''); if (empty)
        empty.hidden = rows.length > 0; if (clear)
        clear.hidden = rows.length === 0; const s = cart.summary(); const p = $('#cart-projects'), m = $('#cart-monthly'), u = $('#cart-unpriced'); if (p)
        p.textContent = money(s.projects); if (m)
        m.textContent = money(s.monthly) + '/mês'; if (u)
        u.textContent = String(s.unpriced.length); };
    host.addEventListener('click', e => { const el = e.target.closest('[data-remove]'); if (el) {
        remove(el.dataset.remove, el.dataset.id || '');
        show();
    } });
    clear?.addEventListener('click', () => { if (confirm('Limpar todos os itens do carrinho?')) {
        cart.clear();
        updateCount();
        show();
        toast('Carrinho limpo.');
    } });
    show();
}
function cartText() { if (!cart)
    return 'Nenhum item selecionado'; const s = cart.summary(); return ['SERVIÇOS SELECIONADOS:', ...s.entries.map(e => { const it = e.type === 'servico' ? catalog?.services.find(x => x.code === e.id) : catalog?.solutions.find(x => x.id === e.id); return '- ' + (it?.name || e.id) + ' (' + e.id + ')'; }), '', 'Projetos: ' + money(s.projects), 'Mensalidades: ' + money(s.monthly) + '/mês', 'Itens sob consulta: ' + s.unpriced.length, 'Serviços contabilizados uma única vez: ' + s.services.map(x => x.code).join(', ')].join('\n'); }
function initForm() {
    const form = $('#briefing-form');
    if (!form)
        return;
    const objective = $('#brief-objective');
    if (!objective)
        return;
    const params = new URLSearchParams(location.search);
    const specified = params.get('solucao') || params.get('servico');
    if (specified)
        objective.value = 'Gostaria de avaliar a seguinte oferta: ' + specified + '.\n\nMeu objetivo é: ';
    if (params.get('origem') === 'assistente' || params.get('carrinho') === '1') {
        try {
            const need = sessionStorage.getItem('astrion-briefing-need-v4');
            if (need)
                objective.value = need;
        }
        catch { }
    }
    const review = $('#brief-selection');
    if (cart && review) {
        const s = cart.summary();
        if (s.entries.length)
            review.innerHTML = '<strong>' + s.entries.length + ' item(ns) selecionado(s)</strong><p style="font-size:12px;margin-top:7px">Projetos: ' + esc(money(s.projects)) + ' · Mensalidades: ' + esc(money(s.monthly)) + '/mês · Sob consulta: ' + s.unpriced.length + '</p><a class="text-link" href="../carrinho/index.html">Revisar carrinho</a>';
    }
    const feedback = $('#briefing-feedback'), submit = $('#brief-send'), fallback = $('#brief-mailto');
    function show(msg, kind = 'error') { if (feedback) {
        feedback.hidden = false;
        feedback.className = 'notice ' + kind;
        feedback.textContent = msg;
        feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } }
    const val = (id) => ($('#' + id)?.value || '').trim();
    const compose = () => ["SOLICITAÇÃO DE PROPOSTA — ASTRION", '', `Responsável: ${val('brief-person')}`, `Empresa: ${val('brief-company')}`, `E-mail: ${val('brief-email')}`, `Telefone: ${val('brief-phone')}`, `Linha: ${val('brief-line')}`, `Momento: ${val('brief-when')}`, '', "DESAFIO:", objective.value.trim(), '', 'SELEÇÃO:', cartText(), '', 'Envio pelo catálogo digital Astrion'].join('\n');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.reportValidity() || !submit)
            return;
        if (val('brief-website'))
            return;
        const summary = compose();
        const payload = new FormData();
        payload.append('_subject', 'Nova solicitação Astrion — ' + val('brief-company').slice(0, 70).replace(/[\r\n]/g, ' '));
        for (const [field, id] of [['nome', 'brief-person'], ['email', 'brief-email'], ['empresa', 'brief-company'], ['telefone', 'brief-phone'], ['linha', 'brief-line'], ['prazo', 'brief-when']])
            payload.append(field, val(id));
        payload.append('desafio', objective.value.trim());
        payload.append('resumo', summary);
        payload.append('consentimento', 'Sim - autorizado pelo formulário');
        payload.append('origem', 'Catálogo Digital Astrion');
        const subject = encodeURIComponent('Solicitação de proposta - Astrion');
        const body = encodeURIComponent(summary.slice(0, 8000));
        if (fallback) {
            fallback.href = 'mailto:' + config.contactEmail + '?subject=' + subject + '&body=' + body;
            fallback.hidden = true;
        }
        submit.disabled = true;
        submit.textContent = 'Enviando solicitação...';
        try {
            const response = await fetch(config.formEndpoint, { method: 'POST', body: payload, headers: { Accept: 'application/json' } });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || (json && json.ok === false) || (json && Array.isArray(json.errors) && json.errors.length))
                throw Error('Falha no processador do formulário');
            show('Solicitação confirmada pelo serviço de formulários. A Astrion poderá retornar pelo contato informado.', 'ok');
            submit.textContent = 'Solicitação enviada ✓';
            submit.disabled = true;
            try {
                sessionStorage.removeItem('astrion-briefing-need-v4');
            }
            catch { }
        }
        catch {
            show('Não foi possível confirmar o envio. Sua solicitação continua preenchida. Use a opção de abrir seu e-mail ou tente novamente.', 'error');
            if (fallback)
                fallback.hidden = false;
            submit.disabled = false;
            submit.textContent = 'Tentar enviar novamente →';
        }
    });
}
function globalListeners() { document.addEventListener('click', e => { const el = e.target.closest('[data-add]'); if (el) {
    add(el.dataset.add, el.dataset.id || '');
} }); }
function init() { navigateMenu(); updateCount(); globalListeners(); initHome(); initListing(); initAssistant(); initCart(); initForm(); updateActionButtons(); }
if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
else
    init();

(function () {
    'use strict';
    var PRODUCTS = {
        kit: { n: 'Kit Escritório Premium Clássico', p: 299.9, c: 'Kits Essenciais', img: 'img001.jpeg' },
        mouse: { n: 'Mouse Ergonômico Bluetooth Silence', p: 149.9, c: 'Tecnologia Essencial', img: 'mouse.jpg' },
        caneta: { n: 'Canetas esferográficas ponta fina', p: 49.9, c: 'Escrita', img: 'caneta.jpg' },
        caderno: { n: 'Caderno capa dura A5', p: 99.9, c: 'Papelaria', img: 'caderno.jpg' },
        bloco: { n: 'Bloco de notas adesivas', p: 39.9, c: 'Papelaria', img: 'bloco.jpg' },
        organizador: { n: 'Organizador de mesa compacto', p: 169, c: 'Organização', img: 'organizador.jpg' }
    };
    var FREE_SHIP = 199, SHIP = 19.9, PIX = 0.05;
    var cart = {};
    try { cart = JSON.parse(localStorage.getItem('ab_cart') || '{}'); } catch (e) { cart = {}; }
    var $ = function (id) { return document.getElementById(id); };
    var brl = function (v) { return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };

    window.dataLayer = window.dataLayer || [];
    function track(name, extra) { window.dataLayer.push(Object.assign({ event: name, ab_variant: 'B' }, extra || {})); }

    function ids() { return Object.keys(cart).filter(function (k) { return PRODUCTS[k] && cart[k] > 0; }); }
    function subtotal() { return ids().reduce(function (s, k) { return s + PRODUCTS[k].p * cart[k]; }, 0); }
    function shipping(sub) { return sub >= FREE_SHIP || sub === 0 ? 0 : SHIP; }
    function save() { try { localStorage.setItem('ab_cart', JSON.stringify(cart)); } catch (e) {} }

    function render() {
        var list = $('cart-list'), items = ids(), sub = subtotal(), count = 0;
        items.forEach(function (k) { count += cart[k]; });
        $('cart-count').textContent = count;
        list.innerHTML = items.length ? items.map(function (k) {
            return '<div class="line"><strong>' + PRODUCTS[k].n + '</strong><span>' + brl(PRODUCTS[k].p * cart[k]) + '</span>' +
                '<div class="line__ctl"><button type="button" data-q="-1" data-k="' + k + '" aria-label="Diminuir">&minus;</button><span>' + cart[k] +
                '</span><button type="button" data-q="1" data-k="' + k + '" aria-label="Aumentar">+</button><button class="rm" type="button" data-q="rm" data-k="' + k + '">Remover</button></div></div>';
        }).join('') : '<p class="empty">Seu carrinho está vazio.</p>';
        $('cart-foot').hidden = !items.length;
        $('subtotal').textContent = brl(sub);
        $('ship-msg').textContent = sub >= FREE_SHIP ? 'Você ganhou frete grátis!' : 'Faltam ' + brl(FREE_SHIP - sub) + ' para o frete grátis.';
        save();
    }

    function show(view) {
        ['cart', 'checkout', 'done'].forEach(function (v) { $('v-' + v).hidden = v !== view; });
        $('drawer-title').textContent = view === 'cart' ? 'Seu carrinho' : view === 'checkout' ? 'Finalizar compra' : 'Pedido';
    }
    function open(view) {
        show(view || 'cart');
        $('drawer').classList.add('is-open'); $('drawer').setAttribute('aria-hidden', 'false'); $('overlay').hidden = false;
        $('drawer-close').focus();
    }
    function close() { $('drawer').classList.remove('is-open'); $('drawer').setAttribute('aria-hidden', 'true'); $('overlay').hidden = true; }

    document.addEventListener('click', function (e) {
        var add = e.target.closest('[data-add]');
        if (add) {
            var k = add.getAttribute('data-add');
            cart[k] = (cart[k] || 0) + 1; render();
            track('add_to_cart', { item_id: k, value: PRODUCTS[k].p, currency: 'BRL', origin: add.id || 'cartao' });
            open('cart'); return;
        }
        var q = e.target.closest('[data-q]');
        if (q) {
            var key = q.getAttribute('data-k'), d = q.getAttribute('data-q');
            cart[key] = d === 'rm' ? 0 : Math.max(0, (cart[key] || 0) + Number(d)); render();
        }
    });
    $('cart-open').addEventListener('click', function () { open('cart'); });
    $('drawer-close').addEventListener('click', close);
    $('overlay').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); menu.classList.remove('is-open'); } });

    $('go-checkout').addEventListener('click', function () {
        track('begin_checkout', { value: subtotal(), currency: 'BRL' });
        updateTotals(); show('checkout');
    });
    $('back-cart').addEventListener('click', function () { show('cart'); });
    $('done-close').addEventListener('click', close);

    var form = $('co-form');
    function updateTotals() {
        var sub = subtotal(), pix = form.pay.value === 'pix', total = sub * (pix ? 1 - PIX : 1) + shipping(sub);
        $('co-ship').textContent = shipping(sub) ? brl(shipping(sub)) : 'Grátis';
        $('co-total').textContent = brl(total);
        return total;
    }
    form.addEventListener('change', updateTotals);
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        Array.prototype.forEach.call(form.elements, function (el) { el.classList.add('touched'); });
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var total = updateTotals(), order = 'OS-' + Math.floor(100000 + Math.random() * 900000);
        track('purchase', { transaction_id: order, value: total, currency: 'BRL' });
        $('done-msg').textContent = 'Número do pedido ' + order + '. Total ' + brl(total) + '. (Demonstração, nenhum dado foi enviado.)';
        cart = {}; render(); form.reset(); show('done');
    });

    // Menu do cabeçalho (celular)
    var menu = $('menu'), burger = $('burger');
    burger.addEventListener('click', function () {
        var on = menu.classList.toggle('is-open'); burger.setAttribute('aria-expanded', String(on));
    });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); } });

    // Cartões de produto das telas de lista
    function card(k) {
        var p = PRODUCTS[k];
        return '<article class="pcard"><div class="pcard__img">' + (p.img ? '<img src="' + p.img + '" alt="">' : '<span aria-hidden="true">' + p.t + '</span>') +
            '</div><h3>' + p.n + '</h3><p class="pcard__cat">' + p.c + '</p><strong>' + brl(p.p) + '</strong><div class="pcard__act">' +
            (k === 'kit' ? '<a class="btn btn--ghost" href="#kit">Ver detalhes</a>' : '') + '<button class="btn" type="button" data-add="' + k + '">Adicionar</button></div></article>';
    }
    var LISTS = { inicio: ['kit', 'mouse'], produtos: Object.keys(PRODUCTS), promocoes: ['kit'] };
    Array.prototype.forEach.call(document.querySelectorAll('[data-list]'), function (el) {
        el.innerHTML = LISTS[el.getAttribute('data-list')].map(card).join('');
    });

    // Barra fixa de compra (só na tela do kit)
    var mainBtn = $('cta-main'), bar = $('sticky-bar'), btnSeen = true, current = 'kit';
    function syncBar() {
        var on = current === 'kit' && !btnSeen;
        bar.classList.toggle('is-on', on); bar.setAttribute('aria-hidden', String(!on));
    }
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { btnSeen = en[0].isIntersecting; syncBar(); }).observe(mainBtn);
    }

    // Navegação entre telas (#inicio, #produtos, #promocoes, #contato, #kit)
    var VIEWS = ['inicio', 'produtos', 'promocoes', 'contato', 'kit'];
    function route(first) {
        var v = location.hash.slice(1);
        if (VIEWS.indexOf(v) < 0) { if (!first) return; v = 'kit'; }
        current = v;
        VIEWS.forEach(function (n) { $('view-' + n).hidden = n !== v; });
        Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
            if (a.getAttribute('href') === '#' + v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        if (!first) window.scrollTo(0, 0);
        btnSeen = v !== 'kit' ? true : btnSeen; syncBar();
        track('page_view', { view: v });
        if (v === 'kit') track('view_item', { item_id: 'kit' });
    }
    window.addEventListener('hashchange', function () { route(false); });

    // Formulário de contato (demonstração)
    var ct = $('ct-form');
    ct.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!ct.checkValidity()) { ct.reportValidity(); return; }
        track('contact_submit'); ct.reset(); $('ct-ok').hidden = false;
    });

    render();
    route(true);
})();

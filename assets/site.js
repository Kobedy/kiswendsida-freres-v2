/* Kiswendsida & Frères — comportements communs du site corporate.
   JavaScript simple, sans bibliothèque. Le site reste lisible sans lui. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- ouverture en double-clic (file://) : les liens « dossier/ » visent index.html */
  if (location.protocol === 'file:') {
    [].forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var h = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
      var parts = h.split('#');
      if (parts[0] === '' || /\/$/.test(parts[0])) parts[0] += 'index.html';
      else if (parts[0] === '.' || parts[0] === '..') parts[0] += '/index.html';
      a.setAttribute('href', parts.join('#'));
    });
  }

  /* --- barre de navigation ------------------------------------------- */
  var nav = document.querySelector('.kf-nav');
  var burger = document.querySelector('.kf-burger');
  var progress = document.querySelector('.kf-progress');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('is-scrolled', y > 50);
      if (progress) {
        var max = doc.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    var m = document.getElementById('kf-mobile');
    if (m) m.inert = !open;
  }
  if (burger) {
    setMenu(false);
    burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024 && nav && nav.classList.contains('is-open')) setMenu(false);
  });

  /* menus déroulants : clavier et écrans tactiles */
  var subs = [].slice.call(document.querySelectorAll('.kf-has-sub'));
  function closeSubs(except) {
    subs.forEach(function (li) {
      if (li === except) return;
      li.classList.remove('is-open');
      var b = li.querySelector('button'); if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  subs.forEach(function (li) {
    var b = li.querySelector('button');
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var open = !li.classList.contains('is-open');
      closeSubs(li);
      li.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    li.addEventListener('mouseleave', function () { li.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.kf-has-sub')) closeSubs();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openLi = subs.filter(function (li) { return li.classList.contains('is-open'); })[0];
    closeSubs();
    if (openLi) openLi.querySelector('button').focus();
    if (nav && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });

  /* --- apparitions au défilement ----------------------------------- */
  var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
  /* la classe « js » est posée dans le <head> pour éviter tout clignotement */
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* --- compteurs animés ------------------------------------------ */
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString('fr-FR') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* --- sommaire d'article : rubrique active ---------------------- */
  var toc = [].slice.call(document.querySelectorAll('.kf-toc a'));
  if (toc.length && 'IntersectionObserver' in window) {
    var heads = toc.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var to = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        toc.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    heads.forEach(function (h) { if (h) to.observe(h); });
  }

  /* --- carte : chargée seulement à la demande -------------------- */
  [].forEach.call(document.querySelectorAll('[data-map]'), function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.kf-map');
      var f = document.createElement('iframe');
      f.src = btn.getAttribute('data-map');
      f.title = 'Plan d\'accès — siège de Kiswendsida & Frères, Casablanca';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
      var ph = box.querySelector('.kf-map__ph'); if (ph) ph.remove();
    });
  });

  /* --- formulaire de devis : envoi par e-mail ou par WhatsApp ------ */
  var region = document.querySelector('.kf-toasts');
  function toast(titre, texte) {
    if (!region) return;
    var d = document.createElement('div');
    d.className = 'kf-toast'; d.setAttribute('role', 'status');
    d.innerHTML = '<strong></strong><p></p>';
    d.querySelector('strong').textContent = titre;
    d.querySelector('p').textContent = texte;
    region.appendChild(d);
    setTimeout(function () { d.remove(); }, 6000);
  }
  function valeurs(form) {
    var champs = {};
    [].forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'submit') return;
      champs[el.name] = el.type === 'checkbox' ? (el.checked ? 'oui' : 'non')
            : el.tagName === 'SELECT' ? (el.selectedIndex > 0 ? el.options[el.selectedIndex].text : '') : el.value.trim();
    });
    return { champs: champs, texte: rediger(champs, false), whatsapp: rediger(champs, true) };
  }
  /* même plan que l'e-mail (api/_courriel.js) ; « wa » ajoute la mise en forme WhatsApp : *gras*, > citation */
  function rediger(v, wa) {
    var filet = '━━━━━━━━━━━━━━━';
    function gras(t) { return wa ? '*' + t.replace(/[*~`]/g, '').trim() + '*' : t; }
    function item(l, t) { return '• ' + l + ' : ' + t; }
    var demande = v.message.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean)
      .map(function (l) { return (wa ? '> ' : '') + l; });
    return [].concat(
      gras('NOUVELLE DEMANDE DE DEVIS'), gras(v.societe), filet,
      'Bonjour Kiswendsida & Frères, voici ma demande :', '',
      gras('L\'ESSENTIEL'), item('Matière', gras(v.matiere)), item('Tonnage estimé', gras(v.tonnage)),
      item('Région / Zone', gras(v.zone)), '',
      gras('LA DEMANDE'), demande, '',
      gras('LE DEMANDEUR'), item('Nom', v.nom), item('Société', v.societe), item('E-mail', v.email),
      item('Téléphone', v.tel), item('Bordereau (BSD)', v.bsd === 'oui' ? 'demandé' : 'non demandé'), filet,
      'https://kiswendsida-freres.com/contact/').join('\n');
  }
  [].forEach.call(document.querySelectorAll('form[data-wa]'), function (form) {
    var etat = form.querySelector('.kf-etat');
    var boutons = form.querySelectorAll('button[type="submit"]');
    function dire(genre, message) {
      etat.className = 'kf-etat text-sm' + (genre ? ' kf-etat--' + genre : '');
      etat.textContent = message;
      etat.hidden = !message;
    }
    function occupe(oui) {
      [].forEach.call(boutons, function (b) { b.disabled = oui; });
      form.setAttribute('aria-busy', oui ? 'true' : 'false');
    }
    function parWhatsApp(d) {
      window.open('https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(d.whatsapp), '_blank', 'noopener');
      dire('', '');
      toast('Demande prête !', 'WhatsApp s\'ouvre avec votre message : il ne reste qu\'à l\'envoyer. Réponse sous 24 h.');
    }
    /* envoi direct impossible : la messagerie du visiteur s'ouvre, rien n'est perdu */
    function parMessagerie(d) {
      var mail = form.getAttribute('data-mail');
      dire('info', 'L\'envoi direct n\'est pas disponible pour le moment : votre messagerie s\'ouvre avec votre demande, il ne reste '
        + 'qu\'à l\'envoyer. Si rien ne s\'ouvre, écrivez à ' + mail + ' ou utilisez le bouton WhatsApp.');
      window.location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent('Demande de devis — ' + d.champs.societe)
        + '&body=' + encodeURIComponent(d.texte.replace(/\n/g, '\r\n'));
    }
    function parEmail(d) {
      occupe(true);
      dire('info', 'Envoi en cours…');
      var ctl = window.AbortController ? new AbortController() : null;
      var minuterie = setTimeout(function () { if (ctl) ctl.abort(); }, 30000);
      fetch(form.getAttribute('data-api'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d.champs),
        signal: ctl ? ctl.signal : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { code: r.status, j: j }; });
      }).then(function (x) {
        if (x.code === 200 && x.j.ok) {
          form.reset();
          dire('ok', 'Demande envoyée ! Notre équipe vous répond sous 24 h.');
          toast('Demande envoyée !', 'Notre équipe vous recontacte sous 24 h avec une proposition.');
        } else if (x.code === 422 && x.j.erreur === 'champ_email') {
          dire('err', 'L\'adresse e-mail semble incorrecte : vérifiez-la puis renvoyez votre demande.');
          form.elements.email.focus();
        } else if (x.code === 422) {
          dire('err', 'Un champ obligatoire est vide : complétez le formulaire puis renvoyez votre demande.');
        } else if (x.code === 429) {
          dire('err', 'Plusieurs demandes viennent d\'être envoyées. Réessayez dans quelques minutes ou passez par WhatsApp.');
        } else { parMessagerie(d); }
      }).catch(function () { parMessagerie(d); }).then(function () { clearTimeout(minuterie); occupe(false); });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.getAttribute('aria-busy') === 'true') return;
      var d = valeurs(form);
      if (e.submitter && e.submitter.value === 'whatsapp') parWhatsApp(d); else parEmail(d);
    });
  });
})();

/*
 * Renders the gala page from content/site.json.
 * The same file runs in Node (build.js, the GitHub Action) and in the browser (the editor's live preview),
 * so what the editor shows is exactly what gets published.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GalaRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* "2nd Annual" -> 2<sup>nd</sup> Annual */
  function ordinals(v) {
    return esc(v).replace(/(\d+)(st|nd|rd|th)\b/g, '$1<sup>$2</sup>');
  }
  function url(u) {
    u = String(u || '').trim();
    return /^(https?:\/\/|#|mailto:|[\w./-]+$)/i.test(u) ? esc(u) : '';
  }
  function hash(str) { /* short, stable fingerprint of the content, so the editor can tell when a publish is live */
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  }
  function abs(base, path) {
    base = String(base || '');
    if (!base.endsWith('/')) base += '/';
    return /^https?:\/\//i.test(path) ? path : base + String(path || '').replace(/^\//, '');
  }

  var ICONS = {
    date: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/>' +
          '<line x1="16" y1="2" x2="16" y2="6" stroke-width="2" stroke-linecap="round"/>' +
          '<line x1="8" y1="2" x2="8" y2="6" stroke-width="2" stroke-linecap="round"/>' +
          '<line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/>',
    time: '<circle cx="12" cy="12" r="10" stroke-width="2"/>' +
          '<polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    venue: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-width="2"/>' +
           '<circle cx="12" cy="10" r="3" stroke-width="2"/>',
    address: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  function detail(kind, label, valueHtml) {
    return '\n            <div class="detail-item">\n              <div class="detail-content">\n                <div class="detail-label">\n' +
      '                  <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">' + ICONS[kind] + '</svg>\n' +
      '                  ' + label + '\n                </div>\n                <div class="detail-value">' + valueHtml + '</div>\n              </div>\n            </div>\n';
  }

  function head(c, opts) {
    var s = c.seo, base = s.siteUrl, resolve = (opts && opts.resolveAsset) || function (p) { return p; };
    var shareImg = abs(base, s.shareImage);
    var addr = { '@type': 'PostalAddress', streetAddress: s.street, addressLocality: s.city, addressRegion: s.state, postalCode: s.zip, addressCountry: 'US' };
    var ld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': base + '#organization', name: s.organizationName, url: base, email: c.contact.email,
          logo: abs(base, 'apple-touch-icon.png'), address: addr },
        { '@type': 'Event', '@id': base + '#event', name: s.eventName,
          description: s.description + (c.details.hebrewDate ? ' Hebrew date: ' + c.details.hebrewDate + '.' : ''),
          url: base, startDate: s.startDate, eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', inLanguage: 'en', image: [shareImg],
          location: { '@type': 'Place', name: c.details.venue, address: addr,
            geo: { '@type': 'GeoCoordinates', latitude: Number(s.latitude), longitude: Number(s.longitude) } },
          organizer: { '@id': base + '#organization' },
          performer: { '@type': 'PerformingGroup', name: s.performer },
          offers: { '@type': 'Offer', url: c.rsvp.url, availability: 'https://schema.org/InStock', priceCurrency: 'USD' } }
      ]
    };
    var t = esc(s.title), d = esc(s.description);
    return [
      '<title>' + t + '</title>',
      '<meta name="description" content="' + d + '" />',
      '<meta name="theme-color" content="#04191f" />',
      '<meta name="robots" content="index, follow, max-image-preview:large" />',
      '<link rel="canonical" href="' + esc(base) + '" />',
      '<meta name="content-version" content="' + hash(JSON.stringify(c)) + '" />',
      '',
      '  <!-- Local / geographic signals -->',
      '  <meta name="geo.region" content="US-' + esc(s.state) + '" />',
      '  <meta name="geo.placename" content="' + esc(s.city) + ', Virginia" />',
      '  <meta name="geo.position" content="' + esc(s.latitude) + ';' + esc(s.longitude) + '" />',
      '  <meta name="ICBM" content="' + esc(s.latitude) + ', ' + esc(s.longitude) + '" />',
      '',
      '  <!-- Social sharing -->',
      '  <meta property="og:type" content="website" />',
      '  <meta property="og:site_name" content="' + esc(s.organizationName) + '" />',
      '  <meta property="og:title" content="' + t + '" />',
      '  <meta property="og:description" content="' + d + '" />',
      '  <meta property="og:url" content="' + esc(base) + '" />',
      '  <meta property="og:image" content="' + esc(shareImg) + '" />',
      '  <meta property="og:image:width" content="1200" />',
      '  <meta property="og:image:height" content="630" />',
      '  <meta property="og:image:alt" content="' + esc(s.shareImageAlt) + '" />',
      '  <meta property="og:locale" content="en_US" />',
      '  <meta name="twitter:card" content="summary_large_image" />',
      '  <meta name="twitter:title" content="' + t + '" />',
      '  <meta name="twitter:description" content="' + d + '" />',
      '  <meta name="twitter:image" content="' + esc(shareImg) + '" />',
      '',
      '  <!-- Icons and first-paint hint -->',
      '  <link rel="icon" href="favicon.svg" type="image/svg+xml" />',
      '  <link rel="apple-touch-icon" href="apple-touch-icon.png" />',
      '  <link rel="preload" as="image" href="' + esc(resolve(c.hero.image)) + '" fetchpriority="high" />',
      '',
      '  <!-- Structured data for search engines and AI answer engines -->',
      '  <script type="application/ld+json">',
      JSON.stringify(ld, null, 2).replace(/<\//g, '<\\/').replace(/^/gm, '  '),
      '  </script>',
      ''
    ].map(function (l, i) { return i && l && !/^\s/.test(l) ? '  ' + l : l; }).join('\n');
  }

  function header(c) {
    var lights = !(c.design && c.design.lights === false);
    return '<div class="bsd" aria-hidden="true">' + esc(c.header.blessing) + '</div>\n' + (lights ? '  <canvas id="particles"></canvas>\n' : '') + '\n' +
      '  <header class="site-header">\n    <div class="container header-inner">\n      <div class="brand">\n        ' + esc(c.header.brand) +
      '\n        <small>' + esc(c.header.tagline) + '</small>\n      </div>\n      <a class="btn" href="#rsvp">' + esc(c.cta.label) + '</a>\n    </div>\n  </header>';
  }

  /* ----- the sections below the top of the page ----- */
  var note = function (txt) { return txt ? '\n        <p class="section-sub note">\n          ' + esc(txt) + '\n        </p>\n' : ''; };
  var sub = function (txt) { return txt ? '\n        <p class="section-sub">' + esc(txt) + '</p>\n' : '\n'; };
  var bandCls = function (band) { return 'section' + (band ? ' band' : ''); };
  var paras = function (txt) {
    return String(txt || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('\n          ');
  };
  var colsCls = function (n) { return n >= 1 && n <= 3 ? ' cols-' + n : ''; };

  function secTiers(c, band) {
    var tc = c.tributeCommittee;
    var tiers = tc.tiers.map(function (t) {
      var cls = (t.tone && t.tone !== 'gold') ? ' ' + esc(t.tone) : '';
      return '          <article class="card' + cls + '">\n            <h3>' + esc(t.name) + '</h3>\n            <div class="amt">' + esc(t.amount) + '</div>\n            <ul>\n' +
        (t.perks || []).map(function (p) { return '              <li>' + esc(p) + '</li>\n'; }).join('') + '            </ul>\n          </article>\n';
    }).join('\n');
    return '    <section class="' + bandCls(band) + '">\n      <div class="container">\n        <h2 class="section-title">' + esc(tc.title) + '</h2>' + sub(tc.subtitle) +
      '\n        <div class="tiers">\n' + tiers + '        </div>\n' + note(tc.note) + '      </div>\n    </section>';
  }

  function secTributes(c, band) {
    var dt = c.digitalTributes;
    var tributes = dt.items.map(function (t) {
      return '          <article class="dcard">\n            <h3>' + esc(t.title) + '</h3>\n            <div class="amt">' + esc(t.amount) + '</div>\n            <p>' + esc(t.description) + '</p>\n          </article>\n';
    }).join('\n');
    return '    <section class="' + bandCls(band) + '">\n      <div class="container">\n        <h2 class="section-title">' + esc(dt.title) + '</h2>' + sub(dt.subtitle) +
      '\n        <div class="tributes">\n' + tributes + '        </div>\n' + note(dt.note) + '      </div>\n    </section>';
  }

  function secHosts(c, band) {
    var ho = c.hosts;
    var names = ho.names.map(function (n, i) {
      n = String(n).trim();
      if (i === ho.names.length - 1) return esc(n);
      var cut = n.lastIndexOf(' ');
      return cut < 0
        ? '<span class="nb">' + esc(n) + ' <span class="dot">·</span></span>'
        : esc(n.slice(0, cut)) + ' <span class="nb">' + esc(n.slice(cut + 1)) + ' <span class="dot">·</span></span>';
    }).join(' ');
    return '    <section class="' + bandCls(band) + '">\n      <div class="container">\n        <h2 class="section-title">' + esc(ho.title) + '</h2>\n        <div class="host-box">\n          <p class="names">\n            ' + names +
      '\n          </p>\n' + (ho.status ? '          <p class="status">' + esc(ho.status) + '</p>\n' : '') + '        </div>\n      </div>\n    </section>';
  }

  function secRsvp(c, band) {
    var r = c.rsvp;
    return '    <section id="rsvp" class="' + bandCls(band) + '">\n      <div class="container">\n        <h2 class="section-title">' + esc(r.title) + '</h2>\n' +
      '        <p>' + esc(r.helpBefore) + ' <a href="' + url(r.url) + '" target="_blank" rel="noopener">' + esc(r.linkText) + '</a>.</p>\n' +
      '        <div class="rsvp-mat pending">\n          <iframe\n            id="ticket-form"\n            src="' + url(r.url) + '"\n            title="' + esc(r.formTitle) + '"\n' +
      '            referrerpolicy="no-referrer-when-downgrade"\n            onload="var m=this.parentNode;setTimeout(function(){m.classList.remove(\'pending\')},900)">\n          </iframe>\n        </div>\n' +
      '        <noscript><style>.rsvp-mat.pending::after{display:none}.rsvp-mat.pending iframe{height:2900px}</style></noscript>\n      </div>\n    </section>';
  }

  function secCta(c) {
    var ct = c.contact;
    return '    <section class="cta-band">\n      <div class="container">\n        <a class="btn" href="#rsvp">' + esc(c.cta.label) + '</a>\n        <p>\n          ' + esc(ct.before) +
      ' \n          <a href="mailto:' + esc(ct.email) + '">' + esc(ct.email) + '</a>\n        </p>\n      </div>\n    </section>';
  }

  /* --- sections added from the editor --- */
  var heading = function (b) { return b.title ? '        <h2 class="section-title">' + esc(b.title) + '</h2>' + sub(b.subtitle) : ''; };
  var wrap = function (b, band, inner) {
    return '    <section class="' + bandCls(band) + '" data-block="' + esc(b.id) + '">\n      <div class="container">\n' + inner + '      </div>\n    </section>';
  };

  function secText(b, band, resolve) {
    return wrap(b, band, heading(b) + '        <div class="block-body">\n          ' + paras(b.body) + '\n        </div>\n');
  }
  function secPhoto(b, band, resolve) {
    var img = b.image ? '          <img src="' + esc(resolve(b.image)) + '" alt="' + esc(b.imageAlt || '') + '" loading="lazy">\n' : '';
    return '    <section class="' + bandCls(band) + '" data-block="' + esc(b.id) + '">\n      <div class="container">\n        <div class="block-photo' + (b.flip ? ' flip' : '') + '">\n' + img +
      '          <div class="block-body">\n' + (b.title ? '            <h2 class="section-title">' + esc(b.title) + '</h2>\n' : '') + '            ' + paras(b.body) + '\n          </div>\n        </div>\n      </div>\n    </section>';
  }
  function secCards(b, band, resolve) {
    var items = (b.items || []);
    var cards = items.map(function (t) {
      return '          <article class="dcard">\n            <h3>' + esc(t.title) + '</h3>\n' + (t.amount ? '            <div class="amt">' + esc(t.amount) + '</div>\n' : '') +
        (t.description ? '            <p>' + esc(t.description) + '</p>\n' : '') + '          </article>\n';
    }).join('\n');
    return wrap(b, band, heading(b) + '        <div class="tributes' + colsCls(items.length) + '">\n' + cards + '        </div>\n' + note(b.note));
  }
  function secSchedule(b, band, resolve) {
    var rows = (b.items || []).map(function (t) {
      return '          <div class="schedule-row">\n            <div class="schedule-time">' + esc(t.time) + '</div>\n            <h3>' + esc(t.title) + '</h3>\n' +
        (t.description ? '            <p>' + esc(t.description) + '</p>\n' : '') + '          </div>\n';
    }).join('');
    return wrap(b, band, heading(b) + '        <div class="schedule">\n' + rows + '        </div>\n' + note(b.note));
  }
  function secFaq(b, band, resolve) {
    var qs = (b.items || []).map(function (t) {
      return '          <details>\n            <summary>' + esc(t.question) + '</summary>\n            <p>' + esc(t.answer) + '</p>\n          </details>\n';
    }).join('');
    return wrap(b, band, heading(b) + '        <div class="faq">\n' + qs + '        </div>\n');
  }
  function secBanner(b) {
    return '    <section class="cta-band block-banner" data-block="' + esc(b.id) + '">\n      <div class="container">\n' + (b.title ? '        <h2 class="section-title">' + esc(b.title) + '</h2>\n' : '') +
      (b.text ? '        <p class="banner-text">' + esc(b.text) + '</p>\n' : '') +
      (b.buttonLabel && url(b.buttonUrl) ? '        <a class="btn" href="' + url(b.buttonUrl) + '"' + (/^https?:/i.test(b.buttonUrl) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(b.buttonLabel) + '</a>\n' : '') +
      '      </div>\n    </section>';
  }

  var DEFAULT_LAYOUT = [
    { id: 'tiers', type: 'tiers', visible: true }, { id: 'tributes', type: 'tributes', visible: true },
    { id: 'hosts', type: 'hosts', visible: true }, { id: 'rsvp', type: 'rsvp', visible: true }, { id: 'cta', type: 'cta', visible: true }
  ];
  /* sections that sit on a tinted band alternate automatically, so any order looks right */
  var PLAIN_BAND = { tiers: 1, tributes: 1, hosts: 1, rsvp: 1, text: 1, photo: 1, cards: 1, schedule: 1, faq: 1 };
  var RENDER = { tiers: secTiers, tributes: secTributes, hosts: secHosts, rsvp: secRsvp, cta: secCta,
    text: secText, photo: secPhoto, cards: secCards, schedule: secSchedule, faq: secFaq, banner: secBanner };

  function layoutOf(c) { return Array.isArray(c.layout) && c.layout.length ? c.layout : DEFAULT_LAYOUT; }

  function main(c, opts) {
    var resolve = (opts && opts.resolveAsset) || function (p) { return p; };
    var h = c.hero, l = c.live, d = c.details, r = c.rsvp;

    var live = l.show
      ? '        <p class="live">' + esc(l.before) + ' <img src="' + esc(resolve(l.logo)) + '" alt="' + esc(l.logoAlt) + '" height="44"> ' + esc(l.after) + '</p>\n'
      : '';

    var dateHtml = '\n                  ' + esc(d.date) + (d.hebrewDate
      ? '\n                  <span class="date-divider" aria-hidden="true">•</span>\n                  <span class="he">' + esc(d.hebrewDate) + '</span>\n                '
      : '\n                ');
    var details = detail('date', 'Date', dateHtml) + detail('time', 'Time', esc(d.time)) +
      detail('venue', 'Venue', esc(d.venue)) + detail('address', 'Address', esc(d.address));

    var band = false;
    var sections = layoutOf(c).filter(function (it) { return it.visible !== false && RENDER[it.type]; }).map(function (it) {
      var isBand = false;
      if (PLAIN_BAND[it.type]) { isBand = band; band = !band; }
      return RENDER[it.type](it.type === 'tiers' || it.type === 'tributes' || it.type === 'hosts' || it.type === 'rsvp' || it.type === 'cta' ? c : it, isBand, resolve);
    });

    return '<main id="main">\n    \n    <section class="hero">\n      <div class="hero-stage">\n        <div class="hero-photo">\n' +
      '          <img class="hero-img" src="' + esc(resolve(h.image)) + '" width="1800" height="570" alt="' + esc(h.imageAlt) + '" loading="eager" fetchpriority="high">\n        </div>\n' +
      '        <div class="container hero-text">\n          <p class="org">' + esc(h.eyebrow) + '</p>\n          <h1>\n            <span class="line">' + ordinals(h.edition) +
      '</span>\n            <span class="gala">' + esc(h.word) + '</span>\n          </h1>\n        </div>\n      </div>\n      <div class="container">\n        <div class="divider" aria-hidden="true"></div>\n' +
      live + '\n        <div class="event-details">\n          <h2>' + esc(d.title) + '</h2>\n          <div class="details-grid">\n            ' + details +
      '\n          </div>\n        </div>\n\n        <p class="hero-cta">\n          <a class="btn" href="#rsvp">' + esc(c.cta.label) + '</a>\n        </p>\n      </div>\n    </section>\n\n' +
      sections.join('\n\n') + '\n\n  </main>';
  }

  function footer(c) { return '<footer>\n    ' + esc(c.footer.text) + '\n  </footer>'; }

  /* Machine-readable summary for AI assistants, kept in step with the page automatically. */
  function llms(c) {
    var s = c.seo, d = c.details, L = [];
    L.push('# ' + s.eventName, '', '> Formal fundraising gala hosted by ' + s.organizationName + ' (' + s.city + ', ' + s.state + '): dinner' +
      (c.live.show ? ', a live musical evening with the ' + s.performer + ' ' + c.live.after : '') + ', and sponsor and digital tribute opportunities.', '', '## Event facts',
      '- Event: ' + s.eventName, '- Date: ' + d.date + (d.hebrewDate ? ' (' + d.hebrewDate + ')' : ''), '- Time: ' + d.time + ' (Eastern Time)',
      '- Venue: ' + d.venue, '- Address: ' + d.address + ', United States',
      c.live.show ? '- Entertainment: ' + c.live.before + ' ' + s.performer + ' ' + c.live.after : '', '- Organizer: ' + s.organizationName, '- Contact: ' + c.contact.email, '',
      '## ' + c.tributeCommittee.title + ' levels (' + c.tributeCommittee.subtitle + ')');
    c.tributeCommittee.tiers.forEach(function (t) { L.push('- ' + t.name + ': ' + t.amount); });
    L.push('', '## ' + c.digitalTributes.title + ' (' + c.digitalTributes.subtitle + ')');
    c.digitalTributes.items.forEach(function (t) { L.push('- ' + t.title + ': ' + t.amount); });
    L.push('', '## ' + c.hosts.title + (c.hosts.status ? ' (' + c.hosts.status.toLowerCase() + ')' : ''), c.hosts.names.join(', '));
    llmsExtra(c).forEach(function (x) { L.push(x); });
    L.push('', '## Links', '- Event page: ' + s.siteUrl, '- RSVP, tickets and tributes: ' + c.rsvp.url, '');
    return L.filter(function (x, i, a) { return !(x === '' && a[i - 1] === ''); }).join('\n');
  }

  function sitemap(c, date) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>' + esc(c.seo.siteUrl) +
      '</loc>\n    <lastmod>' + date + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n';
  }

  /* ----- color themes: swap the palette everywhere it is used in the styles ----- */
  var KEYS = ['navy', 'navy2', 'ink', 'ivory', 'paper', 'silver', 'hi', 'lo', 'deep'];
  var BASE = { navy: '#04191f', navy2: '#082a32', ink: '#020f13', ivory: '#edf3f4', paper: '#051b21', silver: '#b9c6cc', hi: '#dde6e9', lo: '#7d9199', deep: '#1f4f5a' };
  var GOLD_METAL = { '#ffffff': '#fff4cc', '#fbfdfe': '#fbeab4', '#eef3f6': '#f6e6b0', '#e8eef1': '#f1dc9a', '#e3eaee': '#ecd58c', '#dfe7ec': '#f0d99a',
    '#dfe7eb': '#ecd89a', '#d9e1e6': '#e8cf85', '#c5d0d6': '#e3c777', '#b4c0c7': '#c9a24a', '#aab7bf': '#cfae5a', '#a3b0b8': '#c9a24a',
    '#9eacb5': '#d6b25e', '#9aa8b1': '#b8913a', '#8e9ca5': '#a98532', '#8795a0': '#9a7a2a', '#5f7079': '#8a6a1e' };
  var THEMES = [
    { id: 'platinum', label: 'Platinum on midnight teal', note: 'Current look', values: BASE },
    { id: 'sapphire', label: 'Sapphire and silver', note: 'Brighter blue',
      values: { navy: '#0a2150', navy2: '#0f2c66', ink: '#061436', ivory: '#f3f6fc', paper: '#0a1c45', silver: '#cfd6e2', hi: '#eef2fa', lo: '#94a3bd', deep: '#243f78' } },
    { id: 'steel', label: 'Steel and pewter', note: 'Quiet slate blue',
      values: { navy: '#0f1d2e', navy2: '#16293f', ink: '#09131f', ivory: '#eef2f6', paper: '#101f31', silver: '#a9b8c9', hi: '#d3dce6', lo: '#75879b', deep: '#3a5069' } },
    { id: 'turquoise', label: 'Deep turquoise and silver', note: 'Richer turquoise',
      values: { navy: '#06303a', navy2: '#0b4350', ink: '#031d24', ivory: '#eef5f6', paper: '#07313a', silver: '#cdd6dc', hi: '#eaf0f3', lo: '#8fa3ab', deep: '#1d5a66' } },
    { id: 'gold', label: 'Navy and gold', note: 'The original look', metal: GOLD_METAL,
      values: { navy: '#07101e', navy2: '#0c1830', ink: '#040a14', ivory: '#f6f1e6', paper: '#0b1526', silver: '#d6b25e', hi: '#f0d99a', lo: '#a98532', deep: '#765712' } }
  ];
  function rgbOf(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }).join(','); }
  var themeCache = {};
  function themeMap(id) {
    if (themeCache[id]) return themeCache[id];
    var t = THEMES.filter(function (x) { return x.id === id; })[0];
    if (!t || t.id === 'platinum') return (themeCache[id] = null);
    var hex = {}, rgb = {};
    KEYS.forEach(function (k) { hex[BASE[k]] = t.values[k]; rgb[rgbOf(BASE[k])] = rgbOf(t.values[k]); });
    Object.keys(t.metal || {}).forEach(function (k) { hex[k] = t.metal[k]; });
    var hexKeys = Object.keys(hex).map(function (k) { return k.replace('#', '#'); });
    var rgbKeys = Object.keys(rgb).map(function (k) { return k.split(',').join('\\s*,\\s*'); });
    var re = new RegExp('(' + hexKeys.map(function (k) { return k + '(?![0-9a-fA-F])'; }).concat(rgbKeys.map(function (k) { return '(?<![\\d.])' + k + '(?![\\d])'; })).join('|') + ')', 'gi');
    return (themeCache[id] = { re: re, hex: hex, rgb: rgb });
  }
  function recolor(chunk, m) {
    return chunk.replace(m.re, function (tok) {
      var low = tok.toLowerCase();
      if (low.charAt(0) === '#') return m.hex[low] || tok;
      return m.rgb[low.replace(/\s+/g, '')] || tok;
    });
  }
  function applyTheme(html, id) {
    var m = themeMap(id); if (!m) return html;
    return html.split(/(<style[\s\S]*?<\/style>|<script(?![^>]*ld\+json)[\s\S]*?<\/script>|<meta name="theme-color"[^>]*>)/).map(function (part, i) {
      return i % 2 ? recolor(part, m) : part;
    }).join('');
  }

  /* Machine-readable text for the sections added in the editor */
  function llmsExtra(c) {
    var out = [];
    layoutOf(c).forEach(function (b) {
      if (b.visible === false || ['text', 'photo', 'cards', 'schedule', 'faq', 'banner'].indexOf(b.type) < 0) return;
      if (b.title) out.push('', '## ' + b.title);
      if (b.subtitle) out.push(b.subtitle);
      if (b.body) out.push(String(b.body).replace(/\n{2,}/g, '\n\n'));
      if (b.text) out.push(b.text);
      (b.items || []).forEach(function (t) {
        if (b.type === 'faq') out.push('- ' + t.question + ' ' + t.answer);
        else if (b.type === 'schedule') out.push('- ' + [t.time, t.title, t.description].filter(Boolean).join(': '));
        else out.push('- ' + [t.title, t.amount, t.description].filter(Boolean).join(': '));
      });
      if (b.note) out.push(b.note);
      if (b.type === 'banner' && b.buttonLabel && b.buttonUrl) out.push(b.buttonLabel + ': ' + b.buttonUrl);
    });
    return out;
  }

  /* The whole page: the template (design, styles, scripts) with the content filled in. */
  function page(c, template, opts) {
    var html = template
      .replace('<!--@HEAD-->', function () { return head(c, opts); })
      .replace('<!--@HEADER-->', function () { return header(c); })
      .replace('<!--@MAIN-->', function () { return main(c, opts); })
      .replace('<!--@FOOTER-->', function () { return footer(c); });
    return applyTheme(html, c.design && c.design.theme);
  }

  return { page: page, head: head, header: header, main: main, footer: footer, llms: llms, sitemap: sitemap, hash: hash, esc: esc,
    THEMES: THEMES, DEFAULT_LAYOUT: DEFAULT_LAYOUT, layoutOf: layoutOf };
});

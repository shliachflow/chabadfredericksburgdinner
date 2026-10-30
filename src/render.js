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
    return '<div class="bsd" aria-hidden="true">' + esc(c.header.blessing) + '</div>\n  <canvas id="particles"></canvas>\n\n' +
      '  <header class="site-header">\n    <div class="container header-inner">\n      <div class="brand">\n        ' + esc(c.header.brand) +
      '\n        <small>' + esc(c.header.tagline) + '</small>\n      </div>\n      <a class="btn" href="#rsvp">' + esc(c.cta.label) + '</a>\n    </div>\n  </header>';
  }

  function main(c, opts) {
    var resolve = (opts && opts.resolveAsset) || function (p) { return p; };
    var h = c.hero, l = c.live, d = c.details, tc = c.tributeCommittee, dt = c.digitalTributes, ho = c.hosts, r = c.rsvp, ct = c.contact;

    var live = l.show
      ? '        <p class="live">' + esc(l.before) + ' <img src="' + esc(resolve(l.logo)) + '" alt="' + esc(l.logoAlt) + '" height="44"> ' + esc(l.after) + '</p>\n'
      : '';

    var dateHtml = '\n                  ' + esc(d.date) + (d.hebrewDate
      ? '\n                  <span class="date-divider" aria-hidden="true">•</span>\n                  <span class="he">' + esc(d.hebrewDate) + '</span>\n                '
      : '\n                ');
    var details = detail('date', 'Date', dateHtml) + detail('time', 'Time', esc(d.time)) +
      detail('venue', 'Venue', esc(d.venue)) + detail('address', 'Address', esc(d.address));

    var tiers = tc.tiers.map(function (t) {
      var cls = (t.tone && t.tone !== 'gold') ? ' ' + esc(t.tone) : '';
      return '          <article class="card' + cls + '">\n            <h3>' + esc(t.name) + '</h3>\n            <div class="amt">' + esc(t.amount) + '</div>\n            <ul>\n' +
        (t.perks || []).map(function (p) { return '              <li>' + esc(p) + '</li>\n'; }).join('') + '            </ul>\n          </article>\n';
    }).join('\n');

    var tributes = dt.items.map(function (t) {
      return '          <article class="dcard">\n            <h3>' + esc(t.title) + '</h3>\n            <div class="amt">' + esc(t.amount) + '</div>\n            <p>' + esc(t.description) + '</p>\n          </article>\n';
    }).join('\n');

    var names = ho.names.map(function (n, i) {
      n = String(n).trim();
      if (i === ho.names.length - 1) return esc(n);
      var cut = n.lastIndexOf(' ');
      return cut < 0
        ? '<span class="nb">' + esc(n) + ' <span class="dot">·</span></span>'
        : esc(n.slice(0, cut)) + ' <span class="nb">' + esc(n.slice(cut + 1)) + ' <span class="dot">·</span></span>';
    }).join(' ');

    var note = function (txt) { return txt ? '\n        <p class="section-sub note">\n          ' + esc(txt) + '\n        </p>\n' : ''; };
    var sub = function (txt) { return txt ? '\n        <p class="section-sub">' + esc(txt) + '</p>\n' : '\n'; };

    return '<main id="main">\n    \n    <section class="hero">\n      <div class="hero-stage">\n        <div class="hero-photo">\n' +
      '          <img class="hero-img" src="' + esc(resolve(h.image)) + '" width="1800" height="570" alt="' + esc(h.imageAlt) + '" loading="eager" fetchpriority="high">\n        </div>\n' +
      '        <div class="container hero-text">\n          <p class="org">' + esc(h.eyebrow) + '</p>\n          <h1>\n            <span class="line">' + ordinals(h.edition) +
      '</span>\n            <span class="gala">' + esc(h.word) + '</span>\n          </h1>\n        </div>\n      </div>\n      <div class="container">\n        <div class="divider" aria-hidden="true"></div>\n' +
      live + '\n        <div class="event-details">\n          <h2>' + esc(d.title) + '</h2>\n          <div class="details-grid">\n            ' + details +
      '\n          </div>\n        </div>\n\n        <p class="hero-cta">\n          <a class="btn" href="#rsvp">' + esc(c.cta.label) + '</a>\n        </p>\n      </div>\n    </section>\n\n' +

      '    <section class="section">\n      <div class="container">\n        <h2 class="section-title">' + esc(tc.title) + '</h2>' + sub(tc.subtitle) +
      '\n        <div class="tiers">\n' + tiers + '        </div>\n' + note(tc.note) + '      </div>\n    </section>\n\n' +

      '    <section class="section band">\n      <div class="container">\n        <h2 class="section-title">' + esc(dt.title) + '</h2>' + sub(dt.subtitle) +
      '\n        <div class="tributes">\n' + tributes + '        </div>\n' + note(dt.note) + '      </div>\n    </section>\n\n' +

      '    <section class="section">\n      <div class="container">\n        <h2 class="section-title">' + esc(ho.title) + '</h2>\n        <div class="host-box">\n          <p class="names">\n            ' + names +
      '\n          </p>\n' + (ho.status ? '          <p class="status">' + esc(ho.status) + '</p>\n' : '') + '        </div>\n      </div>\n    </section>\n\n' +

      '    <section id="rsvp" class="section band">\n      <div class="container">\n        <h2 class="section-title">' + esc(r.title) + '</h2>\n' +
      '        <p>' + esc(r.helpBefore) + ' <a href="' + url(r.url) + '" target="_blank" rel="noopener">' + esc(r.linkText) + '</a>.</p>\n' +
      '        <div class="rsvp-mat pending">\n          <iframe\n            id="ticket-form"\n            src="' + url(r.url) + '"\n            title="' + esc(r.formTitle) + '"\n' +
      '            referrerpolicy="no-referrer-when-downgrade"\n            onload="var m=this.parentNode;setTimeout(function(){m.classList.remove(\'pending\')},900)">\n          </iframe>\n        </div>\n' +
      '        <noscript><style>.rsvp-mat.pending::after{display:none}.rsvp-mat.pending iframe{height:2900px}</style></noscript>\n      </div>\n    </section>\n\n' +

      '    <section class="cta-band">\n      <div class="container">\n        <a class="btn" href="#rsvp">' + esc(c.cta.label) + '</a>\n        <p>\n          ' + esc(ct.before) +
      ' \n          <a href="mailto:' + esc(ct.email) + '">' + esc(ct.email) + '</a>\n        </p>\n      </div>\n    </section>\n\n  </main>';
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
    L.push('', '## ' + c.hosts.title + (c.hosts.status ? ' (' + c.hosts.status.toLowerCase() + ')' : ''), c.hosts.names.join(', '), '', '## Links',
      '- Event page: ' + s.siteUrl, '- RSVP, tickets and tributes: ' + c.rsvp.url, '');
    return L.filter(function (x, i, a) { return !(x === '' && a[i - 1] === ''); }).join('\n');
  }

  function sitemap(c, date) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>' + esc(c.seo.siteUrl) +
      '</loc>\n    <lastmod>' + date + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n';
  }

  /* The whole page: the template (design, styles, scripts) with the content filled in. */
  function page(c, template, opts) {
    var html = template
      .replace('<!--@HEAD-->', function () { return head(c, opts); })
      .replace('<!--@HEADER-->', function () { return header(c); })
      .replace('<!--@MAIN-->', function () { return main(c, opts); })
      .replace('<!--@FOOTER-->', function () { return footer(c); });
    return html;
  }

  return { page: page, head: head, header: header, main: main, footer: footer, llms: llms, sitemap: sitemap, hash: hash, esc: esc };
});

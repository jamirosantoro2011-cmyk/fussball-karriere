/* ── Sprachsystem ──────────────────────────────────────────────────────
   Flache Schlüssel mit Punkt-Namespace: t('menu.new').
   Platzhalter: t('season.goals', {n: 21})  ->  "21 Tore"
   Fehlende Schlüssel werden in der Konsole gemeldet (einmal pro Key). */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var missing = {};

  var i18n = {
    lang: 'de',
    langs: ['de', 'en'],
    dict: { de: {}, en: {} },
    onChange: [],

    add: function (lang, obj) {
      this.dict[lang] = this.dict[lang] || {};
      for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) this.dict[lang][k] = obj[k];
    },

    setLang: function (lang) {
      if (this.langs.indexOf(lang) < 0) return;
      this.lang = lang;
      try { localStorage.setItem('fkc.lang', lang); } catch (e) {}
      document.documentElement.lang = lang;
      this.onChange.forEach(function (fn) { fn(lang); });
    },

    initLang: function () {
      var stored = null;
      try { stored = localStorage.getItem('fkc.lang'); } catch (e) {}
      if (!stored) stored = (navigator.language || 'de').slice(0, 2) === 'de' ? 'de' : 'en';
      this.lang = this.langs.indexOf(stored) >= 0 ? stored : 'de';
      document.documentElement.lang = this.lang;
    },

    /** Kernfunktion. Fällt auf Deutsch, dann auf den Key selbst zurück. */
    t: function (key, params) {
      if (key == null) return '';
      var s = this.dict[this.lang] ? this.dict[this.lang][key] : null;
      if (s == null) s = this.dict.de ? this.dict.de[key] : null;
      if (s == null) {
        if (!missing[key]) { missing[key] = true; console.warn('[i18n] fehlender Schlüssel:', key); }
        return key;
      }
      if (params) {
        s = s.replace(/\{(\w+)\}/g, function (m, name) {
          return params[name] != null ? params[name] : m;
        });
      }
      return s;
    },

    /** Existiert der Schlüssel? Für optionale Texte. */
    has: function (key) {
      return !!((this.dict[this.lang] && this.dict[this.lang][key]) || (this.dict.de && this.dict.de[key]));
    },

    /* ── Formatierung ───────────────────────────────────────────────── */

    locale: function () { return this.lang === 'de' ? 'de-CH' : 'en-GB'; },

    num: function (v, digits) {
      return new Intl.NumberFormat(this.locale(), {
        minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0
      }).format(v);
    },

    /** Geldbetrag kompakt: 12,5 Mio. € / €12.5M */
    money: function (v) {
      var de = this.lang === 'de';
      var abs = Math.abs(v), sign = v < 0 ? '-' : '';
      var out;
      if (abs >= 1e9)      out = this.num(abs / 1e9, 2) + (de ? ' Mrd.' : 'bn');
      else if (abs >= 1e6) out = this.num(abs / 1e6, abs >= 1e7 ? 0 : 1) + (de ? ' Mio.' : 'M');
      else if (abs >= 1e3) out = this.num(abs / 1e3, 0) + (de ? ' Tsd.' : 'K');
      else                 out = this.num(abs, 0);
      return de ? sign + out + ' €' : sign + '€' + out;
    },

    /** Vorzeichenbehaftete Zahl: +3 / -2 */
    signed: function (v) { return (v > 0 ? '+' : '') + this.num(v); },

    /** Saisonbezeichnung: 2036/37 */
    season: function (startYear) {
      return startYear + '/' + String((startYear + 1) % 100).padStart(2, '0');
    },

    /** Liste natürlichsprachlich verbinden */
    list: function (arr) {
      if (!arr.length) return '';
      if (arr.length === 1) return arr[0];
      var last = arr[arr.length - 1];
      return arr.slice(0, -1).join(', ') + (this.lang === 'de' ? ' und ' : ' and ') + last;
    },

    missingKeys: function () { return Object.keys(missing); }
  };

  FKC.i18n = i18n;
  /** Kurzform, überall verfügbar */
  FKC.t = function (key, params) { return i18n.t(key, params); };

})(window.FKC);

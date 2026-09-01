/* ── Seeded Zufallsgenerator ───────────────────────────────────────────
   mulberry32: 32-Bit-Zustand, damit der komplette RNG-Stand im Save
   liegen kann. Eine Karriere ist dadurch reproduzierbar und ein Reload
   würfelt ein bereits gesehenes Ereignis nicht neu aus.              */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var rng = {
    state: 1,

    seed: function (s) {
      this.state = (s >>> 0) || 1;
      return this;
    },

    /** Gleichverteilt [0,1) */
    next: function () {
      this.state = (this.state + 0x6D2B79F5) >>> 0;
      var t = this.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    /** Ganzzahl inklusive min und max */
    int: function (min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },

    /** Kommazahl in [min,max) */
    float: function (min, max) {
      return this.next() * (max - min) + min;
    },

    /** true mit Wahrscheinlichkeit p (0..1) */
    chance: function (p) {
      return this.next() < p;
    },

    pick: function (arr) {
      return arr[Math.floor(this.next() * arr.length)];
    },

    /** Zieht n verschiedene Elemente */
    sample: function (arr, n) {
      var copy = arr.slice(), out = [];
      n = Math.min(n, copy.length);
      for (var i = 0; i < n; i++) out.push(copy.splice(Math.floor(this.next() * copy.length), 1)[0]);
      return out;
    },

    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(this.next() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },

    /** Gewichtete Auswahl. weightFn(item) -> Zahl >= 0 */
    weighted: function (items, weightFn) {
      var total = 0, i, w, weights = [];
      for (i = 0; i < items.length; i++) {
        w = Math.max(0, weightFn ? weightFn(items[i], i) : (items[i].weight || 1));
        weights.push(w);
        total += w;
      }
      if (total <= 0) return null;
      var roll = this.next() * total;
      for (i = 0; i < items.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return items[i];
      }
      return items[items.length - 1];
    },

    /** Normalverteilung (Box-Muller), auf ±3 Sigma begrenzt */
    gauss: function (mean, sd) {
      var u = 1 - this.next(), v = this.next();
      var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      if (z > 3) z = 3; if (z < -3) z = -3;
      return mean + z * sd;
    },

    /** Ganzzahlige Normalverteilung mit harten Grenzen */
    gaussInt: function (mean, sd, min, max) {
      var v = Math.round(this.gauss(mean, sd));
      if (typeof min === 'number' && v < min) v = min;
      if (typeof max === 'number' && v > max) v = max;
      return v;
    },

    /** Zufälliger Startseed für eine neue Karriere */
    newSeed: function () {
      return (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0) || 1;
    },

    /**
     * Unabhängiger Generator mit demselben Funktionsumfang.
     * Gebraucht überall dort, wo gewürfelt wird, ohne dass es zum
     * Spielstand gehört — vor allem in der Charaktererstellung: die
     * Vorschau der Startvereine darf den globalen Zustand nicht
     * verschieben, sonst würfelt der Screen die laufende Karriere um.
     */
    fork: function (seed) {
      var f = Object.create(rng);
      f.state = (seed >>> 0) || rng.newSeed();
      return f;
    }
  };

  FKC.rng = rng;

  /* Hilfsfunktionen ohne Zufall — hier, weil sie überall gebraucht werden */
  FKC.util = {
    clamp: function (v, min, max) { return v < min ? min : (v > max ? max : v); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    round: function (v, digits) { var f = Math.pow(10, digits || 0); return Math.round(v * f) / f; },
    sum: function (arr) { return arr.reduce(function (a, b) { return a + b; }, 0); },
    byId: function (arr, id) {
      for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
      return null;
    },
    /** Deterministische Farbe aus einem String (für Vereine ohne Farbangabe) */
    hashColor: function (str) {
      var h = 0, i;
      for (i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
      var palette = ['#2f6fb5', '#b53232', '#2f8f5b', '#6b4bb5', '#b5762f',
                     '#2f8f8f', '#8f2f6b', '#4a5b6b', '#7a8f2f', '#b53f6f'];
      return palette[Math.abs(h) % palette.length];
    },
    /** Kürzel für Vereinswappen */
    initials: function (name) {
      var words = name.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(/\s+/).filter(Boolean);
      if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
      return words.slice(0, 3).map(function (w) { return w[0]; }).join('').toUpperCase();
    }
  };

})(window.FKC);

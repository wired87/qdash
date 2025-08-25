// postcss.config.js
module.exports = {
  // 'plugins' ist ein Array von PostCSS-Plugins, die angewendet werden sollen.
  // Die Reihenfolge ist wichtig: Tailwind CSS sollte zuerst ausgeführt werden,
  // gefolgt von Autoprefixer.
  plugins: {
    // Fügt Tailwind CSS als PostCSS-Plugin hinzu.
    // Es wird die Tailwind-Konfiguration aus `tailwind.config.js` verwenden.
    tailwindcss: {},
    // Fügt Autoprefixer hinzu, das automatisch Vendor-Präfixe zu CSS-Regeln hinzufügt
    // (z.B. -webkit-, -moz-), um Browserkompatibilität zu gewährleisten.
    autoprefixer: {},
  },
};
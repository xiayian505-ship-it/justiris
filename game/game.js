/**
 * Justiris 遊戲目錄資料來源。
 * 回目與每回十節的資料統一記錄在 story/data/catalog.json。
 * 本檔只提供資料讀取與格式驗證，不負責呈現 UI。
 */
(() => {
  'use strict';

  const catalogUrl = new URL('./story/data/catalog.json', window.location.href);

  async function load() {
    const response = await fetch(catalogUrl, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`目錄讀取失敗：HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.episodes) || data.episodes.length !== 6) {
      throw new Error('目錄資料格式錯誤：預期包含六集。');
    }
    return data.episodes;
  }

  window.JustirisCatalog = Object.freeze({ load });
})();

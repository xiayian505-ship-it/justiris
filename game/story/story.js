/**
 * Justiris Story 核心：集／回／節、事件播放、儲存閱讀位置。
 * 不直接操作 DOM；所有畫面透過 story_style.js 訂閱呈現。
 * 未啟用的小節不讀取劇情，也不能被誤判為已通關。
 */
(() => {
  'use strict';

  const BASE = new URL('./data/', window.location.href);
  const STORAGE_KEY = 'justiris.story.progress.v1';
  const listeners = new Set();

  const defaults = () => ({ completed: [], bookmark: null });

  function loadProgress() {
    const state = defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        if (Array.isArray(saved.completed)) {
          state.completed = saved.completed.filter(id => typeof id === 'string');
        }
        if (saved.bookmark && typeof saved.bookmark === 'object') {
          state.bookmark = saved.bookmark;
        }
      }
    } catch (error) {
      console.warn('Justiris：本機進度讀取失敗，使用初始狀態。', error);
    }
    return state;
  }

  let progress = loadProgress();
  let episodes = [];
  let selection = { episodeId: 'episode_01', chapterId: 'chapter_01' };
  let view = { page: 'loading', entry: null, index: 0, error: '' };
  let requestSerial = 0;

  function snapshot() {
    return {
      ...view,
      selection: { ...selection },
      episodes,
      progress: {
        completed: [...progress.completed],
        bookmark: progress.bookmark ? { ...progress.bookmark } : null
      }
    };
  }

  function announce() {
    for (const listener of listeners) listener(snapshot());
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn('Justiris：本機進度無法儲存。', error);
    }
  }

  async function getJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`讀取失敗：HTTP ${response.status}`);
    return response.json();
  }

  function validDataPath(file) {
    const url = new URL(file, BASE);
    if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) {
      throw new Error('劇情檔案路徑超出資料目錄。');
    }
    return url;
  }

  function activeEpisode() {
    return episodes.find(ep => ep.id === selection.episodeId) || null;
  }

  function activeChapter() {
    return activeEpisode()?.chapters.find(ch => ch.id === selection.chapterId) || null;
  }

  function sectionKey(episodeId, chapterId, sectionId) {
    return `${episodeId}/${chapterId}/${sectionId}`;
  }

  async function initialize() {
    const params = new URLSearchParams(window.location.search);
    try {
      const data = await getJson(new URL('catalog.json', BASE));
      if (!Array.isArray(data.episodes) || data.episodes.length !== 6) {
        throw new Error('六集索引格式錯誤。');
      }
      episodes = data.episodes;
      const requestedEpisode = episodes.find(ep => ep.id === params.get('episode') && ep.revealed);
      const episode = requestedEpisode || episodes.find(ep => ep.revealed);
      if (!episode) throw new Error('目前沒有可瀏覽的集數。');
      const requestedChapter = episode.chapters.find(ch => ch.id === params.get('chapter'));
      const chapter = requestedChapter || episode.chapters[0];
      if (!chapter) throw new Error('該集尚未建立回目。');
      selection = { episodeId: episode.id, chapterId: chapter.id };
      view = { page: 'catalog', entry: null, index: 0, error: '' };
    } catch (error) {
      view = { page: 'error', entry: null, index: 0, error: error.message || String(error) };
      console.error('Justiris 劇情索引讀取失敗', error);
    }
    announce();
  }

  function selectChapter(chapterId) {
    const chapter = activeEpisode()?.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;
    ++requestSerial;
    selection.chapterId = chapter.id;
    view = { page: 'catalog', entry: null, index: 0, error: '' };
    const url = new URL(window.location.href);
    url.searchParams.set('chapter', chapter.id);
    history.replaceState(null, '', url);
    announce();
  }

  function openCatalog() {
    ++requestSerial;
    view = { page: 'catalog', entry: null, index: 0, error: '' };
    announce();
  }

  function remember() {
    if (view.page !== 'reader') return;
    const entry = view.entry;
    progress.bookmark = {
      episodeId: entry.episodeId,
      chapterId: entry.chapterId,
      sectionId: entry.sectionId,
      index: view.index
    };
    saveProgress();
  }

  async function openSection(sectionId, resume = false) {
    const episode = activeEpisode();
    const chapter = activeChapter();
    const section = chapter?.sections.find(item => item.id === sectionId);
    if (!episode || !chapter || !section || section.enabled !== true) return;

    const serial = ++requestSerial;
    view = { page: 'loading', entry: null, index: 0, error: '' };
    announce();

    try {
      const value = await getJson(validDataPath(section.file));
      if (serial !== requestSerial) return;
      if (value.id !== section.id || !Array.isArray(value.events) || value.events.length === 0) {
        throw new Error('該節尚未填入有效的正式劇情。');
      }

      const entry = {
        episodeId: episode.id,
        chapterId: chapter.id,
        sectionId: section.id,
        title: section.title,
        events: value.events
      };
      const bookmark = progress.bookmark;
      const matched = resume && bookmark &&
        bookmark.episodeId === entry.episodeId &&
        bookmark.chapterId === entry.chapterId &&
        bookmark.sectionId === entry.sectionId;
      const index = matched && Number.isInteger(bookmark.index)
        ? Math.min(Math.max(0, bookmark.index), value.events.length - 1)
        : 0;
      view = { page: 'reader', entry, index, error: '' };
      remember();
    } catch (error) {
      if (serial !== requestSerial) return;
      view = { page: 'error', entry: null, index: 0, error: error.message || String(error) };
      console.error('Justiris 小節載入失敗', error);
    }
    announce();
  }

  function currentEvent() {
    if (view.page !== 'reader') return null;
    return view.entry.events[view.index] || null;
  }

  function complete() {
    if (view.page !== 'reader') return;
    const entry = view.entry;
    const key = sectionKey(entry.episodeId, entry.chapterId, entry.sectionId);
    if (!progress.completed.includes(key)) progress.completed.push(key);
    progress.bookmark = null;
    saveProgress();
    view = { page: 'complete', entry, index: view.index, error: '' };
    announce();
  }

  function advance() {
    const event = currentEvent();
    if (!event || event.type === 'choice' || event.type === 'challenge') return;
    if (view.index + 1 >= view.entry.events.length) return complete();
    ++view.index;
    remember();
    announce();
  }

  function choose(index) {
    const event = currentEvent();
    if (!event || event.type !== 'choice' || !Array.isArray(event.options)) return;
    const option = event.options[index];
    if (!option) return;
    if (option.goto) {
      const next = view.entry.events.findIndex(item => item.id === option.goto);
      if (next === -1) {
        view.error = `找不到劇情事件 ID：${option.goto}`;
        announce();
        return;
      }
      view.index = next;
    } else if (view.index + 1 < view.entry.events.length) {
      ++view.index;
    } else {
      complete();
      return;
    }
    view.error = '';
    remember();
    announce();
  }

  function nextAvailable() {
    if (view.page !== 'complete') return null;
    const chapter = activeChapter();
    const position = chapter?.sections.findIndex(sec => sec.id === view.entry.sectionId) ?? -1;
    const next = chapter?.sections[position + 1];
    return next?.enabled === true ? next : null;
  }

  function resumeAvailable() {
    const bookmark = progress.bookmark;
    if (!bookmark) return null;
    const section = activeChapter()?.sections.find(s => s.id === bookmark.sectionId);
    return bookmark.episodeId === selection.episodeId &&
      bookmark.chapterId === selection.chapterId && section?.enabled === true
      ? section : null;
  }

  async function resume() {
    const section = resumeAvailable();
    if (section) await openSection(section.id, true);
  }

  window.JustirisStory = Object.freeze({
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    initialize,
    snapshot,
    activeEpisode,
    activeChapter,
    selectChapter,
    openSection,
    openCatalog,
    currentEvent,
    advance,
    choose,
    nextAvailable,
    resumeAvailable,
    resume
  });
})();

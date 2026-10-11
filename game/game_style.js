/**
 * Justiris 遊戲目錄 UI：集 → 回 → 節的前兩層。
 * 章回文字由 game.js 載入的 catalog.json 提供。
 * 每個「回」通往獨立的 story/ 目錄與播放器頁。
 */
(() => {
  'use strict';

  const catalog = document.getElementById('catalog');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const notice = document.getElementById('game-notice');
  let episodes = [];
  let selectedEpisode = -1;

  function button(label, onClick) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.addEventListener('click', onClick);
    return element;
  }

  function label(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function showEpisodes() {
    selectedEpisode = -1;
    render();
  }

  function openChapter(episode, chapter) {
    const url = new URL('./story/index.html', window.location.href);
    url.searchParams.set('episode', episode.id);
    url.searchParams.set('chapter', chapter.id);
    window.location.assign(url.href);
  }

  function render() {
    catalog.replaceChildren();
    breadcrumbs.replaceChildren();
    breadcrumbs.append(button('六集選擇', showEpisodes));

    if (selectedEpisode < 0) {
      const grid = label('div', 'catalog-grid', '');

      episodes.forEach((episode, index) => {
        const card = label('article', 'catalog-card', '');
        card.append(
          label('span', 'catalog-no', String(index + 1).padStart(2, '0')),
          label('small', '', episode.classic || '尚未公開'),
          label('h2', '', episode.title),
          label('p', '', episode.revealed
            ? '可查看正式回目與十節預留位置 · 尚無已開放關卡'
            : '尚未公開')
        );

        if (episode.revealed) {
          card.append(button('查看章回 →', () => {
            selectedEpisode = index;
            render();
          }));
        }
        grid.append(card);
      });

      catalog.append(grid);
      return;
    }

    const episode = episodes[selectedEpisode];
    const heading = label('div', 'catalog-heading', '');
    heading.append(
      label('p', '', `EPISODE ${String(selectedEpisode + 1).padStart(2, '0')} · ${episode.classic}`),
      label('h2', '', episode.title)
    );
    breadcrumbs.append(label('span', '', ' / ' + episode.title));
    catalog.append(heading);

    const list = label('div', 'chapter-list', '');
    episode.chapters.forEach(chapter => {
      const row = label('article', 'chapter-card', '');
      const details = label('div', 'chapter-details', '');
      details.append(
        label('h3', '', chapter.title),
        label('span', 'chapter-subnote', `預留 ${chapter.sections.length} 節 · 劇情待填入`)
      );
      row.append(details, button('查看十節 →', () => openChapter(episode, chapter)));
      list.append(row);
    });
    catalog.append(list);
  }

  async function init() {
    notice.textContent = '正在讀取六集章回目錄…';
    try {
      episodes = await window.JustirisCatalog.load();
      notice.textContent = '章回與節數資料已建立；尚未填入的劇情不可播放。';
      render();
    } catch (error) {
      console.error('Justiris 目錄載入失敗', error);
      notice.textContent = `目錄載入失敗：${error.message}。請由 GitHub Pages 或 HTTP 伺服器開啟網站。`;
    }
  }

  init();
})();

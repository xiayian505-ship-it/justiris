/** Justiris Story UI：目錄、播放畫面、讀取狀態；不包含劇情進度演算。 */
(() => {
  'use strict';

  const story = window.JustirisStory;
  const $ = id => document.getElementById(id);
  const screens = ['catalog-screen', 'reader-screen', 'status-screen'];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showScreen(id) {
    for (const name of screens) $(name).hidden = name !== id;
  }

  function renderBreadcrumbs(snapshot) {
    const nav = $('story-breadcrumbs');
    nav.replaceChildren();
    const parent = element('a', '', '六集目錄');
    parent.href = '../index.html';
    nav.append(parent);

    const episode = story.activeEpisode();
    const chapter = story.activeChapter();
    if (!episode || !chapter) return;

    nav.append(element('span', '', '/ ' + episode.title));
    if (snapshot.page === 'reader') {
      const back = element('button', '', chapter.title);
      back.type = 'button';
      back.addEventListener('click', story.openCatalog);
      nav.append(element('span', '', '/ '), back);
      nav.append(element('span', '', '/ ' + snapshot.entry.title));
    } else {
      nav.append(element('span', '', '/ ' + chapter.title));
    }
  }

  function renderCatalog(snapshot) {
    showScreen('catalog-screen');
    const episode = story.activeEpisode();
    const chapter = story.activeChapter();
    if (!episode || !chapter) return;

    $('episode-label').textContent = `EPISODE ${episode.id.slice(-2)} · ${episode.title}`;
    $('chapter-title').textContent = chapter.title;
    $('chapter-note').textContent = '本回先預留十節；尚未填入正式劇情的節不能播放。';

    const list = $('section-list');
    list.replaceChildren();
    for (const section of chapter.sections) {
      const active = section.enabled === true;
      const key = `${episode.id}/${chapter.id}/${section.id}`;
      const completed = snapshot.progress.completed.includes(key);
      const row = element('article', 'section-row');
      const info = element('div', 'section-info');
      info.append(
        element('h3', '', section.title),
        element('p', '', active ? (completed ? '已完成 · 可重新播放' : '已開放') : '尚未填入劇情')
      );
      const button = element('button', '', active ? '開始劇情 →' : '尚未開放');
      button.type = 'button';
      button.disabled = !active;
      if (active) button.addEventListener('click', () => story.openSection(section.id));
      row.append(info, button);
      list.append(row);
    }

    const resume = story.resumeAvailable();
    if (resume) {
      const row = element('article', 'section-row');
      row.append(element('p', '', `上次閱讀到：${resume.title}`));
      const button = element('button', '', '繼續閱讀 →');
      button.type = 'button';
      button.addEventListener('click', story.resume);
      row.append(button);
      list.prepend(row);
    }
  }

  function renderReader(snapshot) {
    showScreen('reader-screen');
    const event = story.currentEvent();
    if (!event) return;

    const speaker = $('speaker-name');
    const description = $('story-text');
    const choices = $('story-choices');
    const advance = $('advance-button');
    choices.replaceChildren();

    $('reader-heading').textContent = snapshot.entry.title;
    $('reader-progress-fill').style.width =
      `${((snapshot.index + 1) / snapshot.entry.events.length) * 100}%`;
    $('reading-position').textContent =
      `${snapshot.index + 1} / ${snapshot.entry.events.length}`;
    $('scene-heading').textContent = event.type === 'scene'
      ? (event.title || '場景') : snapshot.entry.title;

    const ordinary = ['scene', 'narration', 'text', 'dialogue'];
    advance.hidden = !ordinary.includes(event.type);
    $('reader-error').hidden = !snapshot.error;
    $('reader-error').textContent = snapshot.error || '';

    if (ordinary.includes(event.type)) {
      speaker.textContent = event.speaker || '';
      description.textContent = event.text || event.title || '';
    } else if (event.type === 'choice') {
      speaker.textContent = '';
      description.textContent = event.prompt || '請選擇。';
      for (const [index, option] of (event.options || []).entries()) {
        const choice = element('button', '', option.text || `選項 ${index + 1}`);
        choice.type = 'button';
        choice.addEventListener('click', () => story.choose(index));
        choices.append(choice);
      }
      if (!choices.children.length) {
        $('reader-error').textContent = '此選項事件尚未建立選項。';
        $('reader-error').hidden = false;
      }
    } else if (event.type === 'challenge') {
      speaker.textContent = '解謎關卡';
      description.textContent = '此處保留獨立遊戲關卡接口，玩法尚未連接。';
    } else {
      speaker.textContent = '未支援的事件';
      description.textContent = `未知的劇情事件類型：${String(event.type || '')}`;
    }
  }

  function renderStatus(snapshot) {
    showScreen('status-screen');
    const title = $('status-title');
    const description = $('status-description');
    const next = $('status-next');
    next.hidden = true;
    next.onclick = null;
    if (snapshot.page === 'loading') {
      title.textContent = '正在翻開卷宗';
      description.textContent = '請稍候，正在讀取劇情內容。';
    } else if (snapshot.page === 'error') {
      title.textContent = '卷宗暫時無法讀取';
      description.textContent = `${snapshot.error}。請使用 GitHub Pages 或本機 HTTP 伺服器開啟。`;
    } else {
      title.textContent = '本節已完成';
      description.textContent = '可以返回節目錄，或進入下一個已開放的小節。';
      const upcoming = story.nextAvailable();
      if (upcoming) {
        next.hidden = false;
        next.onclick = () => story.openSection(upcoming.id);
      }
    }
  }

  let previousPage = null;
  function render(snapshot) {
    if (snapshot.page === 'catalog') renderCatalog(snapshot);
    else if (snapshot.page === 'reader') renderReader(snapshot);
    else renderStatus(snapshot);
    renderBreadcrumbs(snapshot);
    if (previousPage !== snapshot.page) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      previousPage = snapshot.page;
    }
  }

  $('return-sections').addEventListener('click', story.openCatalog);
  $('status-return').addEventListener('click', story.openCatalog);
  $('advance-button').addEventListener('click', story.advance);

  $('dialogue-panel').addEventListener('click', event => {
    if (event.target.closest('button')) return;
    const current = story.currentEvent();
    if (current && !['choice', 'challenge'].includes(current.type)) story.advance();
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (story.snapshot().page === 'reader') story.openCatalog();
  });

  story.subscribe(render);
  story.initialize();
})();

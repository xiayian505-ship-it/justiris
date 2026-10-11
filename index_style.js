/*
 * 首頁 UI：卷宗展開與收合
 * 一次只展開一份卷宗。故事文案從 index.js 讀取。
 */
(() => {
  const root = document.querySelector('#episode-list');

  if (!root) {
    return;
  }

  let active = -1;

  // 避免在 innerHTML 中插入未跳脫的標題文字。
  const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));

  function render() {
    root.innerHTML = '';

    // 第五、六集尚未公開，使用 null 表示封存卡片。
    const episodes = [...window.JUSTIRIS_EPISODES, null, null];

    episodes.forEach((item, index) => {
      const article = document.createElement('article');
      const isOpen = active === index;
      const number = String(index + 1).padStart(2, '0');

      article.className = 'episode-card'
        + (item ? '' : ' sealed')
        + (isOpen ? ' is-open' : '');

      if (item) {
        const heading = document.createElement('h3');
        heading.innerHTML = `
          <button
            class="episode-trigger"
            type="button"
            aria-expanded="${isOpen}"
            aria-controls="episode-copy-${number}"
          >
            <span class="episode-no">${number}</span>
            <span class="episode-title">
              <small>${escapeHtml(item.classic)} · EPISODE ${number}</small>
              <strong>${escapeHtml(item.title)}</strong>
            </span>
            <span class="episode-indicator" aria-hidden="true">${isOpen ? '−' : '+'}</span>
          </button>
        `;
        article.append(heading);

        const content = document.createElement('div');
        content.className = 'episode-copy';
        content.id = `episode-copy-${number}`;
        content.hidden = !isOpen;

        const paragraph = document.createElement('p');
        paragraph.textContent = item.copy;
        content.append(paragraph);
        article.append(content);

        article.querySelector('button').addEventListener('click', () => {
          active = isOpen ? -1 : index;
          render();
        });
      } else {
        article.innerHTML = `
          <div class="episode-locked">
            <span class="episode-no">${number}</span>
            <span class="episode-title">
              <small>EPISODE ${number}</small>
              <strong>？？</strong>
            </span>
            <span class="sealed-label">尚未公開</span>
          </div>
        `;
      }

      root.append(article);
    });
  }

  render();
})();

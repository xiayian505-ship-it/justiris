/*
 * 遊戲目錄 UI
 * 目前只有「集 → 回」可瀏覽，不虛構尚未定案的節與關卡。
 */
(() => {
  const catalog = document.getElementById('catalog');
  const breadcrumbs = document.getElementById('breadcrumbs');
  let selectedEpisode = -1;

  function createButton(label, onClick) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function render() {
    catalog.replaceChildren();
    breadcrumbs.replaceChildren();

    breadcrumbs.append(createButton('六集選擇', () => {
      selectedEpisode = -1;
      render();
    }));

    if (selectedEpisode < 0) {
      const list = document.createElement('div');
      list.className = 'catalog-grid';

      GAME_CATALOG.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'catalog-card';

        const number = document.createElement('span');
        number.className = 'catalog-no';
        number.textContent = String(index + 1).padStart(2, '0');
        card.append(number);

        const classic = document.createElement('small');
        classic.textContent = item.classic || '尚未公開';
        card.append(classic);

        const title = document.createElement('h2');
        title.textContent = item.title;
        card.append(title);

        const status = document.createElement('p');
        status.textContent = index < 4
          ? '章回目錄可閱覽 · 遊戲製作中'
          : '尚未公開';
        card.append(status);

        if (index < 4) {
          card.append(createButton('查看章回 →', () => {
            selectedEpisode = index;
            render();
          }));
        }

        list.append(card);
      });

      catalog.append(list);
      return;
    }

    const data = GAME_CATALOG[selectedEpisode];
    const heading = document.createElement('div');
    heading.className = 'catalog-heading';

    const caption = document.createElement('p');
    caption.textContent = `EPISODE ${String(selectedEpisode + 1).padStart(2, '0')} · ${data.classic}`;

    const title = document.createElement('h2');
    title.textContent = data.title;
    heading.append(caption, title);
    catalog.append(heading);

    breadcrumbs.append(document.createTextNode(' / ' + data.title));

    const list = document.createElement('div');
    list.className = 'chapter-list';

    data.chapters.forEach((chapter) => {
      const row = document.createElement('article');
      row.className = 'chapter-card';

      const name = document.createElement('h3');
      name.textContent = chapter;

      const note = document.createElement('span');
      note.textContent = '節數與關卡待製作';

      row.append(name, note);
      list.append(row);
    });

    catalog.append(list);

    if (!data.chapters.length) {
      const message = document.createElement('p');
      message.textContent = '章回資料尚未提供。';
      catalog.append(message);
    }
  }

  render();
})();

export type Status = "fixed" | "open";
export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: number;
  title: string;
  where: string;
  severity: Severity;
  status: Status;
  problem: string;
  fix: string;
  impact: string;
  before?: string;
  after?: string;
}

export const findings: Finding[] = [
  {
    id: 1,
    title: "insert() копирует весь массив данных",
    where: "DataStore.insert",
    severity: "high",
    status: "fixed",
    problem:
      "Каждый вызов делает slice().concat() для records и ids: O(n) на вставку и O(n²) на цикл одиночных вставок.",
    fix: "Вставка в конец делает push, в середину — splice (для списков > 10 000 остаётся прежний путь из-за лимита аргументов).",
    impact: "1000 вставок в конец на 50k записей: 1123 мс → 12,5 мс (90×).",
    before:
      "this.records = this.records.slice(0, at)\n  .concat(list, this.records.slice(at));\nthis.ids = this.ids.slice(0, at)\n  .concat(newIds, this.ids.slice(at));",
    after:
      "if (at === this.records.length) {\n  for (let k = 0; k < list.length; k++) {\n    this.records.push(list[k]);\n    this.ids.push(newIds[k]);\n  }\n} else if (list.length <= 10000) {\n  this.records.splice(at, 0, ...list);\n  this.ids.splice(at, 0, ...newIds);\n}",
  },
  {
    id: 2,
    title: "remove() пересобирает всё",
    where: "DataStore.remove",
    severity: "high",
    status: "fixed",
    problem:
      "Сканирует весь массив, создаёт новые массивы и новую Map, затем переиндексирует с нуля.",
    fix: "Первая позиция находится через Map id→index; массивы уплотняются на месте, начиная с неё; Map обновляется только для сдвинутых элементов.",
    impact: "Удаление 1 карточки около конца сетки 100k: 23,6 мс → 1,04 мс (23×).",
    before:
      "for (let i = 0; i < this.ids.length; i++) {\n  if (kill.has(this.ids[i])) removed.push(...);\n  else { records.push(...); ids.push(...); }\n}\nthis.index = new Map();\nthis.reindex(0);",
    after:
      "for (const id of kill) first = Math.min(first, this.index.get(id));\nfor (let i = first; i < n; i++) {\n  if (kill.has(ids[i])) { removed.push(...); this.index.delete(id); }\n  else { records[w] = records[i]; ids[w] = id;\n         this.index.set(id, w); w++; }\n}\nrecords.length = ids.length = w;",
  },
  {
    id: 3,
    title: "Пространственный индекс перестраивается целиком",
    where: "GeometryStore.buildIndex",
    severity: "medium",
    status: "fixed",
    problem:
      "После каждого layout индекс строится заново для всех n карточек, хотя раскладка пересчитала только хвост.",
    fix: "set() записывает только реально изменившиеся прямоугольники и помнит минимальный изменённый слот. buildIndex отрезает хвост ≥ from у каждой корзины и добавляет только изменённое. Есть безопасный откат на полную перестройку.",
    impact: "Добавление 50 карточек в сетку 100k: 6,41 мс → 1,10 мс (5,8×).",
  },
  {
    id: 4,
    title: "Принудительный reflow в каждом кадре",
    where: "GridInstance.updateViewport",
    severity: "high",
    status: "fixed",
    problem:
      "scrollTop/scrollLeft читались ПОСЛЕ того, как sync() изменил DOM. Чтение геометрии после записи стилей заставляет браузер выполнить layout синхронно внутри rAF-кадра.",
    fix: "Используются значения, уже прочитанные в viewMetrics() до записи в DOM. Событие scroll не изменилось.",
    impact:
      "Было 40 чтений после записи на 40 кадров, стало 0. Выигрыш виден только в браузере; в jsdom доказан детерминированным тестом.",
    before:
      "const top = this.root.scrollTop,\n      left = this.root.scrollLeft;   // после sync()",
    after:
      "const horiz = this.layoutMgr.axis === 'x';\nconst top  = horiz ? m.sCross : m.sMain,\n      left = horiz ? m.sMain  : m.sCross;",
  },
  {
    id: 5,
    title: "clearTimeout + setTimeout на каждое scroll-событие",
    where: "GridInstance.onScroll",
    severity: "medium",
    status: "fixed",
    problem:
      "Таймер для scroll:stop пересоздаётся на каждое событие скролла (замыкание, операции с Set, работа таймерной очереди).",
    fix: "Хранится метка последнего скролла и один таймер, который при срабатывании перезапускается на остаток времени. scroll:stop приходит через те же 140 мс тишины.",
    impact: "1000 таймеров → 0,33 на 1000 scroll-кадров.",
  },
  {
    id: 6,
    title: "sync() аллоцирует Set и копию ключей на каждом кадре",
    where: "DOMRenderer.sync",
    severity: "low",
    status: "fixed",
    problem:
      "На каждый кадр скролла строится Set нужных id и копия [...mounted.keys()].",
    fix: "Штампы поколений на записях; Map обходится только если там есть что убрать.",
    impact: "Меньше аллокаций и GC. Сам код занимает ≈ 8 мкс на кадр, поэтому в микросекундах выигрыш не заметен.",
  },
  {
    id: 7,
    title: "matchMedia() на каждый layout",
    where: "AnimationManager.enabled",
    severity: "low",
    status: "fixed",
    problem: "Новый MediaQueryList создаётся при каждом проходе раскладки.",
    fix: "Один живой MediaQueryList на окно; при подмене window.matchMedia создаётся заново.",
    impact: "100 вызовов → 1 на 100 анимированных вставок.",
  },
  {
    id: 8,
    title: "Мелочи на горячих путях",
    where: "Masonry/Grid, Virtualization, emit(), drag",
    severity: "low",
    status: "fixed",
    problem:
      "Объект {height, aspectRatio} на каждую карточку; Array#includes для pinned; новый массив в каждом visible(); emit() собирает массив групп без слушателей; два getBoundingClientRect() на каждый pointermove при drag.",
    fix: "Одна структура на проход; бинарный поиск; буфер для visible(); ранний выход в emit(); одно чтение rect на pointermove.",
    impact: "Небольшое. Основной эффект — меньше аллокаций.",
  },
  {
    id: 9,
    title: "selection: O(selected) на каждый клик",
    where: "plugins/selection",
    severity: "medium",
    status: "fixed",
    problem:
      "select()/deselect() копируют всё выделение и сравнивают его целиком.",
    fix: "Применяется дельта из одного id; события и порядок selected те же.",
    impact: "40k выделенных, select+deselect одной карточки: 14,2 мс → 0,46 мс (31×).",
  },
  {
    id: 10,
    title: "reveal: два rAF на каждую карточку",
    where: "plugins/reveal",
    severity: "medium",
    status: "fixed",
    problem:
      "На каждую смонтированную карточку регистрируются 2 вложенных requestAnimationFrame.",
    fix: "Одна пара кадров на пачку карточек. Карточки, смонтированные позже, образуют новую пачку, поэтому скрытое состояние по-прежнему успевает отрисоваться.",
    impact: "8132 → 202 rAF-регистрации на 200 кадров быстрого скролла (40×).",
  },
  {
    id: 11,
    title: "Композитный слой на каждую карточку",
    where: "abi7-grid.css, DOMRenderer._place",
    severity: "medium",
    status: "open",
    problem:
      "will-change: transform и translate3d(x,y,0) на каждой карточке заставляют браузер выделять отдельный слой для каждой смонтированной карточки (сотни при большом overscan).",
    fix: "Не менял: translate3d и will-change описаны в документации как контракт, а эффект зависит от браузера и GPU. Рекомендация: 2D translate(), а will-change только под .abi7-animating и .abi7-dragging; сравнить в DevTools Layers.",
    impact: "Потенциально заметно на мобильных и слабых GPU. В песочнице не измерить.",
  },
];

export interface Bench {
  name: string;
  before: number;
  after: number;
  unit: string;
  note?: string;
}

export const benches: Bench[] = [
  { name: "1000 одиночных insert() в конец, 50k записей", before: 1123, after: 12.5, unit: "мс" },
  { name: "Удаление 1 карточки около конца, сетка 100k", before: 23.6, after: 1.04, unit: "мс" },
  { name: "Добавление 50 карточек в сетку 100k", before: 6.41, after: 1.1, unit: "мс" },
  { name: "Добавление 1 карточки в сетку 30k", before: 1.8, after: 0.65, unit: "мс" },
  { name: "selection: select+deselect при 40k выделенных", before: 14.2, after: 0.46, unit: "мс" },
  { name: "reveal: rAF-регистраций на 200 кадров скролла", before: 8132, after: 202, unit: "шт" },
  { name: "Таймеров на 1000 scroll-кадров", before: 1000, after: 0.33, unit: "шт" },
  { name: "matchMedia на 100 анимированных вставок", before: 100, after: 1, unit: "шт" },
];

export const unchanged = [
  { name: "Первая раскладка 100k (Masonry)", before: "33,2 мс", after: "30,8 мс" },
  { name: "Полный relayout 100k: masonry / grid / justified", before: "11,0 / 5,8 / 12,3 мс", after: "11,0 / 5,5 / 12,4 мс" },
  { name: "JS-стоимость одного scroll-кадра в jsdom (4 сценария)", before: "56 / 71 / 133 / 156 мкс", after: "51 / 64 / 143 / 157 мкс" },
];

export const verification = [
  {
    title: "164 существующих теста",
    text: "Проходят и на src, и на минифицированной сборке. Валидация репозитория (сборка, tools/check.js, все тесты) проходит: 210/210.",
  },
  {
    title: "46 новых проверок (23 × src и min)",
    text: "Модель на обычном массиве для insert/remove/move. Запросы окна и hit-test против перебора для 4 раскладок после случайных правок. Кастомная раскладка с переполнением размера. События scroll, scroll:stop, item:visible/hidden, pinned, drag, selection, reveal.",
  },
  {
    title: "Тесты проверены на оригинальном коде",
    text: "Против оригинала все тесты поведения проходят, то есть поведение идентично. 5 тестов на производительность падают по ожидаемым причинам: 400 таймеров на 400 событий, 40 чтений scrollTop после записи, 20 вызовов matchMedia, 2 чтения rect на pointermove, 15 rAF на 14 карточек.",
  },
  {
    title: "Мутационная проверка",
    text: "Если сломать инкрементальный индекс (убрать dirty-трекинг или защиту от переполнения), тесты падают. Первая версия теста переполнения ошибку не ловила, я его усилил.",
  },
  {
    title: "25 дополнительных сидов",
    text: "FUZZ_SEED=1..25 × 14 тестов индекса и данных: без падений.",
  },
  {
    title: "Архив проверен на чистом клоне",
    text: "Распаковал поверх свежего клона репозитория: tools/check.js проходит, тесты 210/210.",
  },
];

export const archiveFiles = [
  { path: "src/abi7-grid.js", kind: "изменён" },
  { path: "plugins/selection/selection.js", kind: "изменён" },
  { path: "plugins/reveal/reveal.js", kind: "изменён" },
  { path: "dist/abi7-grid.js", kind: "пересобран" },
  { path: "dist/abi7-grid.min.js", kind: "пересобран" },
  { path: "dist/abi7-grid.min.js.map", kind: "пересобран" },
  { path: "CHANGELOG.md", kind: "изменён" },
  { path: "docs/PERFORMANCE-REVIEW.md", kind: "новый" },
  { path: "tests/perf.test.js", kind: "новый" },
  { path: "bench/bench.mjs", kind: "новый" },
  { path: "bench/compare.mjs", kind: "новый" },
  { path: "perf-fixes.patch", kind: "новый" },
];

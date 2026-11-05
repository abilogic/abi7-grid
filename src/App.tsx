import { useMemo, useState } from "react";
import patchText from "./assets/perf-fixes.patch?raw";
import reportText from "./assets/PERFORMANCE-REVIEW.md?raw";
import { zipBase64 } from "./assets/zipPayload";
import { base64ToBlobUrl, textToBlobUrl } from "./utils/download";
import {
  archiveFiles,
  benches,
  findings,
  unchanged,
  verification,
  type Finding,
  type Severity,
} from "./data/report";

const fmt = (n: number) =>
  n >= 100
    ? Math.round(n).toLocaleString("ru-RU")
    : n >= 10
      ? n.toFixed(1).replace(".", ",")
      : n.toFixed(2).replace(".", ",");

const sevStyle: Record<Severity, string> = {
  high: "bg-rose-100 text-rose-700 ring-rose-200",
  medium: "bg-amber-100 text-amber-800 ring-amber-200",
  low: "bg-slate-100 text-slate-600 ring-slate-200",
};
const sevLabel: Record<Severity, string> = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
};

function DownloadButton({
  href,
  file,
  title,
  sub,
  primary,
}: {
  href: string;
  file: string;
  title: string;
  sub: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      download={file}
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
        primary
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500"
          : "bg-white text-slate-800 ring-1 ring-slate-200 hover:ring-indigo-300"
      }`}
    >
      <svg
        className={`h-6 w-6 shrink-0 ${primary ? "text-indigo-100" : "text-indigo-500"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v12" />
        <path d="m7 11 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      <span>
        <span className="block text-sm font-semibold leading-tight">{title}</span>
        <span className={`block text-xs ${primary ? "text-indigo-100" : "text-slate-500"}`}>{sub}</span>
      </span>
    </a>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function SectionTitle({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-indigo-500">{n}</div>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {sub && <p className="mt-1 max-w-3xl text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

function Code({ children, tone }: { children: string; tone: "bad" | "good" }) {
  return (
    <pre
      className={`overflow-x-auto rounded-lg p-3 text-xs leading-relaxed ${
        tone === "bad" ? "bg-rose-50 text-rose-900 ring-1 ring-rose-100" : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
      }`}
    >
      <code>{children}</code>
    </pre>
  );
}

function FindingRow({ f }: { f: Finding }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl bg-white ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {f.id}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-slate-900">{f.title}</span>
          <span className="mt-0.5 block truncate font-mono text-xs text-slate-500">{f.where}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${sevStyle[f.severity]}`}>
              Важность: {sevLabel[f.severity].toLowerCase()}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                f.status === "fixed" ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-violet-100 text-violet-700 ring-violet-200"
              }`}
            >
              {f.status === "fixed" ? "Исправлено" : "Нужно ваше решение"}
            </span>
          </span>
        </span>
        <svg
          className={`mt-1 h-5 w-5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Проблема. </span>
            {f.problem}
          </p>
          <p>
            <span className="font-semibold text-slate-900">{f.status === "fixed" ? "Исправление. " : "Рекомендация. "}</span>
            {f.fix}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Эффект. </span>
            {f.impact}
          </p>
          {f.before && f.after && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-600">Было</div>
                <Code tone="bad">{f.before}</Code>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">Стало</div>
                <Code tone="good">{f.after}</Code>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function App() {
  const [filter, setFilter] = useState<"all" | "fixed" | "open">("all");
  const zipUri = useMemo(() => base64ToBlobUrl(zipBase64, "application/zip"), []);
  const patchUri = useMemo(() => textToBlobUrl(patchText), []);
  const reportUri = useMemo(() => textToBlobUrl(reportText, "text/markdown;charset=utf-8"), []);
  const list = useMemo(() => findings.filter((f) => filter === "all" || f.status === filter), [filter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 py-10 md:py-14">
          <a
            href="https://github.com/abilogic/abi7-grid"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            abilogic/abi7-grid · коммит bcc3a82 · v1.0.0
          </a>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Аудит производительности ABI7 Grid
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
            Прочитал ядро (2755 строк), CSS и 7 плагинов. Нашёл 11 проблем, 10 исправил. Публичный API и поведение не
            менялись, а исправления подтверждены тестами и замерами до/после.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value="11" label="проблем найдено" />
            <Stat value="10" label="исправлено в коде" />
            <Stat value="210 / 210" label="тестов проходит (164 старых + 46 новых)" />
            <Stat value="90×" label="лучший результат: массовые insert()" />
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <DownloadButton
              primary
              href={zipUri}
              file="abi7-grid-perf-fixes.zip"
              title="Архив исправленных файлов"
              sub="ZIP, 12 файлов, пути как в репозитории"
            />
            <DownloadButton href={patchUri} file="perf-fixes.patch" title="Патч (git apply)" sub="src, plugins, CHANGELOG" />
            <DownloadButton href={reportUri} file="PERFORMANCE-REVIEW.md" title="Отчёт в Markdown" sub="docs/PERFORMANCE-REVIEW.md" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-5 py-12">
        {/* Summary */}
        <section>
          <SectionTitle n="01 · Вывод" title="Ядро в целом написано хорошо" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-900">Что уже сделано правильно</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>Геометрия в типизированных массивах и пространственный индекс по корзинам.</li>
                <li>DOM-пул и виртуализация; все изменения в одном requestAnimationFrame.</li>
                <li>Частичный пересчёт раскладки с чекпоинтами.</li>
                <li>Собственный JS на scroll-кадр уже мал: sync ≈ 8 мкс, query ≈ 5 мкс.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-900">Где были потери</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>Изменение данных: insert/remove стоили O(n), индекс строился заново целиком.</li>
                <li>Накладные расходы каждого кадра: принудительный reflow, таймер на каждое scroll-событие.</li>
                <li>Плагины: selection и reveal делали работу, пропорциональную всему выделению или каждой карточке.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Benchmarks */}
        <section>
          <SectionTitle
            n="02 · Замеры"
            title="До и после"
            sub="Node v20.20.2, 2 vCPU Xeon 2,6 ГГц, jsdom; медиана 5 запусков. jsdom не умеет layout и paint, поэтому измеряется JS-стоимость библиотеки."
          />
          <div className="space-y-3">
            {benches.map((b) => {
              const pct = Math.max(1.5, (b.after / b.before) * 100);
              const x = b.before / b.after;
              return (
                <div key={b.name} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-slate-800">{b.name}</div>
                    <div className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {x >= 100 ? Math.round(x).toLocaleString("ru-RU") : x.toFixed(1).replace(".", ",")}× меньше
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="w-14 shrink-0 text-xs text-slate-500">до</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-rose-400" style={{ width: "100%" }} />
                      </div>
                      <span className="w-24 shrink-0 text-right font-mono text-xs text-slate-700">
                        {fmt(b.before)} {b.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-14 shrink-0 text-xs text-slate-500">после</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-24 shrink-0 text-right font-mono text-xs text-slate-700">
                        {fmt(b.after)} {b.unit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              Что не изменилось (и почему так честно)
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Сценарий</th>
                  <th className="px-4 py-2 font-medium">До</th>
                  <th className="px-4 py-2 font-medium">После</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unchanged.map((u) => (
                  <tr key={u.name}>
                    <td className="px-4 py-2 text-slate-700">{u.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{u.before}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{u.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <span className="font-semibold">Ограничение методики. </span>
            Скорость одного scroll-кадра в jsdom не изменилась: собственный JS библиотеки там занимает единицы
            микросекунд, остальное — jsdom и GC. Исправления №4–6 убирают структурные издержки (принудительный reflow,
            лишние таймеры и аллокации). Их эффект нужно подтвердить в Chrome DevTools Performance; для №4 есть
            детерминированный тест: чтений scrollTop после записи в DOM было 40 на 40 кадров, стало 0.
          </div>
        </section>

        {/* Findings */}
        <section>
          <SectionTitle n="03 · Находки" title="Что нашёл и что сделал" sub="Нажмите на пункт, чтобы увидеть проблему, исправление и эффект." />
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Фильтр находок">
            {(
              [
                ["all", `Все (${findings.length})`],
                ["fixed", `Исправлено (${findings.filter((f) => f.status === "fixed").length})`],
                ["open", `Нужно решение (${findings.filter((f) => f.status === "open").length})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={filter === k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  filter === k ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            {list.map((f) => (
              <FindingRow key={f.id} f={f} />
            ))}
          </ul>

          <div className="mt-6 rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-900">Ещё не исправлено</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>
                <span className="font-medium text-slate-800">pointermove при drag не склеивается по кадрам</span> (приоритет
                низкий). Chrome обычно сам выравнивает событие по кадру, поэтому реальный выигрыш зависит от браузера, и я его не
                измерял. Склейка по rAF меняет момент drag:move, а тесты и документация ожидают синхронности.
              </li>
              <li>
                <span className="font-medium text-slate-800">Мелкие наблюдения:</span> selection отдаёт в событии копию selected;
                toggleClass хранит Set на каждый id; _applyLoaded перепривязывает карточки, которые затем размонтируются.
              </li>
            </ul>
          </div>
        </section>

        {/* Verification */}
        <section>
          <SectionTitle n="04 · Проверка" title="Как я убедился, что всё работает" />
          <div className="grid gap-4 md:grid-cols-2">
            {verification.map((v) => (
              <div key={v.title} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{v.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{v.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Archive */}
        <section>
          <SectionTitle n="05 · Архив" title="Состав архива и как применить" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {archiveFiles.map((f) => (
                    <tr key={f.path}>
                      <td className="px-4 py-2 font-mono text-xs text-slate-700">{f.path}</td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            f.kind === "новый" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {f.kind}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Применить</div>
                <pre className="overflow-x-auto text-xs leading-relaxed">
                  <code>{`# вариант 1: распаковать поверх репозитория
unzip -o abi7-grid-perf-fixes.zip
cp -r abi7-grid-perf-fixes/* .

# вариант 2: патч (потом пересобрать dist)
git apply perf-fixes.patch
npm run build:lib

# проверка
npm run validate        # ожидается 210/210
node bench/bench.mjs    # бенчмарк`}</code>
                </pre>
              </div>
              <p className="text-sm text-slate-500">
                dist/ пересобран штатным <span className="font-mono text-xs">npm run build:lib</span>; tools/check.js
                подтверждает, что минифицированные файлы воспроизводимы. Размер min-файла: 61 031 → 62 622 байт (+2,6%).
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-6 text-xs text-slate-500">
          ABI7 Grid распространяется по лицензии Community (бесплатно только для некоммерческого использования). Изменения в
          архиве сделаны для ревью и не меняют лицензионные заголовки.
        </div>
      </footer>
    </div>
  );
}

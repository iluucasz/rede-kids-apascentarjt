"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, Plus, Trash2, X } from "lucide-react";

const BIBLE_BOOK_SOURCE_URL =
  "https://raw.githubusercontent.com/unfoldingWord/content-validation-rcl/master/src/core/books/books.js";

const BOOK_LABELS: Record<string, { name: string; abbreviation: string }> = {
  GEN: { name: "Gênesis", abbreviation: "Gn" },
  EXO: { name: "Êxodo", abbreviation: "Êx" },
  LEV: { name: "Levítico", abbreviation: "Lv" },
  NUM: { name: "Números", abbreviation: "Nm" },
  DEU: { name: "Deuteronômio", abbreviation: "Dt" },
  JOS: { name: "Josué", abbreviation: "Js" },
  JDG: { name: "Juízes", abbreviation: "Jz" },
  RUT: { name: "Rute", abbreviation: "Rt" },
  "1SA": { name: "1 Samuel", abbreviation: "1Sm" },
  "2SA": { name: "2 Samuel", abbreviation: "2Sm" },
  "1KI": { name: "1 Reis", abbreviation: "1Rs" },
  "2KI": { name: "2 Reis", abbreviation: "2Rs" },
  "1CH": { name: "1 Crônicas", abbreviation: "1Cr" },
  "2CH": { name: "2 Crônicas", abbreviation: "2Cr" },
  EZR: { name: "Esdras", abbreviation: "Ed" },
  NEH: { name: "Neemias", abbreviation: "Ne" },
  EST: { name: "Ester", abbreviation: "Et" },
  JOB: { name: "Jó", abbreviation: "Jó" },
  PSA: { name: "Salmos", abbreviation: "Sl" },
  PRO: { name: "Provérbios", abbreviation: "Pv" },
  ECC: { name: "Eclesiastes", abbreviation: "Ec" },
  SNG: { name: "Cânticos", abbreviation: "Ct" },
  ISA: { name: "Isaías", abbreviation: "Is" },
  JER: { name: "Jeremias", abbreviation: "Jr" },
  LAM: { name: "Lamentações", abbreviation: "Lm" },
  EZK: { name: "Ezequiel", abbreviation: "Ez" },
  DAN: { name: "Daniel", abbreviation: "Dn" },
  HOS: { name: "Oséias", abbreviation: "Os" },
  JOL: { name: "Joel", abbreviation: "Jl" },
  AMO: { name: "Amós", abbreviation: "Am" },
  OBA: { name: "Obadias", abbreviation: "Ob" },
  JON: { name: "Jonas", abbreviation: "Jn" },
  MIC: { name: "Miqueias", abbreviation: "Mq" },
  NAM: { name: "Naum", abbreviation: "Na" },
  HAB: { name: "Habacuque", abbreviation: "Hc" },
  ZEP: { name: "Sofonias", abbreviation: "Sf" },
  HAG: { name: "Ageu", abbreviation: "Ag" },
  ZEC: { name: "Zacarias", abbreviation: "Zc" },
  MAL: { name: "Malaquias", abbreviation: "Ml" },
  MAT: { name: "Mateus", abbreviation: "Mt" },
  MRK: { name: "Marcos", abbreviation: "Mc" },
  LUK: { name: "Lucas", abbreviation: "Lc" },
  JHN: { name: "João", abbreviation: "Jo" },
  ACT: { name: "Atos", abbreviation: "At" },
  ROM: { name: "Romanos", abbreviation: "Rm" },
  "1CO": { name: "1 Coríntios", abbreviation: "1Co" },
  "2CO": { name: "2 Coríntios", abbreviation: "2Co" },
  GAL: { name: "Gálatas", abbreviation: "Gl" },
  EPH: { name: "Efésios", abbreviation: "Ef" },
  PHP: { name: "Filipenses", abbreviation: "Fp" },
  COL: { name: "Colossenses", abbreviation: "Cl" },
  "1TH": { name: "1 Tessalonicenses", abbreviation: "1Ts" },
  "2TH": { name: "2 Tessalonicenses", abbreviation: "2Ts" },
  "1TI": { name: "1 Timóteo", abbreviation: "1Tm" },
  "2TI": { name: "2 Timóteo", abbreviation: "2Tm" },
  TIT: { name: "Tito", abbreviation: "Tt" },
  PHM: { name: "Filemom", abbreviation: "Fm" },
  HEB: { name: "Hebreus", abbreviation: "Hb" },
  JAS: { name: "Tiago", abbreviation: "Tg" },
  "1PE": { name: "1 Pedro", abbreviation: "1Pe" },
  "2PE": { name: "2 Pedro", abbreviation: "2Pe" },
  "1JN": { name: "1 João", abbreviation: "1Jo" },
  "2JN": { name: "2 João", abbreviation: "2Jo" },
  "3JN": { name: "3 João", abbreviation: "3Jo" },
  JUD: { name: "Judas", abbreviation: "Jd" },
  REV: { name: "Apocalipse", abbreviation: "Ap" },
};

const BOOK_DATA_PATTERN =
  /'([A-Z0-9]+)':\s*\{\s*'title':\s*'([^']+)'[\s\S]*?'verseList':\s*\[([\d,\s]+)\]/g;

let bibleBooksPromise: Promise<ScriptureBook[]> | null = null;

type ScriptureBook = {
  id: string;
  name: string;
  abbreviation: string;
  chapters: number[];
};

export function ScriptureReferenceField({
  label,
  name,
  defaultValue = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  const [references, setReferences] = useState<string[]>(() =>
    parseScriptureReferences(defaultValue),
  );
  const [books, setBooks] = useState<ScriptureBook[]>([]);
  const [isMiniModalOpen, setIsMiniModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [bookId, setBookId] = useState("");
  const [chapter, setChapter] = useState(1);
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(1);

  useEffect(() => {
    if (!isMiniModalOpen || books.length || isLoading) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts the async book load when the picker opens.
    setIsLoading(true);
    setLoadError("");

    getBibleBooks()
      .then((loadedBooks) => {
        setBooks(loadedBooks);
        if (!loadedBooks.length) return;

        setBookId((current) => current || loadedBooks[0].id);
      })
      .catch(() => {
        setLoadError("Não foi possível carregar a lista da Bíblia agora.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [books.length, isLoading, isMiniModalOpen]);

  const selectedBook = useMemo(
    () => books.find((item) => item.id === bookId) ?? null,
    [bookId, books],
  );

  const chapterCount = selectedBook?.chapters.length ?? 0;
  const verseCount = selectedBook?.chapters[Math.max(chapter - 1, 0)] ?? 0;

  useEffect(() => {
    if (!selectedBook) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamps the selected chapter after changing books.
    setChapter((current) => clampNumber(current, 1, selectedBook.chapters.length));
  }, [selectedBook]);

  useEffect(() => {
    if (!verseCount) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamps verse controls after changing chapters.
    setStartVerse((current) => clampNumber(current, 1, verseCount));
    setEndVerse((current) => clampNumber(current, 1, verseCount));
  }, [verseCount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the final verse after the initial verse.
    setEndVerse((current) => Math.max(current, startVerse));
  }, [startVerse]);

  const endVerseOptions = useMemo(
    () => buildNumberOptions(Math.max(startVerse, 1), verseCount),
    [startVerse, verseCount],
  );

  function openMiniModal() {
    setIsMiniModalOpen(true);
  }

  function closeMiniModal() {
    setIsMiniModalOpen(false);
  }

  function addReference() {
    if (!selectedBook || !chapter || !startVerse) return;

    const reference = formatReference(
      selectedBook.abbreviation,
      chapter,
      startVerse,
      Math.max(startVerse, endVerse),
    );

    setReferences((current) =>
      current.includes(reference) ? current : [...current, reference],
    );
    closeMiniModal();
  }

  function removeReference(reference: string) {
    setReferences((current) => current.filter((item) => item !== reference));
  }

  return (
    <div className="grid gap-2 text-sm font-semibold text-zinc-700">
      <span>{label}</span>
      <input type="hidden" name={name} value={references.join("\n")} />

      <button
        type="button"
        onClick={openMiniModal}
        className="flex min-h-11 items-center justify-between rounded-lg border border-zinc-300 px-3 text-left text-sm font-normal text-zinc-700 outline-none transition hover:border-emerald-500 focus:border-emerald-600"
      >
        <span className={references.length ? "text-zinc-900" : "text-zinc-500"}>
          {references.length
            ? `${references.length} texto(s) bíblico(s) selecionado(s)`
            : "Selecionar textos bíblicos"}
        </span>
        <span className="inline-flex items-center gap-2 text-emerald-700">
          <Plus size={16} aria-hidden="true" />
          Adicionar
        </span>
      </button>

      {references.length ? (
        <div className="grid gap-2">
          {references.map((reference) => (
            <div
              key={reference}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <BookOpen size={15} className="text-zinc-500" aria-hidden="true" />
                <span>{reference}</span>
              </div>
              <button
                type="button"
                onClick={() => removeReference(reference)}
                className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
                aria-label={`Remover ${reference}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={openMiniModal}
          className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-left text-sm font-normal text-zinc-500 hover:border-emerald-400 hover:text-zinc-700"
        >
          Nenhum texto bíblico adicionado. Clique para inserir uma referência.
        </button>
      )}

      {isMiniModalOpen ? (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-zinc-950/25 p-4"
          onClick={closeMiniModal}
        >
          <section
            className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-zinc-950">Adicionar texto bíblico</h3>
                <p className="text-xs font-normal text-zinc-500">
                  Escolha livro, capítulo e versículos para montar a referência.
                </p>
              </div>
              <button
                type="button"
                onClick={closeMiniModal}
                className="grid size-9 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Fechar inserção de texto bíblico"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              {isLoading ? (
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-normal text-zinc-600">
                  Carregando livros, capítulos e versículos...
                </p>
              ) : loadError ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-normal text-rose-700">
                  {loadError}
                </p>
              ) : selectedBook ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldShell label="Livro">
                      <select
                        value={selectedBook.id}
                        onChange={(event) => setBookId(event.target.value)}
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-600"
                      >
                        {books.map((book) => (
                          <option key={book.id} value={book.id}>
                            {book.name}
                          </option>
                        ))}
                      </select>
                    </FieldShell>

                    <FieldShell label="Capítulo">
                      <select
                        value={chapter}
                        onChange={(event) => setChapter(Number(event.target.value))}
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-600"
                      >
                        {buildNumberOptions(1, chapterCount).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </FieldShell>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldShell label="Versículo inicial">
                      <select
                        value={startVerse}
                        onChange={(event) => setStartVerse(Number(event.target.value))}
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-600"
                      >
                        {buildNumberOptions(1, verseCount).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </FieldShell>

                    <FieldShell label="Versículo final">
                      <select
                        value={Math.max(endVerse, startVerse)}
                        onChange={(event) => setEndVerse(Number(event.target.value))}
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-600"
                      >
                        {endVerseOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </FieldShell>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                    {formatReference(
                      selectedBook.abbreviation,
                      chapter,
                      startVerse,
                      Math.max(endVerse, startVerse),
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeMiniModal}
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addReference}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
              >
                <Plus size={16} aria-hidden="true" />
                Adicionar texto bíblico
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildNumberOptions(start: number, end: number) {
  if (!end || start > end) return [start];

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function formatReference(
  abbreviation: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
) {
  if (startVerse === endVerse) {
    return `${abbreviation} ${chapter}:${startVerse}`;
  }

  return `${abbreviation} ${chapter}:${startVerse}-${endVerse}`;
}

function parseScriptureReferences(value: string) {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBibleBooks(source: string): ScriptureBook[] {
  return Array.from(source.matchAll(BOOK_DATA_PATTERN))
    .map((match) => {
      const [, id, title, verseListText] = match;
      const labels = BOOK_LABELS[id];

      if (!labels) {
        return null;
      }

      return {
        id,
        name: labels.name || title,
        abbreviation: labels.abbreviation,
        chapters: verseListText
          .split(",")
          .map((value) => Number.parseInt(value.trim(), 10))
          .filter(Number.isFinite),
      } satisfies ScriptureBook;
    })
    .filter((book): book is ScriptureBook => Boolean(book));
}

async function getBibleBooks() {
  if (!bibleBooksPromise) {
    bibleBooksPromise = fetch(BIBLE_BOOK_SOURCE_URL, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Bible metadata request failed.");
        }

        return response.text();
      })
      .then(parseBibleBooks);
  }

  return bibleBooksPromise;
}

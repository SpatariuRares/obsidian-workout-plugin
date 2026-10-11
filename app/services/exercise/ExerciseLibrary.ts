import { normalizePath } from "obsidian";
import type { App, EventRef, TFile } from "obsidian";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { StringUtils } from "@app/utils/StringUtils";
import { FrontmatterParser } from "@app/utils/frontmatter/FrontmatterParser";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";

/** Frontmatter keys that name an exercise page, besides its file name */
const NAME_KEYS = ["exercise_name", "nome_esercizio"] as const;

/** An exercise page and what its frontmatter says. See CONTEXT.md. */
export interface ExercisePage {
  file: TFile;
  /** File name first, then `exercise_name` / `nome_esercizio` when set */
  names: string[];
  /** Type id as written (`exercise_type`, then `type`); undefined if absent */
  type?: string;
  /** Tags without "#", from a YAML list or a comma separated string */
  tags: string[];
  /** Valid `parameters` the page declares beyond its type's */
  parameters: ParameterDefinition[];
}

type LibraryApp = {
  vault: Pick<App["vault"], "getMarkdownFiles" | "on">;
  metadataCache: Pick<App["metadataCache"], "getFileCache" | "on">;
};

interface Index {
  folder: string;
  pages: ExercisePage[];
  /** Normalized name → pages answering to it, best match first */
  byName: Map<string, ExercisePage[]>;
}

/**
 * The exercise pages in the exercise folder (and its subfolders), found by
 * exercise name: file name, `exercise_name` or `nome_esercizio`, ignoring
 * case and spacing, never partially. Reads frontmatter from Obsidian's
 * metadata cache and stays current once `watch` is called.
 */
export class ExerciseLibrary {
  private index: Index | null = null;

  constructor(
    private readonly app: LibraryApp,
    private readonly settings: Pick<WorkoutChartsSettings, "exerciseFolderPath">,
  ) {}

  /** Keeps the library current; pass each ref to `plugin.registerEvent` */
  watch(register: (ref: EventRef) => void): void {
    const stale = () => {
      this.index = null;
    };
    register(this.app.vault.on("create", stale));
    register(this.app.vault.on("delete", stale));
    register(this.app.vault.on("rename", stale));
    register(this.app.metadataCache.on("changed", stale));
  }

  /** Every exercise page, by path */
  pages(): ExercisePage[] {
    return this.current().pages;
  }

  /** The page for an exercise name; on a tie the file name wins, then the first path */
  find(name: string): ExercisePage | undefined {
    return this.current().byName.get(StringUtils.normalize(name))?.[0];
  }

  /** Other pages that answer to one of this page's names */
  pagesSharingAName(page: ExercisePage): ExercisePage[] {
    const { byName } = this.current();
    const others = new Set<ExercisePage>();
    for (const name of page.names) {
      for (const other of byName.get(StringUtils.normalize(name)) ?? []) {
        if (other !== page) others.add(other);
      }
    }
    return Array.from(others).sort(byPath);
  }

  private current(): Index {
    const folder = normalizeFolder(this.settings.exerciseFolderPath);
    if (!this.index || this.index.folder !== folder) {
      this.index = this.build(folder);
    }
    return this.index;
  }

  private build(folder: string): Index {
    const pages = folder
      ? this.app.vault
          .getMarkdownFiles()
          .filter((file) => file.path.startsWith(`${folder}/`))
          .map((file) => this.readPage(file))
          .sort(byPath)
      : [];

    const byName = new Map<string, { page: ExercisePage; byFileName: boolean }[]>();
    for (const page of pages) {
      page.names.forEach((name, i) => {
        const key = StringUtils.normalize(name);
        const entries = byName.get(key) ?? [];
        if (!entries.some((e) => e.page === page)) {
          entries.push({ page, byFileName: i === 0 });
        }
        byName.set(key, entries);
      });
    }

    const ranked = new Map<string, ExercisePage[]>();
    for (const [key, entries] of byName) {
      // Pages are already by path; a stable sort keeps that order on ties
      entries.sort((a, b) => Number(b.byFileName) - Number(a.byFileName));
      ranked.set(key, entries.map((e) => e.page));
    }
    return { folder, pages, byName: ranked };
  }

  private readPage(file: TFile): ExercisePage {
    const frontmatter: Record<string, unknown> =
      this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    const names = [file.basename];
    for (const key of NAME_KEYS) {
      const value = text(frontmatter[key]);
      const known = names.map((n) => StringUtils.normalize(n));
      if (value && !known.includes(StringUtils.normalize(value))) {
        names.push(value);
      }
    }
    return {
      file,
      names,
      type: text(frontmatter.exercise_type) ?? text(frontmatter.type),
      tags: FrontmatterParser.toTagList(frontmatter.tags),
      parameters: parseParameters(frontmatter.parameters),
    };
  }
}

/**
 * Parameters from a `parameters:` YAML list. Entries without a valid key
 * (missing, reserved, malformed) are skipped.
 *
 * @example
 * ```yaml
 * parameters:
 *   - key: incline
 *     label: Incline
 *     type: number
 *     unit: "%"
 * ```
 */
function parseParameters(raw: unknown): ParameterDefinition[] {
  if (!Array.isArray(raw)) return [];
  const parameters: ParameterDefinition[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const key = text(entry.key);
    if (!key) continue;

    const parameter: ParameterDefinition = {
      key,
      label: text(entry.label) ?? key,
      type:
        entry.type === "string" || entry.type === "boolean"
          ? entry.type
          : "number",
      required: entry.required === true,
    };
    if (!ParameterUtils.validateParam(parameter).isValid) continue;

    const unit = text(entry.unit);
    if (unit) parameter.unit = unit;
    if (entry.default !== undefined) {
      parameter.default = entry.default as number | string | boolean;
    }
    if (typeof entry.min === "number") parameter.min = entry.min;
    if (typeof entry.max === "number") parameter.max = entry.max;
    parameters.push(parameter);
  }
  return parameters;
}

function normalizeFolder(folder: string | undefined): string {
  const trimmed = (folder ?? "").trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? normalizePath(trimmed) : "";
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function byPath(a: ExercisePage, b: ExercisePage): number {
  return a.file.path.localeCompare(b.file.path);
}

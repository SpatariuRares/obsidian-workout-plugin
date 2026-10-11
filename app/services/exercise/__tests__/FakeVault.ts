import { TFile } from "obsidian";

type Frontmatter = Record<string, unknown> | undefined;
type Listener = { source: "vault" | "metadataCache"; name: string; cb: (...args: unknown[]) => void };

/**
 * In-memory stand-in for the parts of Obsidian's vault and metadataCache that
 * read notes and their frontmatter. Changes fire the same events Obsidian
 * does, so modules that watch the vault can be tested through it.
 */
export class FakeVault {
  private readonly notes = new Map<string, { file: TFile; frontmatter: Frontmatter }>();
  private readonly listeners: Listener[] = [];

  readonly app = {
    vault: {
      getMarkdownFiles: (): TFile[] =>
        Array.from(this.notes.values()).map((n) => n.file),
      getFileByPath: (path: string): TFile | null =>
        this.notes.get(path)?.file ?? null,
      on: (name: string, cb: (...args: unknown[]) => void) =>
        this.listen("vault", name, cb),
    },
    metadataCache: {
      getFileCache: (file: TFile) => {
        const note = this.notes.get(file.path);
        return note ? { frontmatter: note.frontmatter } : null;
      },
      on: (name: string, cb: (...args: unknown[]) => void) =>
        this.listen("metadataCache", name, cb),
    },
  };

  constructor(notes: Record<string, Frontmatter> = {}) {
    for (const [path, frontmatter] of Object.entries(notes)) {
      this.notes.set(path, { file: makeFile(path), frontmatter });
    }
  }

  /** Creates the note, or replaces its frontmatter */
  write(path: string, frontmatter?: Frontmatter): TFile {
    const existing = this.notes.get(path);
    const file = existing?.file ?? makeFile(path);
    this.notes.set(path, { file, frontmatter });
    if (!existing) this.emit("vault", "create", file);
    this.emit("metadataCache", "changed", file);
    return file;
  }

  remove(path: string): void {
    const note = this.notes.get(path);
    if (!note) return;
    this.notes.delete(path);
    this.emit("vault", "delete", note.file);
  }

  rename(from: string, to: string): void {
    const note = this.notes.get(from);
    if (!note) return;
    this.notes.delete(from);
    Object.assign(note.file, describe(to));
    this.notes.set(to, note);
    this.emit("vault", "rename", note.file, from);
  }

  file(path: string): TFile {
    const note = this.notes.get(path);
    if (!note) throw new Error(`No note at ${path}`);
    return note.file;
  }

  private listen(source: Listener["source"], name: string, cb: Listener["cb"]) {
    const listener = { source, name, cb };
    this.listeners.push(listener);
    return listener;
  }

  private emit(source: Listener["source"], name: string, ...args: unknown[]) {
    this.listeners
      .filter((l) => l.source === source && l.name === name)
      .forEach((l) => l.cb(...args));
  }
}

function describe(path: string) {
  const name = path.split("/").pop() ?? path;
  const dot = name.lastIndexOf(".");
  return {
    path,
    name,
    basename: dot > 0 ? name.slice(0, dot) : name,
    extension: dot > 0 ? name.slice(dot + 1) : "",
  };
}

function makeFile(path: string): TFile {
  return Object.assign(new TFile(), describe(path));
}

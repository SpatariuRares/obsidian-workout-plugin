import { TFile } from "obsidian";

type Frontmatter = Record<string, unknown> | undefined;
type Listener = { source: "vault" | "metadataCache"; name: string; cb: (...args: unknown[]) => void };

/**
 * In-memory stand-in for the parts of Obsidian's vault and metadataCache that
 * read notes and their frontmatter. Changes fire the same events Obsidian
 * does, so modules that watch the vault can be tested through it.
 */
export class FakeVault {
  private readonly notes = new Map<
    string,
    { file: TFile; frontmatter: Frontmatter; content?: string }
  >();
  private readonly listeners: Listener[] = [];

  readonly app = {
    vault: {
      getMarkdownFiles: (): TFile[] =>
        Array.from(this.notes.values()).map((n) => n.file),
      getFileByPath: (path: string): TFile | null =>
        this.notes.get(path)?.file ?? null,
      on: (name: string, cb: (...args: unknown[]) => void) =>
        this.listen("vault", name, cb),
      /** Stores the text; its frontmatter is not parsed (read it with `content`) */
      create: async (path: string, content: string): Promise<TFile> => {
        if (this.notes.has(path)) throw new Error(`File already exists: ${path}`);
        const file = makeFile(path);
        this.notes.set(path, { file, frontmatter: undefined, content });
        this.emit("vault", "create", file);
        return file;
      },
    },
    fileManager: {
      processFrontMatter: async (
        file: TFile,
        fn: (frontmatter: Record<string, unknown>) => void,
      ): Promise<void> => {
        const note = this.notes.get(file.path);
        if (!note) throw new Error(`No note at ${file.path}`);
        const frontmatter = structuredClone(note.frontmatter ?? {});
        fn(frontmatter);
        note.frontmatter = frontmatter;
        this.emit("metadataCache", "changed", file);
      },
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

  /** Paths of every note, sorted */
  paths(): string[] {
    return Array.from(this.notes.keys()).sort();
  }

  frontmatter(path: string): Frontmatter {
    return this.notes.get(path)?.frontmatter;
  }

  /** Text given to `vault.create` */
  content(path: string): string | undefined {
    return this.notes.get(path)?.content;
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

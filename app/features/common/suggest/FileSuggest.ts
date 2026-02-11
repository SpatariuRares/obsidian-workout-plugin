import { TFile, AbstractInputSuggest, App } from "obsidian";

export class FileSuggest extends AbstractInputSuggest<TFile> {
    private inputEl: HTMLInputElement;

    constructor(app: App, textInputEl: HTMLInputElement) {
        super(app, textInputEl);
        this.inputEl = textInputEl;
    }

    getSuggestions(query: string): TFile[] {
        const files = this.app.vault.getMarkdownFiles();
        const lowerCaseQuery = query.toLowerCase();

        return files
            .filter(file => file.path.toLowerCase().contains(lowerCaseQuery))
            .sort((a, b) => b.stat.mtime - a.stat.mtime);
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFile): void {
        this.inputEl.value = file.basename;
        this.inputEl.trigger("input");
        this.close();
    }
}

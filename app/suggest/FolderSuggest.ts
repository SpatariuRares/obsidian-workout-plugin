import { TFolder, AbstractInputSuggest, App } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    private inputEl: HTMLInputElement;

    constructor(app: App, textInputEl: HTMLInputElement) {
        super(app, textInputEl);
        this.inputEl = textInputEl;
    }

    getSuggestions(query: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerCaseQuery = query.toLowerCase();

        for (const file of abstractFiles) {
            if (file instanceof TFolder) {
                if (file.path.toLowerCase().contains(lowerCaseQuery)) {
                    folders.push(file);
                }
            }
        }

        return folders;
    }

    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFolder): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}

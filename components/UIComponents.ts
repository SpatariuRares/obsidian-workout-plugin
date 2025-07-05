import { Notice } from "obsidian";
import { CreateLogModal } from "../modals/CreateLogModal";

export class UIComponents {
  static renderLoadingIndicator(container: HTMLElement): HTMLElement {
    const loadingDiv = container.createEl("div", {
      cls: "embedded-chart-loading",
    });
    loadingDiv.innerHTML = "⏳ Caricamento dati...";
    return loadingDiv;
  }

  static renderInfoMessage(
    container: HTMLElement,
    message: string,
    type: "info" | "warning" | "success" = "info"
  ): void {
    const infoDiv = container.createEl("div", {
      cls: `embedded-chart-info embedded-chart-info-${type}`,
    });

    const icons = {
      info: "ℹ️",
      warning: "⚠️",
      success: "✅",
    };

    const icon = icons[type] || icons.info;
    infoDiv.innerHTML = `<strong>${icon}</strong> ${message}`;
  }

  static renderErrorMessage(container: HTMLElement, message: string): void {
    container.innerHTML = `
      <div class="workout-chart-error">
        ❌ Errore durante la creazione del grafico: ${message}
      </div>
    `;
  }

  static renderNoDataMessage(container: HTMLElement): void {
    container.innerHTML = `
      <div class="workout-log-no-data">
        Nessun dato di allenamento trovato.
        <br>Crea alcuni log di allenamento usando il comando "Create Workout Log".
      </div>
    `;
  }

  static renderNoMatchMessage(
    container: HTMLElement,
    exercise: string,
    logData: any[]
  ): void {
    const availableExercises = [
      ...new Set(logData.map((d) => d.exercise)),
    ].join(", ");
    container.innerHTML = `
      <div class="workout-log-no-match">
        Nessun dato trovato per l'esercizio: <strong>${exercise}</strong>
        <br>Esercizi disponibili: ${availableExercises}
      </div>
    `;
  }

  static renderDebugInfo(
    container: HTMLElement,
    data: any[],
    chartType: string,
    filterMethod: string
  ): void {
    const debugInfo = container.createEl("div", {
      cls: "embedded-chart-debug",
    });
    debugInfo.innerHTML = `
      <strong>Debug Info:</strong><br>
      Metodo Filtro: ${filterMethod}<br>
      Punti Dati: ${data.length}<br>
      Tipo Grafico: ${chartType}
    `;
  }

  static renderFooter(
    contentDiv: HTMLElement,
    volumeData: number[],
    filterResult: any,
    chartType: string
  ): void {
    const infoFooterDiv = contentDiv.createEl("div", {
      cls: "workout-charts-footer",
    });

    let infoFooterText = `📊 ${volumeData.length} sessioni elaborate`;
    if (chartType === "exercise") {
      infoFooterText += ` per \"${filterResult.titlePrefix}\"`;
    } else if (chartType === "workout") {
      infoFooterText += ` per l'allenamento \"${filterResult.titlePrefix}\"`;
    }
    infoFooterText += `. (Metodo ricerca: ${filterResult.filterMethodUsed})`;
    infoFooterDiv.innerHTML = infoFooterText;
  }

  static renderFallbackTable(
    container: HTMLElement,
    labels: string[],
    volumeData: number[],
    title: string
  ): void {
    const tableDiv = container.createEl("div", {
      cls: "embedded-chart-table-fallback",
    });

    const table = tableDiv.createEl("table");
    table.className = "workout-charts-table";

    this.createTableHeader(table);
    this.createTableBody(table, labels, volumeData);

    const infoDiv = tableDiv.createEl("div", {
      cls: "workout-charts-footer",
    });
    infoDiv.innerHTML =
      "📊 Tabella di fallback (Plugin Charts non disponibile o errore)";
  }

  private static createTableHeader(table: HTMLTableElement): void {
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    ["Data", "Volume (kg)"].forEach((txt) => {
      const th = headerRow.createEl("th");
      th.textContent = txt;
    });
  }

  private static createTableBody(
    table: HTMLTableElement,
    labels: string[],
    volumeData: number[]
  ): void {
    const tbody = table.createEl("tbody");
    volumeData.forEach((v, i) => {
      const tr = tbody.createEl("tr");
      [labels[i], v.toFixed(1)].forEach((txt) => {
        const td = tr.createEl("td");
        td.textContent = txt;
      });
    });
  }

  static createAddLogButton(
    container: HTMLElement,
    exerciseName: string,
    currentPageLink: string,
    plugin: any,
    onLogCreated?: () => void
  ): void {
    if (!currentPageLink) {
      console.warn("'Add Log' button not created: currentPageLink is missing.");
      return;
    }

    const buttonContainer = container.createEl("div", {
      cls: "add-log-button-container",
    });

    const button = buttonContainer.createEl("button", {
      text: `➕ Aggiungi Log per ${exerciseName || "Allenamento"}`,
      cls: "add-log-button",
    });

    button.addEventListener("click", () => {
      // Open the create log modal with the exercise name pre-filled
      new CreateLogModal(
        plugin.app,
        plugin,
        exerciseName,
        currentPageLink,
        onLogCreated
      ).open();
    });
  }
}

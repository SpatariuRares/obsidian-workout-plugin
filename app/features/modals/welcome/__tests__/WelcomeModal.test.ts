/** @jest-environment jsdom */
import { t } from "@app/i18n";
import { WelcomeModal } from "@app/features/modals/welcome/WelcomeModal";
import type { WelcomePluginPort } from "@app/services/onboarding/Welcome";
import type { TourPort } from "@app/types/PluginPorts";

const mockCreateExampleNotes = jest.fn();
jest.mock("@app/services/examples/GettingStartedGuide", () => ({
  createExampleNotes: (...a: unknown[]) => mockCreateExampleNotes(...a),
  examplesCreated: (result: string) => result !== "failed",
}));

const mockStartTour = jest.fn();
jest.mock("@app/features/tour/startGuidedTour", () => ({
  startGuidedTour: (...a: unknown[]) => mockStartTour(...a),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function openModal() {
  const plugin = { app: {} } as unknown as WelcomePluginPort & TourPort;
  const modal = new WelcomeModal(plugin);
  const close = jest.spyOn(modal, "close");
  modal.onOpen();
  const click = (text: string) => {
    const btn = Array.from(modal.contentEl.querySelectorAll("button")).find(
      (b) => b.textContent === text,
    );
    if (!btn) throw new Error(`no button ${text}`);
    btn.click();
  };
  return { plugin, modal, click, close };
}

describe("WelcomeModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateExampleNotes.mockResolvedValue("pointed-at-examples");
  });

  it("offers the examples (primary), starting from scratch and later, nothing else", () => {
    const { modal } = openModal();
    const buttons = Array.from(modal.contentEl.querySelectorAll("button"));
    expect(buttons.map((b) => b.textContent)).toEqual([
      t("welcome.tryExamples"),
      t("welcome.startScratch"),
      t("welcome.later"),
    ]);
    expect(buttons[0].classList.contains("workout-btn-primary")).toBe(true);
  });

  it("try with example data creates the examples, then starts the tour on them", async () => {
    const { plugin, click, close } = openModal();
    click(t("welcome.tryExamples"));
    await flush();
    expect(mockCreateExampleNotes).toHaveBeenCalledWith(plugin);
    expect(mockStartTour).toHaveBeenCalledWith(plugin, {
      source: "welcome-examples",
    });
    expect(close).toHaveBeenCalled();
  });

  it("does not start the tour when creating the examples failed", async () => {
    mockCreateExampleNotes.mockResolvedValue("failed");
    const { click } = openModal();
    click(t("welcome.tryExamples"));
    await flush();
    expect(mockStartTour).not.toHaveBeenCalled();
  });

  it("start from scratch starts the tour on the user's data without creating examples", async () => {
    const { plugin, click, close } = openModal();
    click(t("welcome.startScratch"));
    await flush();
    expect(mockCreateExampleNotes).not.toHaveBeenCalled();
    expect(mockStartTour).toHaveBeenCalledWith(plugin, {
      source: "welcome-scratch",
    });
    expect(close).toHaveBeenCalled();
  });

  it("later closes without writing anything or starting the tour", async () => {
    const { click, close } = openModal();
    click(t("welcome.later"));
    await flush();
    expect(close).toHaveBeenCalled();
    expect(mockCreateExampleNotes).not.toHaveBeenCalled();
    expect(mockStartTour).not.toHaveBeenCalled();
  });
});

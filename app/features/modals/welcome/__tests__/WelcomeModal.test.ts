/** @jest-environment jsdom */
import { t } from "@app/i18n";
import { WelcomeModal } from "@app/features/modals/welcome/WelcomeModal";
import type { WelcomePluginPort } from "@app/services/onboarding/Welcome";

const mockCreateExampleNotes = jest.fn();
const mockOpenGuide = jest.fn();
jest.mock("@app/services/examples/GettingStartedGuide", () => ({
  createExampleNotes: (...a: unknown[]) => mockCreateExampleNotes(...a),
  openGettingStartedGuide: (...a: unknown[]) => mockOpenGuide(...a),
  examplesCreated: (result: string) => result !== "failed",
}));
const mockStartFromScratch = jest.fn();
jest.mock("@app/services/onboarding/Welcome", () => ({
  startFromScratch: (...a: unknown[]) => mockStartFromScratch(...a),
}));

const mockStartTour = jest.fn();
jest.mock("@app/features/tour/startGuidedTour", () => ({
  startGuidedTour: (...a: unknown[]) => mockStartTour(...a),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function openModal() {
  const plugin = { app: {} } as unknown as WelcomePluginPort;
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
  it("offers the tour first, as the primary choice", () => {
    const { modal } = openModal();
    const buttons = Array.from(modal.contentEl.querySelectorAll("button"));
    expect(buttons[0].textContent).toBe(t("welcome.takeTour"));
    expect(buttons[0].classList.contains("workout-btn-primary")).toBe(true);
    expect(buttons.length).toBe(4);
  });

  it("take the tour creates the examples, then starts the tour on them", async () => {
    const { plugin, click, close } = openModal();
    click(t("welcome.takeTour"));
    await flush();
    expect(mockCreateExampleNotes).toHaveBeenCalledWith(plugin);
    expect(mockStartTour).toHaveBeenCalledWith(plugin, {
      source: "welcome-examples",
    });
    expect(close).toHaveBeenCalled();
  });

  it("take the tour does not start when creating the examples failed", async () => {
    mockCreateExampleNotes.mockResolvedValue("failed");
    const { click } = openModal();
    click(t("welcome.takeTour"));
    await flush();
    expect(mockStartTour).not.toHaveBeenCalled();
  });

  it("the other choices do not start the tour", async () => {
    const { click } = openModal();
    click(t("welcome.tryExamples"));
    click(t("welcome.startScratch"));
    await flush();
    expect(mockStartTour).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateExampleNotes.mockResolvedValue("pointed-at-examples");
    mockOpenGuide.mockResolvedValue(true);
  });

  it("try with example data creates the examples and opens the guide", async () => {
    const { plugin, click, close } = openModal();
    click(t("welcome.tryExamples"));
    await flush();
    expect(mockCreateExampleNotes).toHaveBeenCalledWith(plugin);
    expect(mockOpenGuide).toHaveBeenCalledWith(plugin);
    expect(close).toHaveBeenCalled();
  });

  it("does not open the guide when creating the examples failed", async () => {
    mockCreateExampleNotes.mockResolvedValue("failed");
    const { click } = openModal();
    click(t("welcome.tryExamples"));
    await flush();
    expect(mockOpenGuide).not.toHaveBeenCalled();
  });

  it("start from scratch creates the log note", async () => {
    const { plugin, click, close } = openModal();
    click(t("welcome.startScratch"));
    await flush();
    expect(mockStartFromScratch).toHaveBeenCalledWith(plugin);
    expect(close).toHaveBeenCalled();
  });

  it("later closes without writing anything", async () => {
    const { click, close } = openModal();
    click(t("welcome.later"));
    await flush();
    expect(close).toHaveBeenCalled();
    expect(mockCreateExampleNotes).not.toHaveBeenCalled();
    expect(mockStartFromScratch).not.toHaveBeenCalled();
  });
});

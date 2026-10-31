import { ModalBase } from "@app/features/modals/base/ModalBase";
import { Button, BUTTONVARIANT } from "@app/components/atoms";
import { t } from "@app/i18n";
import {
  createExampleNotes,
  openGettingStartedGuide,
} from "@app/services/examples/GettingStartedGuide";
import {
  startFromScratch,
  type WelcomePluginPort,
} from "@app/services/onboarding/Welcome";

/** Shown once after a fresh install. Nothing is written until a choice is made. */
export class WelcomeModal extends ModalBase {
  constructor(private plugin: WelcomePluginPort) {
    super(plugin.app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal");

    contentEl.createEl("h2", { text: t("welcome.title") });
    contentEl.createEl("p", { text: t("welcome.intro") });

    this.choice(
      t("welcome.tryExamples"),
      t("welcome.tryExamplesDesc"),
      BUTTONVARIANT.PRIMARY,
      async () => {
        const result = await createExampleNotes(this.plugin);
        if (result !== "cancelled" && result !== "failed") {
          await openGettingStartedGuide(this.plugin);
        }
      },
    );
    this.choice(
      t("welcome.startScratch"),
      t("welcome.startScratchDesc"),
      BUTTONVARIANT.SECONDARY,
      () => startFromScratch(this.plugin),
    );

    const row = Button.createContainer(contentEl);
    const later = Button.create(row, {
      text: t("welcome.later"),
      ariaLabel: t("welcome.later"),
      variant: BUTTONVARIANT.SECONDARY,
    });
    Button.onClick(later, () => this.close());
  }

  private choice(
    label: string,
    description: string,
    variant: (typeof BUTTONVARIANT)[keyof typeof BUTTONVARIANT],
    action: () => Promise<void>,
  ): void {
    const group = this.contentEl.createDiv();
    const btn = Button.create(group, {
      text: label,
      ariaLabel: label,
      variant,
    });
    group.createEl("p", { text: description, cls: "setting-item-description" });
    Button.onClick(btn, () => {
      this.close();
      void action();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

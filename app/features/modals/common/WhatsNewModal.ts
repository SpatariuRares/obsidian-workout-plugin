import { App, Component, MarkdownRenderer } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { Button, BUTTONVARIANT } from "@app/components/atoms";
import { t } from "@app/i18n";
import {
  RELEASES_URL,
  type ReleaseNotes,
} from "@app/services/onboarding/WhatsNew";
import logo from "@app/features/modals/common/whatsNewLogo.webp";

/**
 * The release notes of one or more versions, newest first
 */
export class WhatsNewModal extends ModalBase {
  /** Owns what the markdown renderer adds, unloaded on close */
  private component = new Component();

  constructor(
    app: App,
    private releases: ReleaseNotes[],
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal", "workout-whats-new");
    this.component.load();

    const header = contentEl.createDiv({ cls: "workout-whats-new-header" });
    header.createEl("img", {
      cls: "workout-whats-new-logo",
      attr: { src: logo, alt: "" },
    });
    header.createEl("h2", { text: t("whatsNew.title") });

    // The newest release open, older ones folded
    this.releases.forEach((release, index) => {
      const section = contentEl.createEl("details", {
        cls: "workout-whats-new-release",
      });
      section.open = index === 0;
      section.createEl("summary").createEl("h3", {
        text: t("whatsNew.version", { version: release.version }),
      });
      void MarkdownRenderer.render(
        this.app,
        release.notes,
        section.createDiv(),
        "",
        this.component,
      );
    });

    contentEl.createEl("p", { cls: "workout-whats-new-older" }).createEl("a", {
      text: t("whatsNew.olderReleases"),
      href: RELEASES_URL,
    });

    const actions = Button.createModalActions(contentEl);
    const closeBtn = Button.create(actions, {
      text: t("whatsNew.close"),
      ariaLabel: t("whatsNew.close"),
      variant: BUTTONVARIANT.PRIMARY,
    });
    Button.onClick(closeBtn, () => this.close());
  }

  onClose() {
    this.component.unload();
    this.contentEl.empty();
  }
}

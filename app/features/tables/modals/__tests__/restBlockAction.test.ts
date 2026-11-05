import { restBlockAction } from "@app/features/tables/modals/restBlockAction";
import { EditRestTimerModal } from "@app/features/tables/modals/EditRestTimerModal";
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import { ICONS } from "@app/constants";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

jest.mock("@app/features/tables/modals/EditRestTimerModal", () => ({
  EditRestTimerModal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock("@app/features/timer/modals/EditTimerModal", () => ({
  EditTimerModal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
}));

const plugin = { app: {} } as unknown as WorkoutPluginContext;
const match = { body: "exercise: Squat" };

/** The modal the action opened, and what it opened it with */
const opened = (modal: unknown) => {
  const mock = modal as jest.Mock;
  const instance = mock.mock.results[0].value as { open: jest.Mock };
  return { args: mock.mock.calls[0] as unknown[], shown: instance.open.mock.calls.length };
};

describe("restBlockAction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("is the Edit rest timer entry of a block's menu", () => {
    const action = restBlockAction(plugin, "Leg day.md", { type: "workout-timer", params: {}, match }, {});

    expect(action).toMatchObject({ label: t("sets.editRestTimer"), icon: ICONS.TIMER.DURATION });
  });

  it("edits a workout-sets block's rest with the timer it rests on now", () => {
    const params = { exercise: "Squat", rest: 90 };
    restBlockAction(plugin, "Leg day.md", { type: "workout-sets", params, match }, { duration: 90 }).run();

    const { args, shown } = opened(EditRestTimerModal);
    expect(args.slice(2)).toEqual([
      params,
      { duration: 90 },
      { sourcePath: "Leg day.md", matchWithoutId: match },
    ]);
    expect(shown).toBe(1);
    expect(EditTimerModal).not.toHaveBeenCalled();
  });

  it("edits the section's workout-timer block itself", () => {
    const params = { duration: 120 };
    restBlockAction(plugin, "Leg day.md", { type: "workout-timer", params, match }, params).run();

    const { args, shown } = opened(EditTimerModal);
    expect(args.slice(2)).toEqual([params, { sourcePath: "Leg day.md", matchWithoutId: match }]);
    expect(shown).toBe(1);
  });

  it("finds the block when the menu is used, not when it is drawn", () => {
    const later = jest.fn(() => match);
    const action = restBlockAction(plugin, "Leg day.md", { type: "workout-sets", params: {}, match: later }, {});
    expect(later).not.toHaveBeenCalled();

    action.run();

    expect(opened(EditRestTimerModal).args[4]).toEqual({ sourcePath: "Leg day.md", matchWithoutId: match });
  });
});

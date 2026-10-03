import { describe, expect, test } from "claude-code/testing";

type Limit = { kind: string; percentUsed: number; resetsAt?: string };

const usage = (percent: number | undefined, limits: Limit[] = [], usd?: number) => ({
  startedAt: 0,
  context: { tokens: percent === undefined ? undefined : percent * 2000, window: 200_000, percent },
  rateLimits: limits,
  cost: usd === undefined ? undefined : { usd },
});

// Starts the mod, mounts the band at `columns` wide, and returns the drawing.
async function mountBand($: any, on: any, columns: number, first = usage(undefined)) {
  on("session.start", ($: any, e: any) => ({ cwd: e.cwd }));
  on("session.usage", () => ({ value: first }));
  on("session.measure", ($: any, e: any) => ({ changed: e.changed }));
  await $.session.start({ surface: "terminal", isInteractive: true, cwd: "/work" } as any);
  return $.ui.mount({
    plugin: "usage-band",
    surface: "terminal",
    component: "AbovePrompt",
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: columns },
  } as any);
}

const measure = ($: any, u: ReturnType<typeof usage>) =>
  $.session.measure({
    context: u.context,
    rateLimits: u.rateLimits,
    cost: u.cost,
    changed: ["context", "rateLimits", "cost"],
  } as any);

describe("usage-band", () => {
  test("waits for the first reply when nothing is measured yet", async ($, on) => {
    const ui = await mountBand($, on, 120);
    expect(await ui.find({ type: "Text", text: /waiting for first reply/ })).toBeDefined();
    await ui.unmount();
  });

  test("shows context, both limits, and cost when wide", async ($, on) => {
    const ui = await mountBand($, on, 120);
    await measure(
      $,
      usage(62, [
        { kind: "five_hour", percentUsed: 23, resetsAt: "2026-10-03T15:40:00" },
        { kind: "seven_day", percentUsed: 9 },
      ], 1.42),
    );
    expect(await ui.find({ type: "Text", text: /62%/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /124k\/200k/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /23%/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /resets 15:40/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /9%/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /\$1\.42/ })).toBeDefined();
    await ui.unmount();
  });

  test("colours follow the thresholds: green, yellow from 60, red from 85", async ($, on) => {
    const ui = await mountBand($, on, 120);
    await measure($, usage(30));
    expect(await ui.find({ type: "Text", color: "green", text: /30%/ })).toBeDefined();
    await measure($, usage(60));
    expect(await ui.find({ type: "Text", color: "yellow", text: /60%/ })).toBeDefined();
    await measure($, usage(85));
    expect(await ui.find({ type: "Text", color: "red", text: /85%/ })).toBeDefined();
    await ui.unmount();
  });

  test("off a subscription it shows context and cost only", async ($, on) => {
    const ui = await mountBand($, on, 120);
    await measure($, usage(40, [], 0.5));
    expect(await ui.find({ type: "Text", text: /40%/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /\$0\.50/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /5h/ })).toBeUndefined();
    await ui.unmount();
  });

  test("an exceeded limit says so", async ($, on) => {
    const ui = await mountBand($, on, 120);
    await measure($, usage(10, [{ kind: "five_hour", percentUsed: 100, resetsAt: "2026-10-03T15:40:00" }]));
    expect(await ui.find({ type: "Text", text: /limit reached, resets 15:40/ })).toBeDefined();
    await ui.unmount();
  });

  test("a medium width drops tokens and cost, a narrow one shortens to a phrase", async ($, on) => {
    const medium = await mountBand($, on, 80);
    await measure($, usage(62, [{ kind: "five_hour", percentUsed: 23 }], 1.42));
    expect(await medium.find({ type: "Text", text: /124k/ })).toBeUndefined();
    expect(await medium.find({ type: "Text", text: /\$1\.42/ })).toBeUndefined();
    expect(await medium.find({ type: "Text", text: /62%/ })).toBeDefined();
    await medium.unmount();

    const narrow = await $.ui.mount({
      plugin: "usage-band",
      surface: "terminal",
      component: "AbovePrompt",
      props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 50 },
    } as any);
    expect(await narrow.find({ type: "Text", text: /ctx 62% · 5h 23%/ })).toBeDefined();
    await narrow.unmount();
  });
});

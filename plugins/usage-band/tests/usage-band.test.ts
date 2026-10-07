import { describe, expect, mock, test } from "claude-code/testing";

type Limit = { kind: string; percentUsed: number; resetsAt?: string };

const usage = (percent: number | undefined, limits: Limit[] = [], usd?: number) => ({
  startedAt: 0,
  context: { tokens: percent === undefined ? undefined : percent * 2000, window: 200_000, percent },
  rateLimits: limits,
  cost: usd === undefined ? undefined : { usd },
});

// Starts the mod, mounts the band at `columns` wide, and returns the drawing.
async function mountBand($: any, on: any, columns: number, first = usage(undefined), isInteractive = true) {
  on("session.start", ($: any, e: any) => ({ cwd: e.cwd }));
  on("session.usage", () => ({ value: first }));
  on("session.measure", ($: any, e: any) => ({ changed: e.changed }));
  // What another mod (fuse, skill-badge) drew in the same band; the band must keep it.
  on("ui.render", () => ({ type: "Text", props: {}, children: ["BELOW-MOD"] }) as any);
  await $.session.start({ surface: "terminal", isInteractive, cwd: "/work" } as any);
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

  test("keeps what another mod drew in the band and adds its own line", async ($, on) => {
    const ui = await mountBand($, on, 120);
    expect(await ui.find({ type: "Text", text: /BELOW-MOD/ })).toBeDefined();
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
    expect(await ui.find({ type: "Text", text: /฿1\.42/ })).toBeDefined();
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

  test("the cost wears the Belly sign, or B with the ascii option", { options: { ascii: true } }, async ($, on) => {
    const ui = await mountBand($, on, 120);
    await measure($, usage(40, [], 2.99));
    expect(await ui.find({ type: "Text", text: /B2\.99/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /฿/ })).toBeUndefined();
    await ui.unmount();
  });

  test("off a subscription it shows context and cost only", async ($, on) => {
    const ui = await mountBand($, on, 120);
    await measure($, usage(40, [], 0.5));
    expect(await ui.find({ type: "Text", text: /40%/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /฿0\.50/ })).toBeDefined();
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
    expect(await medium.find({ type: "Text", text: /฿1\.42/ })).toBeUndefined();
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

describe("usage-band dancer", () => {
  const startTurn = ($: any, id = "t1") => $.turn.start({ text: "go", turnId: id } as any);
  const endTurn = ($: any, id = "t1") =>
    $.turn.complete({ answer: "", durationMs: 1, isAborted: false, turnId: id, reason: "answer" } as any);
  const text = (pattern: RegExp, extra: object = {}) => ({ type: "Text", text: pattern, ...extra });

  // The band at `columns` wide, a fake clock, and the turn hooks the engine would answer.
  async function mountDancing($: any, on: any, columns: number, percent: number, isInteractive = true) {
    const clock = mock.clock(on, { now: 1_000_000 });
    on("turn.start", (_$: any, e: any) => ({ turnId: e.turnId }));
    on("turn.complete", () => ({ text: "" }) as any);
    on("session.end", (_$: any, e: any) => ({ sessionId: e.sessionId }) as any);
    const ui = await mountBand($, on, columns, usage(undefined), isInteractive);
    await measure($, usage(percent));
    return { ui, clock };
  }

  test("a new session starts asleep", async ($, on) => {
    const { ui } = await mountDancing($, on, 120, 30);
    expect(await ui.find(text(/\(-_-\) zZZ/, { dimColor: true }))).toBeDefined();
    await ui.unmount();
  });

  test("shows before the first reply, asleep, then dances through the first turn", async ($, on) => {
    const clock = mock.clock(on, { now: 1_000_000 });
    on("turn.start", (_$: any, e: any) => ({ turnId: e.turnId }));
    on("turn.complete", () => ({ text: "" }) as any);
    const ui = await mountBand($, on, 80); // nothing measured yet
    expect(await ui.find(text(/waiting for first reply/))).toBeDefined();
    expect(await ui.find(text(/\(-_-\) zZZ/, { dimColor: true }))).toBeDefined();
    await startTurn($);
    await clock.advance(200);
    expect(await ui.find(text(/waiting for first reply/))).toBeDefined();
    expect(await ui.find(text(/\(\^o\^\)/, { color: "green" }))).toBeDefined();
    expect(await ui.find(text(/zZZ/))).toBeUndefined();
    await endTurn($);
    await ui.unmount();
  });

  test("dances while a turn runs, in the colour of the fullest meter", async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 70);
    await startTurn($);
    await clock.advance(200);
    expect(await ui.find(text(/\(•_•\)/, { color: "yellow" }))).toBeDefined();
    expect(await ui.find(text(/zZZ/))).toBeUndefined();
    await measure($, usage(90));
    expect(await ui.find(text(/\(°O°\)/, { color: "red" }))).toBeDefined();
    await measure($, usage(10, [{ kind: "five_hour", percentUsed: 100 }]));
    expect(await ui.find(text(/\(x_x\)/))).toBeDefined();
    await endTurn($);
    await ui.unmount();
  });

  test("moves between redraws while the turn runs", async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 30);
    await startTurn($);
    await clock.advance(200);
    expect(await ui.find(text(/\\\(\^o\^\)\//))).toBeDefined();
    await clock.advance(600); // calm: a beat is three ticks
    expect(await ui.find(text(/\/\(\^o\^\)\\/))).toBeDefined();
    await endTurn($);
    await ui.unmount();
  });

  test("after a turn it hums for a minute, dozes for four, then sleeps", async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 30);
    await startTurn($);
    await endTurn($);
    expect(await ui.find(text(/[♪♫] \(\^o\^\)/, { dimColor: true }))).toBeDefined();
    await clock.advance(1000);
    expect(await ui.find(text(/[♪♫] \(\^o\^\)/))).toBeDefined();
    await clock.advance(59_000);
    expect(await ui.find(text(/\(-_-\) [zZ]{2}$/))).toBeDefined();
    expect(await ui.find(text(/\(\^o\^\)/))).toBeUndefined();
    await clock.advance(240_000);
    expect(await ui.find(text(/\(-_-\) zZZ/))).toBeDefined();
    await ui.unmount();
  });

  test("a new turn cancels the winding down", async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 30);
    await startTurn($);
    await endTurn($);
    await clock.advance(30_000);
    await startTurn($, "t2");
    await clock.advance(100_000); // past the point where the old timers would have dozed
    expect(await ui.find(text(/\(-_-\)/))).toBeUndefined();
    expect(await ui.find(text(/\(\^o\^\)/))).toBeDefined();
    await endTurn($, "t2");
    await ui.unmount();
  });

  test("a /clear stops the timers and puts the dancer to sleep", async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 30);
    await startTurn($);
    await $.session.end({ reason: "clear", sessionId: "s1" } as any);
    await clock.advance(10_000);
    expect(await ui.find(text(/\(-_-\) zZZ/))).toBeDefined();
    expect(await ui.find(text(/\(\^o\^\)/))).toBeUndefined();
    await ui.unmount();
  });

  test("working mode dances only during a turn", { options: { dancer: "working" } }, async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 30);
    expect(await ui.find(text(/zZZ/))).toBeUndefined();
    await startTurn($);
    await clock.advance(200);
    expect(await ui.find(text(/\(\^o\^\)/))).toBeDefined();
    await endTurn($);
    expect(await ui.find(text(/\(\^o\^\)|zZ/))).toBeUndefined();
    await ui.unmount();
  });

  test("off draws no dancer", { options: { dancer: "off" } }, async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 30);
    await startTurn($);
    await clock.advance(400);
    expect(await ui.find(text(/\(\^o\^\)|zZ/))).toBeUndefined();
    await endTurn($);
    await ui.unmount();
  });

  test("a headless run starts no dancer", async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 30, false);
    await startTurn($);
    await clock.advance(400);
    expect(await ui.find(text(/\(\^o\^\)|zZ/))).toBeUndefined();
    await endTurn($);
    await ui.unmount();
  });

  test("ascii swaps the symbols", { options: { ascii: true } }, async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 120, 70);
    await startTurn($);
    await clock.advance(200);
    expect(await ui.find(text(/\(o_o\)/))).toBeDefined();
    expect(await ui.find(text(/[•°♪♫]/))).toBeUndefined();
    await endTurn($);
    await ui.unmount();
  });

  test("stays out of a band narrower than 112 columns", async ($, on) => {
    const { ui, clock } = await mountDancing($, on, 100, 30);
    await startTurn($);
    await clock.advance(400);
    expect(await ui.find(text(/\(\^o\^\)|zZ/))).toBeUndefined();
    await endTurn($);
    await ui.unmount();
  });
});

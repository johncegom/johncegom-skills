import { describe, expect, mock, test } from "claude-code/testing";
import { barParts, barText, elapsedMs, isEscapeStop, measure, stageOf, symbolsFor } from "../hooks/core";

// ---- fakes ----------------------------------------------------------------

const usage = (tokens: number, window = 200_000) => ({
  startedAt: 0,
  context: { tokens, window, percent: Math.round((tokens / window) * 100) },
  rateLimits: [],
});

// Everything the plugin calls beneath itself. `fake.tokens` is the fake usage.
function engine($: any, on: any) {
  const fake = { tokens: 10_000, files: {} as Record<string, string>, ran: [] as string[] };
  const clock = mock.clock(on, { now: 1_000_000 });
  on("session.usage", () => ({ value: usage(fake.tokens) }));
  on("tool.call", (_$: any, e: any) => {
    fake.ran.push(e.command);
    return { result: "ok", text: "ok" } as any;
  });
  on("turn.start", (_$: any, e: any) => ({ turnId: e.turnId }));
  on("turn.complete", () => ({ text: "" }) as any);
  on("ui.open", () => ({ value: { isPlaced: true } }) as any);
  on("ui.close", () => ({ value: undefined }) as any);
  on("fs.exists", (_$: any, e: any) => ({ value: e.path in fake.files }) as any);
  on("fs.read", (_$: any, e: any) => ({ value: fake.files[e.path] ?? "" }) as any);
  on("fs.write", (_$: any, e: any) => {
    fake.files[e.path] = e.text;
    return { value: undefined } as any;
  });
  on("ui.toast", () => ({ value: undefined }) as any);
  // What another mod (usage-band) drew in the same band; fuse must keep it.
  on("ui.render", () => ({ type: "Text", props: {}, children: ["BELOW-MOD"] }) as any);
  // The wait between key checks: a short sleep process on the fake clock.
  on("process.run", async () => {
    await clock.sleep(400);
    return { value: { exitCode: 0, stdout: "", stderr: "" } } as any;
  });
  return { fake, clock };
}

const statsFile = (fake: { files: Record<string, string> }) =>
  Object.entries(fake.files).find(([path]) => path.split("\\").join("/").endsWith(".claude/fuse-stats.jsonl"))?.[1];

const startTurn = ($: any, id = "t1") => $.turn.start({ text: "go", turnId: id } as any);
const call = ($: any, command = "ls", extra: object = {}) =>
  $.tool.call({ tool: "Bash", command, tool_use_id: `u-${command}`, ...extra } as any);
const finish = ($: any, id = "t1", isAborted = false) =>
  $.turn.complete({ answer: "", durationMs: 1, isAborted, turnId: id, reason: "completed" } as any);
const band = ($: any, columns = 120) =>
  $.ui.mount({
    plugin: "fuse",
    surface: "terminal",
    component: "AbovePrompt",
    props: { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: columns },
  } as any);
const pane = ($: any) =>
  $.ui.mount({
    plugin: "fuse",
    surface: "terminal",
    component: "Pane",
    requestId: "fuse-hold",
    props: { title: "Fuse", isFocused: true, bodyColumns: 80 },
  } as any);

// Lets a held call reach the point where it waits for the person.
const settleHold = async (clock: any) => {
  await clock.settle();
  await clock.advance(450);
};

// ---- pure: stages, bar, meters ----------------------------------------------

const base = { startedAt: 0, nowAt: 0, baseTokens: 0, tokens: 0, window: 100, calls: 0, extensions: 0, pausedMs: 0, pausedAt: null, isStopped: false };
const limits = { minutes: 45, calls: 100, context: 40, maxExtensions: 2 };

describe("fuse core", () => {
  test("Esc, or any close by the person, on the hold pane is Stop", () => {
    // The kit cannot raise ui.close, so the hook's one decision is tested here.
    expect(isEscapeStop("fuse-hold", { kind: "person" })).toBe(true);
    expect(isEscapeStop("fuse-hold", { kind: "plugin" })).toBe(false);
    expect(isEscapeStop("other", { kind: "person" })).toBe(false);
  });

  test("stage and spark for each band", () => {
    const sym = symbolsFor({});
    const cases: [number, string, string][] = [
      [12, "Lit", "✦"],
      [45, "Burning", "✦"],
      [72, "Short", "✧"],
      [91, "Hissing", "✸"],
      [100, "HELD", "✹"],
    ];
    for (const [pct, stage, spark] of cases) {
      expect(stageOf(pct)).toBe(stage);
      expect(sym.spark[stage as "Lit"]).toBe(spark);
    }
    expect(stageOf(29.9)).toBe("Lit");
    expect(stageOf(30)).toBe("Burning");
    expect(stageOf(59.9)).toBe("Burning");
    expect(stageOf(60)).toBe("Short");
    expect(stageOf(84.9)).toBe("Short");
    expect(stageOf(85)).toBe("Hissing");
  });

  test("the bar is 16 cells and matches the spec's examples", () => {
    const sym = symbolsFor({});
    const bar = (pct: number) => barText(barParts(pct, 16, sym));
    expect(bar(12)).toBe("··✦~~~~~~~~~~~~◉");
    expect(bar(45)).toBe("······✦~~~~~~~~◉");
    expect(bar(72)).toBe("··········✧~~~~◉");
    expect(bar(91)).toBe("·············✸~◉");
    expect(bar(100)).toBe("··············✹ ");
    for (const pct of [0, 12, 45, 72, 91, 100]) expect([...bar(pct)].length).toBe(16);
    expect(barParts(12, 16, sym).map(p => p.color)).toEqual(["ash", "spark", "ember", "rope", "bomb"]);
  });

  test("ascii and emoji symbols", () => {
    expect(barText(barParts(12, 16, symbolsFor({ ascii: true })))).toBe("..*~~~~~~~~~~~~O");
    expect(barText(barParts(100, 16, symbolsFor({ emoji: true })))).toContain("💥");
    expect(barText(barParts(12, 16, symbolsFor({ emoji: true })))).toContain("💣");
  });

  test("the nearest meter is the fullest one", () => {
    expect(measure({ ...base, calls: 91 }, limits, 0).nearest).toBe("calls");
    expect(measure({ ...base, calls: 10 }, limits, 20 * 60_000).nearest).toBe("minutes");
    expect(measure({ ...base, calls: 10, tokens: 29 }, limits, 60_000).nearest).toBe("context");
  });

  test("growth never goes negative", () => {
    expect(measure({ ...base, baseTokens: 50, tokens: 20 }, limits, 0).growth).toBe(0);
  });

  test("the clock stops while the pane is open", () => {
    expect(elapsedMs({ ...base, pausedAt: 10 * 60_000 }, 30 * 60_000)).toBe(10 * 60_000);
    expect(elapsedMs({ ...base, pausedMs: 20 * 60_000 }, 30 * 60_000)).toBe(10 * 60_000);
  });
});

const small = { options: { toolCalls: 2 } };

// ---- the mod, through the engine --------------------------------------------

describe("fuse bar", () => {
  test("shows the stage, percent and nearest meter while a turn runs", async ($, on) => {
    engine($, on);
    await startTurn($);
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /Lit/ })).toBeDefined();
    for (let i = 0; i < 12; i++) await call($, `c${i}`);
    expect(await ui.find({ type: "Text", text: /12%/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /calls 12\/100/ })).toBeDefined();
    await ui.unmount();
  });

  test("each stage's word appears at its calls count", async ($, on) => {
    engine($, on);
    await startTurn($);
    const ui = await band($);
    const stops: [number, RegExp][] = [[30, /Burning/], [60, /Short/], [85, /Hissing/]];
    let n = 0;
    for (const [calls, word] of stops) {
      while (n < calls) await call($, `c${n++}`);
      expect(await ui.find({ type: "Text", text: word })).toBeDefined();
    }
    await ui.unmount();
  });

  test("context growth meter reads the fake usage", async ($, on) => {
    const { fake } = engine($, on);
    await startTurn($);
    const ui = await band($);
    fake.tokens = 10_000 + 58_000; // +29% of the 200k window
    await call($, "grow");
    expect(await ui.find({ type: "Text", text: /context 29% of 40%/ })).toBeDefined();
    await ui.unmount();
  });

  test("narrow terminals: 8-cell bar and percent, then spark and percent only", async ($, on) => {
    engine($, on);
    await startTurn($);
    for (let i = 0; i < 45; i++) await call($, `c${i}`);
    const mid = await band($, 50);
    expect(await mid.find({ type: "Text", text: /45%/ })).toBeDefined();
    expect(await mid.find({ type: "Text", text: /calls/ })).toBeUndefined();
    await mid.unmount();
    const tiny = await band($, 30);
    expect(await tiny.find({ type: "Text", text: /✦ 45%/ })).toBeDefined();
    await tiny.unmount();
  });

  test("between turns the last burn shows until the next turn", async ($, on) => {
    const { fake } = engine($, on);
    await startTurn($);
    for (let i = 0; i < 38; i++) await call($, `c${i}`);
    await finish($);
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /last burn/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /38%/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /38 calls/ })).toBeDefined();
    await startTurn($, "t2");
    expect(await ui.find({ type: "Text", text: /last burn/ })).toBeUndefined();
    expect(statsFile(fake)).toBeDefined();
    await ui.unmount();
  });

  test("a stats line carries the three numbers", async ($, on) => {
    const { fake } = engine($, on);
    await startTurn($);
    await call($, "a");
    await finish($);
    const row = JSON.parse(statsFile(fake)!.trim().split("\n")[0]!);
    expect(row.calls).toBe(1);
    expect(Object.keys(row)).toContain("minutes");
    expect(Object.keys(row)).toContain("growth");
  });
});

describe("fuse hold", () => {
  test("holds the next call at 100%; Stop denies it and the rest of the turn", small, async ($, on) => {
    const { fake, clock } = engine($, on);
    await startTurn($);
    await call($, "a");
    await call($, "b");
    const held = call($, "c");
    await settleHold(clock);
    const ui = await pane($);
    expect(await ui.find({ type: "Text", text: /FUSE HELD/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /calls 2\/2/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /Bash  c/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /Esc stops the turn/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /↻ 2 of 2 left/ })).toBeDefined();
    expect(fake.ran).toEqual(["a", "b"]); // the held call has not run
    await $.ui.press({ plugin: "fuse", key: "stop" } as any);
    await clock.advance(900);
    const result: any = await held;
    expect(result.deny).toBe("The user stopped this turn. List what you changed and what is left. Do not edit more.");
    const again: any = await call($, "d");
    expect(again.deny).toContain("stopped this turn");
    await ui.unmount();
  });

  test("two calls held together are stopped by one Stop", small, async ($, on) => {
    const { fake, clock } = engine($, on);
    await startTurn($);
    await call($, "a");
    await call($, "b");
    // two parallel tool calls in one message: the second waits on the first's answer
    const one = call($, "c1");
    const two = call($, "c2");
    await settleHold(clock);
    const ui = await pane($);
    await $.ui.press({ plugin: "fuse", key: "stop" } as any);
    await clock.advance(900);
    expect(((await one) as any).deny).toContain("stopped this turn");
    await clock.advance(900);
    expect(((await two) as any).deny).toContain("stopped this turn");
    expect(fake.ran).toEqual(["a", "b"]);
    await ui.unmount();
  });

  test("Extend twice, then only Stop", small, async ($, on) => {
    const { clock } = engine($, on);
    await startTurn($);
    await call($, "a");
    await call($, "b");

    for (const n of [1, 2]) {
      const held = call($, `x${n}`);
      await settleHold(clock);
      const ui = await pane($);
      expect(await ui.find({ type: "Button", key: "extend" })).toBeDefined();
      expect(await ui.find({ type: "Text", text: new RegExp(`↻ ${3 - n} of 2 left`) })).toBeDefined();
      await $.ui.press({ plugin: "fuse", key: "extend" } as any);
      await clock.advance(900);
      expect(((await held) as any).deny).toBeUndefined();
      await ui.unmount();
    }

    const third = call($, "last");
    await settleHold(clock);
    const ui = await pane($);
    expect(await ui.find({ type: "Button", key: "extend" })).toBeUndefined();
    expect(await ui.find({ type: "Button", key: "stop" })).toBeDefined();
    await $.ui.press({ plugin: "fuse", key: "stop" } as any);
    await clock.advance(900);
    expect(((await third) as any).deny).toContain("stopped this turn");
    await ui.unmount();
  });

  test("the clock is paused while the pane is open", small, async ($, on) => {
    const { fake, clock } = engine($, on);
    await startTurn($);
    await call($, "a");
    await call($, "b");
    const held = call($, "c");
    await settleHold(clock);
    const paneUi = await pane($);
    await clock.advance(5 * 60_000); // far past the hook's 10 s budget; the hold keeps waiting
    await $.ui.press({ plugin: "fuse", key: "extend" } as any);
    await clock.advance(900);
    expect(((await held) as any).deny).toBeUndefined();
    await paneUi.unmount();
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /spliced 1×/ })).toBeDefined();
    await ui.unmount();
    await finish($);
    // the 5 minutes spent deciding did not count against the minutes meter
    expect(JSON.parse(statsFile(fake)!.trim().split("\n")[0]!).minutes).toBeLessThan(0.5);
  });

  test("at the limit the bar reads HELD with one ✹", small, async ($, on) => {
    engine($, on);
    await startTurn($);
    await call($, "a");
    await call($, "b");
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /HELD/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /100%/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: "✹" })).toBeDefined();
    expect(await ui.find({ type: "Text", text: "◉" })).toBeUndefined();
    await ui.unmount();
  });

  test("subagent calls are counted by default", small, async ($, on) => {
    engine($, on);
    await startTurn($);
    await call($, "a", { agentId: "sub-1" });
    await call($, "b", { agentId: "sub-1" });
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /calls 2\// })).toBeDefined();
    await ui.unmount();
  });
});

describe("fuse shares the band", () => {
  test("keeps what another mod drew above it", async ($, on) => {
    engine($, on);
    await startTurn($);
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /BELOW-MOD/ })).toBeDefined();
    expect(await ui.find({ type: "Text", text: /Lit/ })).toBeDefined();
    await ui.unmount();
  });
});

describe("fuse settings", () => {
  test("a small call limit, set in options, holds sooner", { options: { toolCalls: 2 } }, async ($, on) => {
    const { clock } = engine($, on);
    await startTurn($);
    await call($, "a");
    await call($, "b");
    const held = call($, "c");
    await settleHold(clock);
    const ui = await pane($);
    await $.ui.press({ plugin: "fuse", key: "stop" } as any);
    await clock.advance(900);
    expect(((await held) as any).deny).toContain("stopped");
    await ui.unmount();
  });

  test("ascii: . * ~ O", { options: { ascii: true } }, async ($, on) => {
    engine($, on);
    await startTurn($);
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: "O" })).toBeDefined();
    expect(await ui.find({ type: "Text", text: "◉" })).toBeUndefined();
    await ui.unmount();
  });

  test("subagent calls are ignored when the setting is off", { options: { countSubagents: false } }, async ($, on) => {
    engine($, on);
    await startTurn($);
    await call($, "a", { agentId: "sub-1" });
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /calls 0\// })).toBeDefined();
    await ui.unmount();
  });
});

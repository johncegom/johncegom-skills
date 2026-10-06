import { describe, expect, test } from "claude-code/testing";

const band = ($: any) =>
  $.ui.mount({
    plugin: "skill-badge",
    surface: "terminal",
    component: "AbovePrompt",
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 },
  } as any);

// Answers for the engine beneath the plugin.
function engine($: any, on: any) {
  on("session.start", ($: any, e: any) => ({ cwd: e.cwd }));
  on("prompt.submit", (_$: any, e: any) => ({ text: e.text }));
  on("ui.render", () => ({ type: "Box", props: {}, children: [] }));
  on("skill.prompt", (_$: any, e: any) => ({ text: e.text }));
  on("session.compact", (_$: any, e: any) => ({ messages: e.messages }) as any);
  on("session.end", (_$: any, e: any) => ({ sessionId: e.sessionId }) as any);
}

const start = ($: any) => $.session.start({ surface: "terminal", isInteractive: true, cwd: "/work" } as any);
const load = ($: any, skill: string) => $.skill.prompt({ skill, text: "body" } as any);

describe("skill-badge", () => {
  test("shows nothing before any skill loads", async ($, on) => {
    engine($, on);
    await start($);
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /Skills loaded/ })).toBeUndefined();
    await ui.unmount();
  });

  test("lists a loaded skill and marks it new this turn", async ($, on) => {
    engine($, on);
    await start($);
    await $.prompt.submit({ text: "go" } as any);
    await load($, "sound-human");
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /Skills loaded: sound-human · new this turn: sound-human/ })).toBeDefined();
    await ui.unmount();
  });

  test("a skill stays listed on later turns, no longer new", async ($, on) => {
    engine($, on);
    await start($);
    await $.prompt.submit({ text: "one" } as any);
    await load($, "learn-technology-by-building");
    await $.prompt.submit({ text: "two" } as any);
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /Skills loaded: learn-technology-by-building$/ })).toBeDefined();
    await ui.unmount();
  });

  test("a compact marks loaded skills with a question mark", async ($, on) => {
    engine($, on);
    await start($);
    await $.prompt.submit({ text: "go" } as any);
    await load($, "sound-human");
    await $.session.compact({ trigger: "manual", messages: [{ role: "user", text: "x", toolUses: [] }] } as any);
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /sound-human\?/ })).toBeDefined();
    await ui.unmount();
  });

  test("a /clear forgets everything", async ($, on) => {
    engine($, on);
    await start($);
    await $.prompt.submit({ text: "go" } as any);
    await load($, "sound-human");
    await $.session.end({ reason: "clear", sessionId: "s1" } as any);
    const ui = await band($);
    expect(await ui.find({ type: "Text", text: /Skills loaded/ })).toBeUndefined();
    await ui.unmount();
  });
});

// Seeded property tests for chain-reader.mjs. Offline: RPC is a small in-memory chain model, so every result
// is compared with an oracle computed independently from the same random data.
// Run: node --test scripts/chain-reader.fuzz.test.mjs
// Reproduce a failure: CHAIN_FUZZ_SEED=<seed from the message> CHAIN_FUZZ_ROUNDS=<n> node --test ...
import test from "node:test";
import assert from "node:assert/strict";
import { EvmReader, SolanaReader, classifyRpcError, checkInput, formatUnits, decodeString, tokenDeltas, RpcPool } from "./chain-reader.mjs";

const SEED = Number(process.env.CHAIN_FUZZ_SEED ?? 20261026);
const ROUNDS = Number(process.env.CHAIN_FUZZ_ROUNDS ?? 150);

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Each test gets its own stream and every failure message carries seed and round.
function fuzz(name, fn, rounds = ROUNDS) {
  test(name, async () => {
    for (let round = 0; round < rounds; round++) {
      const seed = SEED + round;
      const r = rng(seed);
      const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
      const pick = (xs) => xs[ri(0, xs.length - 1)];
      try { await fn({ r, ri, pick }); }
      catch (e) { e.message = `[seed ${seed}, round ${round}] ${e.message}`; throw e; }
    }
  });
}
const hex = (r, n) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join("");
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const b58 = (r, n) => Array.from({ length: n }, () => B58[Math.floor(r() * B58.length)]).join("");

// ---------- pure functions ----------

fuzz("formatUnits: reading the string back gives the same integer, with no padding zeros", ({ r, ri }) => {
  const dec = ri(0, 36);
  let v = BigInt("0x" + hex(r, ri(1, 50)));
  if (r() < 0.3) v = -v;
  const s = formatUnits(v, dec);
  const m = /^(-?)(0|[1-9]\d*)(?:\.(\d*[1-9]))?$/.exec(s);
  assert.ok(m, `bad shape: ${s}`);
  const frac = (m[3] ?? "").padEnd(dec, "0");
  const back = BigInt(m[2] + frac) * (m[1] ? -1n : 1n);
  assert.equal(back, v, `${v} @${dec} -> ${s}`);
  assert.ok((m[3] ?? "").length <= dec);
});

fuzz("decodeString: ABI strings and bytes32 round-trip for printable text", ({ r, ri }) => {
  const text = Array.from({ length: ri(1, 40) }, () => String.fromCharCode(ri(33, 126))).join("");
  const body = Buffer.from(text).toString("hex");
  const abi = "0x" + "20".padStart(64, "0") + text.length.toString(16).padStart(64, "0") + body.padEnd(Math.ceil(body.length / 64) * 64, "0");
  assert.equal(decodeString(abi), text);
  if (text.length <= 32) assert.equal(decodeString("0x" + body.padEnd(64, "0")), text);
});

fuzz("checkInput: valid shapes pass, one-character corruption fails", ({ r, ri, pick }) => {
  const evm = "0x" + Array.from({ length: 40 }, () => pick([..."0123456789abcdefABCDEF"])).join("");
  assert.equal(checkInput("evm", evm, "a"), evm);
  assert.throws(() => checkInput("evm", evm.slice(0, ri(2, 41)), "a"));
  assert.throws(() => checkInput("evm", evm + "0", "a"));
  assert.throws(() => checkInput("evm", evm.slice(0, 5) + "g" + evm.slice(6), "a"));
  const sol = b58(r, ri(32, 44));
  assert.equal(checkInput("sol", sol, "a"), sol);
  assert.throws(() => checkInput("sol", sol + pick(["0", "O", "I", "l"]), "a"));
  assert.throws(() => checkInput("sol", b58(r, ri(1, 31)), "a"));
  assert.throws(() => checkInput("sol", b58(r, 45), "a"));
  assert.throws(() => checkInput("evm", undefined, "a"));
});

fuzz("classifyRpcError: total on any input, and range always wins over rate/archive wording", ({ r, ri, pick }) => {
  const junk = Array.from({ length: ri(0, 60) }, () => String.fromCodePoint(pick([ri(32, 126), ri(0x4e00, 0x4e50), ri(0x1f600, 0x1f64f)]))).join("");
  assert.ok(["range", "archive", "rate", "other"].includes(classifyRpcError(junk)));
  // Each phrase must be recognised on its own wording, so none of them may contain another phrase's keywords.
  const range = pick(["block range too large", `ranges over ${ri(100, 99999)} blocks`, "ranges over 10000 blocks are not supported on free plan", "query returned more than 10000 results", "exceeds max block range"]);
  const noise = pick(["rate limit", "limit", "archive", "too many requests", "try again", ""]);
  assert.equal(classifyRpcError(`${noise} ${range} ${noise}`), "range", `${noise} | ${range}`);
  assert.equal(classifyRpcError(`${pick(["rate limit exceeded", "limited to 10 requests per second", "too many requests"])} ${junk.replace(/range|block/gi, "")}`) === "range", false);
});

fuzz("tokenDeltas: deltas equal post minus pre per owner and mint, no zero entries, mints never mix", ({ r, ri, pick }) => {
  const owners = ["O1", "O2", "O3", "O4"], mints = ["M1", "M2"];
  const n = ri(1, 8), pre = [], post = [], expect = new Map();
  for (let i = 0; i < n; i++) {
    const owner = pick(owners), mint = pick(mints), a = ri(0, 5), b = ri(0, 5);
    pre.push({ accountIndex: i, owner, mint, uiTokenAmount: { uiAmountString: String(a) } });
    post.push({ accountIndex: i, owner, mint, uiTokenAmount: { uiAmountString: String(b) } });
    expect.set(owner + "|" + mint, (expect.get(owner + "|" + mint) ?? 0) + (b - a));
  }
  const got = tokenDeltas({ meta: { preTokenBalances: pre, postTokenBalances: post } });
  const want = [...expect].filter(([, d]) => d !== 0);
  assert.equal(got.length, want.length);
  for (const g of got) assert.equal(g.delta, expect.get(g.owner + "|" + g.mint));
});

// ---------- Solana flows against an in-memory ledger ----------

const WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const OTHER_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const COUNTERPARTIES = ["CP1", "CP2", "CP3", "CP4"];
const sTx = (mint, rows, types) => ({
  meta: { preTokenBalances: rows.map((b, i) => ({ accountIndex: i, owner: b.owner, mint, uiTokenAmount: { uiAmountString: String(b.pre) } })),
          postTokenBalances: rows.map((b, i) => ({ accountIndex: i, owner: b.owner, mint, uiTokenAmount: { uiAmountString: String(b.post) } })), innerInstructions: [] },
  transaction: { message: { instructions: types.map((type) => ({ parsed: { type } })) } },
});

fuzz("Solana flows: totals, truncation, sampling and missing counts match an oracle (1-2 token accounts, since, limit, stride)", async ({ r, ri, pick }) => {
  const n = ri(0, 40), T0 = 1_760_000_000;
  const txs = {}, items = [];
  for (let i = 0; i < n; i++) {
    const sig = "sig" + i, kind = pick(["in", "in", "out", "burn", "burn", "noise"]), a = ri(1, 50), cp = pick(COUNTERPARTIES);
    const types = [kind === "burn" ? pick(["burn", "burnChecked"]) : "transfer"];
    let tx;
    if (kind === "in") tx = sTx(MINT, [{ owner: cp, pre: 100, post: 100 - a }, { owner: WALLET, pre: 0, post: a }], types);
    else if (kind === "out") tx = sTx(MINT, [{ owner: WALLET, pre: 100, post: 100 - a }, { owner: cp, pre: 0, post: a }], types);
    else if (kind === "burn") tx = sTx(MINT, [{ owner: WALLET, pre: 100, post: 100 - a }], types);
    else tx = sTx(OTHER_MINT, [{ owner: cp, pre: 9, post: 1 }, { owner: WALLET, pre: 0, post: 8 }], types);
    items.push({ sig, time: T0 + i * 60, kind, a, cp, missing: r() < 0.1 });
    txs[sig] = tx;
  }
  const accts = r() < 0.5 ? ["ATA1"] : ["ATA1", "ATA2"];
  const sigsBy = Object.fromEntries(accts.map((a) => [a, []]));
  for (const it of items) { // each tx lands on one account, sometimes on both (overlap must be de-duplicated)
    const on = accts.length === 1 || r() < 0.3 ? accts : [pick(accts)];
    for (const a of on) sigsBy[a].push({ signature: it.sig, blockTime: it.time });
  }
  const since = r() < 0.5 && n ? T0 + ri(0, n - 1) * 60 : null, limit = ri(1, 45), stride = pick([1, 1, 2, 3]);
  const pool = {
    eps: [1],
    call: async (m, p) => {
      if (m === "getTokenAccountsByOwner") return { value: accts.map((pubkey) => ({ pubkey })) };
      if (m === "getSignaturesForAddress") {
        const [a, { limit: lim, before }] = p;
        const list = [...sigsBy[a]].sort((x, y) => y.blockTime - x.blockTime);
        const from = before ? list.findIndex((s) => s.signature === before) + 1 : 0;
        return list.slice(from, from + lim);
      }
      if (m === "getTransaction") return items.find((i) => i.sig === p[0] && !i.missing) ? txs[p[0]] : null;
      throw new Error("unexpected " + m);
    },
  };
  const out = await new SolanaReader(pool).flows(WALLET, { token: MINT, since: since ? new Date(since * 1000).toISOString() : undefined, limit, stride });

  const inWindow = items.filter((i) => !since || i.time >= since).sort((x, y) => y.time - x.time);
  const cut = inWindow.slice(0, limit), sampled = cut.filter((_, i) => i % stride === 0);
  const inflow = {}, outflow = {};
  let burned = 0, missing = 0;
  for (const it of sampled) {
    if (it.missing) { missing++; continue; }
    if (it.kind === "in") inflow[it.cp] = (inflow[it.cp] ?? 0) + it.a;
    if (it.kind === "out") outflow[it.cp] = (outflow[it.cp] ?? 0) + it.a;
    if (it.kind === "burn") burned += it.a;
  }
  assert.deepEqual(out.inflow, inflow);
  assert.deepEqual(out.outflow, outflow);
  assert.equal(out.burned, burned);
  assert.equal(out.missing, missing);
  assert.equal(out.scanned, sampled.length);
  assert.equal(out.truncated, inWindow.length > limit, `window ${inWindow.length}, limit ${limit}`);
  assert.equal(out.note.some((x) => x.startsWith("TRUNCATED")), out.truncated);
  assert.equal(out.note.some((x) => x.startsWith("SAMPLE")), stride > 1);
}, ROUNDS * 2);

// ---------- EVM flows against an in-memory chain with a log-range cap ----------

const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO = "0x" + "0".repeat(40), DEAD = "0x" + "0".repeat(36) + "dead";
const T0E = 1_700_000_000, HEAD = 60_000, TOKEN = "0x" + "11".repeat(20);
const abiStr = (s) => "0x" + "20".padStart(64, "0") + s.length.toString(16).padStart(64, "0") + Buffer.from(s).toString("hex").padEnd(64, "0");
const topicOf = (a) => "0x" + "0".repeat(24) + a.slice(2);

fuzz("EVM flows: every in-range log is counted once whatever the endpoint's range cap, and totals match an oracle", async ({ r, ri, pick }) => {
  const people = [0, 1, 2, 3, 4].map(() => "0x" + hex(r, 40)), me = people[0];
  const logs = [], nLogs = ri(0, 120);
  for (let i = 0; i < nLogs; i++) {
    const from = pick([...people, ZERO]), to = pick([...people, ZERO, DEAD, me, me]);
    logs.push({ address: TOKEN, blockNumber: "0x" + ri(0, HEAD).toString(16), transactionHash: "0x" + hex(r, 64), logIndex: "0x" + i.toString(16), topics: [TRANSFER, topicOf(from), topicOf(to)], data: "0x" + BigInt(ri(1, 1e9)).toString(16).padStart(64, "0"), _from: from, _to: to });
    logs[i]._v = BigInt(logs[i].data);
  }
  const cap = ri(50, 6000), startBlock = ri(0, HEAD - 1);
  let rangeErrors = 0;
  const pool = {
    eps: [1],
    call: async (m, p) => {
      if (m === "eth_blockNumber") return "0x" + HEAD.toString(16);
      if (m === "eth_getBlockByNumber") return { timestamp: "0x" + (T0E + 12 * parseInt(p[0], 16)).toString(16) };
      if (m === "eth_call") {
        const d = p[0].data;
        if (d === "0x313ce567") return "0x" + (6).toString(16).padStart(64, "0");
        if (d === "0x06fdde03" || d === "0x95d89b41") return abiStr("TKN");
        if (d === "0x18160ddd") return "0x" + (10n ** 12n).toString(16).padStart(64, "0");
      }
      if (m === "eth_getLogs") {
        const [f] = p, lo = parseInt(f.fromBlock, 16), hi = parseInt(f.toBlock, 16);
        if (hi - lo + 1 > cap) { rangeErrors++; throw Object.assign(new Error(`ranges over ${cap} blocks are not supported`), { fatal: true, range: true }); }
        const hit = logs.filter((l) => {
          const b = parseInt(l.blockNumber, 16);
          return b >= lo && b <= hi && (f.topics[1] === undefined || f.topics[1] === null || l.topics[1] === f.topics[1]) && (f.topics[2] === undefined || f.topics[2] === null || l.topics[2] === f.topics[2]);
        });
        return r() < 0.2 && hit.length ? [...hit, hit[0]] : hit; // a flaky provider can repeat a log: it must still count once
      }
      throw new Error("unexpected " + m);
    },
  };
  const since = new Date((T0E + 12 * startBlock) * 1000).toISOString();
  const out = await new EvmReader(pool, { chain: "base" }).flows(me, { token: TOKEN, since, limit: 5000 });

  const inf = {}, outf = {};
  let burned = 0n, count = 0, touching = 0;
  for (const l of logs) {
    if (parseInt(l.blockNumber, 16) < startBlock) continue;
    if (l._to === me || l._from === me) touching++; // a self-transfer shows up in both queries and must be read once
    if (l._to === me && l._from !== me) { count++; inf[l._from] = (inf[l._from] ?? 0n) + l._v; }
    else if (l._from === me && l._to !== me) { count++; if (l._to === ZERO || l._to === DEAD) burned += l._v; else outf[l._to] = (outf[l._to] ?? 0n) + l._v; }
  }
  const fmt = (m, zeroKey) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k === ZERO && zeroKey ? "(mint)" : k, formatUnits(v, 6)]));
  assert.deepEqual(out.inflow, fmt(inf, true));
  assert.deepEqual(out.outflow, fmt(outf, false));
  assert.equal(out.burned, formatUnits(burned, 6));
  assert.equal(out.logsRead, touching, "each log read exactly once");
  assert.equal(out.reachedStart, true);
  assert.equal(out.fromBlock, startBlock);
  assert.ok(out.note.every((x) => !x.startsWith("TRUNCATED")));
  if (cap < HEAD) assert.ok(out.halvings >= 0);
}, ROUNDS);

// ---------- RpcPool error handling ----------

fuzz("RpcPool: fatal errors fail on the first call, never retry, and never expose the endpoint path", async ({ r, ri, pick }) => {
  const realFetch = globalThis.fetch;
  const msg = pick(["execution reverted", "invalid params", "unknown method", "ranges over 100 blocks are not supported on free plan", "block range too large"]) + " " + hex(r, ri(0, 8));
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { status: 200, headers: new Headers(), json: async () => ({ error: { code: -32000, message: msg } }) }; };
  try {
    const secret = "KEY" + hex(r, 12);
    const pool = new RpcPool({ endpoints: [`http://localhost:1/v2/${secret}`] });
    await assert.rejects(pool.call("eth_call", []), (e) => {
      assert.equal(Boolean(e.fatal), true);
      assert.equal(Boolean(e.range), classifyRpcError(JSON.stringify({ code: -32000, message: msg })) === "range");
      return !e.message.includes(secret);
    });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = realFetch; }
}, 40);

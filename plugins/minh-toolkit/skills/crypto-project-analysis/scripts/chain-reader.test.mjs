// Offline self-test for chain-reader.mjs. Run: node --test scripts/chain-reader.test.mjs
// No network: RPC calls are answered by small fixtures. Each test names the bug it guards against.
import test from "node:test";
import assert from "node:assert/strict";
import { TOKEN_PROGRAMS, RpcPool, SolanaReader, EvmReader, classifyRpcError, checkInput, formatUnits, decodeString, tokenDeltas, instructionTypes } from "./chain-reader.mjs";

const WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
const OTHER = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1";
const ATA = "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi";
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Parsed Solana transaction in the shape getTransaction(jsonParsed) returns.
const solTx = (balances, types = ["transfer"]) => ({
  meta: { preTokenBalances: balances.map((b, i) => ({ accountIndex: i, owner: b.owner, mint: MINT, uiTokenAmount: { uiAmountString: String(b.pre) } })),
          postTokenBalances: balances.map((b, i) => ({ accountIndex: i, owner: b.owner, mint: MINT, uiTokenAmount: { uiAmountString: String(b.post) } })),
          innerInstructions: [] },
  transaction: { message: { instructions: types.map((type) => ({ parsed: { type } })) } },
});

test("classifyRpcError: range wording seen on free plans is a range error, not fatal-unknown", () => {
  assert.equal(classifyRpcError('{"message":"ranges over 10000 blocks are not supported on free plan","code":35}'), "range");
  assert.equal(classifyRpcError("block range too large"), "range");
});
test("classifyRpcError: rate-limit and archive wording are not mistaken for range errors", () => {
  assert.equal(classifyRpcError("eth_getLogs rate limit exceeded"), "rate");
  assert.equal(classifyRpcError("limited to 10 requests per second"), "rate");
  assert.equal(classifyRpcError("this is an archive request, upgrade your plan"), "archive");
  assert.equal(classifyRpcError("execution reverted"), "other");
});

test("checkInput rejects wrong-length addresses instead of building a wrong topic", () => {
  assert.throws(() => checkInput("evm", "0x1234", "address"));
  assert.throws(() => checkInput("sol", "0xdead", "address"));
  assert.equal(checkInput("evm", "0x" + "ab".repeat(20), "address"), "0x" + "ab".repeat(20));
  assert.equal(checkInput("sol", WALLET, "address"), WALLET);
});

test("formatUnits keeps precision and handles zero and small values", () => {
  assert.equal(formatUnits(1234567n, 6), "1.234567");
  assert.equal(formatUnits(5n, 6), "0.000005");
  assert.equal(formatUnits(0n, 18), "0");
  assert.equal(formatUnits(2n * 10n ** 18n, 18), "2");
});
test("decodeString reads an ABI string and a bytes32 string", () => {
  const abi = "0x" + "20".padStart(64, "0") + "4".padStart(64, "0") + Buffer.from("USDC").toString("hex").padEnd(64, "0");
  assert.equal(decodeString(abi), "USDC");
  assert.equal(decodeString("0x" + Buffer.from("MKR").toString("hex").padEnd(64, "0")), "MKR");
  assert.equal(decodeString("0x"), null);
});

test("tokenDeltas / instructionTypes: burnChecked is visible to the caller", () => {
  const tx = solTx([{ owner: WALLET, pre: 10, post: 0 }], ["burnChecked"]);
  assert.deepEqual(tokenDeltas(tx), [{ owner: WALLET, mint: MINT, delta: -10 }]);
  assert.deepEqual(instructionTypes(tx), ["burnChecked"]);
});

// Mock pool: answers by method, records calls.
function mockPool(handlers) {
  const calls = [];
  return { eps: [1], calls, call: async (m, p) => { calls.push([m, p]); return handlers[m](p); } };
}

test("Solana flows: incoming transfers live on the token account, so the account is scanned too", async () => {
  const sigsByAddr = { [WALLET]: [], [ATA]: [{ signature: "s1", blockTime: 1760000000 }, { signature: "s2", blockTime: 1760000100 }] };
  const txs = {
    s1: solTx([{ owner: OTHER, pre: 100, post: 60 }, { owner: WALLET, pre: 0, post: 40 }]),
    s2: solTx([{ owner: WALLET, pre: 40, post: 30 }], ["burnChecked"]),
  };
  const pool = mockPool({
    getTokenAccountsByOwner: () => ({ value: [{ pubkey: ATA }] }),
    getSignaturesForAddress: ([a]) => sigsByAddr[a],
    getTransaction: ([sig]) => txs[sig],
  });
  const r = await new SolanaReader(pool).flows(WALLET, { token: MINT, limit: 50 });
  assert.equal(r.accountsScanned, 1, "scan the token account, not the wallet address");
  assert.equal(r.inflow[OTHER], 40, "the inflow from the token-account-only transaction must be found");
  assert.equal(r.burned, 10, "burnChecked must count as a burn, not as an outflow to (unknown)");
  assert.deepEqual(r.outflow, {});
  assert.equal(r.truncated, false);
});

test("Solana flows: a sample and a cut-off scan say so in the result", async () => {
  const many = Array.from({ length: 5 }, (_, i) => ({ signature: "s" + i, blockTime: 1760000000 + i }));
  const pool = mockPool({
    getTokenAccountsByOwner: () => ({ value: [] }),
    getSignaturesForAddress: () => many,
    getTransaction: () => solTx([{ owner: WALLET, pre: 0, post: 1 }]),
  });
  const r = await new SolanaReader(pool).flows(WALLET, { token: MINT, limit: 3, stride: 2 });
  assert.equal(r.truncated, true);
  assert.ok(r.note.some((n) => n.startsWith("SAMPLE")));
  assert.ok(r.note.some((n) => n.startsWith("TRUNCATED")));
});

test("EVM tokenInfo: a non-token address is an error, never decimals 0 or 18", async () => {
  const pool = mockPool({ eth_call: () => "0x" });
  await assert.rejects(new EvmReader(pool, { chain: "base" }).tokenInfo("0x" + "00".repeat(19) + "01"), /not an ERC-20/);
  const loose = await new EvmReader(pool).tokenInfo("0x" + "00".repeat(19) + "01", { strict: false });
  assert.equal(loose.decimals, null);
});

test("EVM tokenInfo: a failing decimals() call is an error, not a silent 18", async () => {
  const pool = mockPool({ eth_call: ([{ data }]) => { if (data === "0x313ce567") throw new Error("boom"); return "0x"; } });
  await assert.rejects(new EvmReader(pool).tokenInfo("0x" + "11".repeat(20)), /could not read decimals/);
});

test("EVM flows refuses to guess a time window", async () => {
  const pool = mockPool({ eth_call: () => "0x" + (6).toString(16).padStart(64, "0") });
  await assert.rejects(new EvmReader(pool).flows("0x" + "22".repeat(20), { token: "0x" + "11".repeat(20) }), /--since/);
});

test("EVM control: finds owner() and an EIP-1967 implementation, reports null otherwise", async () => {
  const owner = "0x" + "ab".repeat(20), impl = "0x" + "cd".repeat(20);
  const pool = mockPool({
    eth_call: () => "0x" + "0".repeat(24) + owner.slice(2),
    eth_getStorageAt: ([, slot]) => (slot.startsWith("0x360894") ? "0x" + "0".repeat(24) + impl.slice(2) : "0x" + "0".repeat(64)),
  });
  const c = await new EvmReader(pool).control("0x" + "11".repeat(20));
  assert.equal(c.owner, owner);
  assert.equal(c.implementation, impl);
  assert.equal(c.proxyAdmin, null);
  assert.equal(c.isEip1967Proxy, true);
});

test("RpcPool: cache entries are scoped per chain and an error never shows the endpoint path", async () => {
  const realFetch = globalThis.fetch;
  let hits = 0;
  globalThis.fetch = async () => ({ status: 200, headers: new Headers(), json: async () => ({ result: "0x" + (++hits) }) });
  try {
    const cache = new Map();
    const a = new RpcPool({ endpoints: ["http://localhost:1/KEY"], cache, scope: "base" });
    const b = new RpcPool({ endpoints: ["http://localhost:1/KEY"], cache, scope: "ethereum" });
    assert.equal(await a.call("eth_getBlockByNumber", ["0x1"], { cacheable: true }), "0x1");
    assert.equal(await b.call("eth_getBlockByNumber", ["0x1"], { cacheable: true }), "0x2", "other chain must not reuse the cached block");
    assert.equal(await a.call("eth_getBlockByNumber", ["0x1"], { cacheable: true }), "0x1", "same chain reuses it");
    globalThis.fetch = async () => ({ status: 500, headers: new Headers(), json: async () => ({}) });
    const c = new RpcPool({ endpoints: ["http://localhost:1/SECRETKEY"], maxRetries: 0 });
    await assert.rejects(c.call("eth_blockNumber"), (e) => /HTTP 500 from localhost:1/.test(e.message) && !e.message.includes("SECRETKEY"));
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("Solana token program ids are the real ones (a wrong Token-2022 id made summary fail for every wallet)", () => {
  assert.deepEqual(TOKEN_PROGRAMS, ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"]);
});

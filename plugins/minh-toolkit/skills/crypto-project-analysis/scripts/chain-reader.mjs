#!/usr/bin/env node
// chain-reader.mjs — read wallets and tokens on Solana and on EVM chains through PUBLIC RPC, politely.
// Node 18+ (CLI). In a browser console: paste the file and remove the CLI block at the bottom.
//
// Chains
//   solana                                  (own adapter)
//   ethereum base arbitrum optimism bsc polygon avalanche   (one shared EVM adapter)
//   evm  + --rpc <url>                      any other EVM chain (use --native SYMBOL for the coin name)
//
// Why it is built this way
//  - Public RPCs limit requests per IP. We stay under the limit, back off on 429 / Retry-After,
//    and spread the load over several independent endpoints. We do not hide from the limit.
//  - A confirmed transaction or an old log never changes, so it is cached. Re-runs cost 0 requests.
//  - Faster? Add a free API key as an extra endpoint: --rpc <url>, or env RPC_<CHAIN>=<url> (RPC_BASE, RPC_SOLANA ...).
//
// Commands
//   node chain-reader.mjs <chain> summary   <addr> [<addr>...] [--token <tokenAddr> ...]
//   node chain-reader.mjs <chain> txs       <addr> [--limit 20] [--mint <mint>] [--since 2026-08-01] [--stride N]   (solana only)
//   node chain-reader.mjs <chain> flows     <addr> --token <tokenOrMint> --since 2026-08-01 [--limit N] [--stride N]
//                                           (--since is REQUIRED on EVM; --stride is Solana only and gives a sample)
//   node chain-reader.mjs <chain> tokeninfo <token or mint> [--holder <addr> ...]
//                                           (EVM: supply, burn addresses, owner()/proxy probes. Solana: mint and freeze authority, top holders)
//   node chain-reader.mjs <chain> tx        <hashOrSignature>
//   node chain-reader.mjs <chain> code      <addr>                                                        (evm only: contract or wallet?)
//   Options: --rpc <url> (repeatable)  --cache cache.json  --rps 3  --concurrency 3  --native ETH
//   Output is JSON on stdout. Read its "note", "truncated", "covered" and "missing" fields before you trust a total.
//   Error messages show the endpoint host only, never the path or key.
//
// Known limits (read before you trust a result)
//  - EVM JSON-RPC cannot list "all tokens of a wallet" or "all transactions of a wallet".
//    summary needs --token addresses. flows works per token through Transfer logs, in a block range.
//  - Public EVM endpoints cap getLogs ranges and keep limited history. The script halves the range on
//    "range too wide" errors, but an old range can still fail. Add a key or an archive endpoint then.
//  - Native-coin transfers on EVM are not in logs. flows covers token transfers only.
//  - Solana flows follow the wallet's current token accounts for the mint. Closed accounts are not scanned,
//    and a wallet with more than --limit transactions is cut at the newest ones ("truncated": true).
//  - Contract-control probes (owner(), EIP-1967 slots) find the common patterns only. null is not proof of no control.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Endpoint lists were tested on 2026-10-26 (eth_blockNumber, eth_call, eth_getLogs). Public RPCs change often:
// if one dies, pass --rpc <url> or set RPC_<CHAIN>. publicnode refuses old ranges ("archive request"); the pool then
// fails over to the next endpoint.
export const CHAINS = {
  solana: {
    type: "solana", native: "SOL",
    endpoints: ["https://api.mainnet-beta.solana.com", "https://api.mainnet.solana.com", "https://solana-rpc.publicnode.com"], // safety-ok: unlisted-url public RPC endpoints
  },
  ethereum: { type: "evm", native: "ETH", endpoints: ["https://ethereum-rpc.publicnode.com", "https://rpc.flashbots.net", "https://eth.drpc.org", "https://eth.llamarpc.com"] }, // safety-ok: unlisted-url public RPC endpoints
  base: { type: "evm", native: "ETH", endpoints: ["https://base-rpc.publicnode.com", "https://mainnet.base.org"] }, // safety-ok: unlisted-url public RPC endpoints
  arbitrum: { type: "evm", native: "ETH", endpoints: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-one-rpc.publicnode.com"] }, // safety-ok: unlisted-url public RPC endpoints
  optimism: { type: "evm", native: "ETH", endpoints: ["https://mainnet.optimism.io", "https://optimism-rpc.publicnode.com"] }, // safety-ok: unlisted-url public RPC endpoints
  bsc: { type: "evm", native: "BNB", endpoints: ["https://bsc-rpc.publicnode.com", "https://bsc.drpc.org", "https://bsc-dataseed.binance.org"] }, // safety-ok: unlisted-url public RPC endpoints
  polygon: { type: "evm", native: "POL", endpoints: ["https://polygon-bor-rpc.publicnode.com", "https://polygon.drpc.org"] }, // safety-ok: unlisted-url public RPC endpoints
  avalanche: { type: "evm", native: "AVAX", endpoints: ["https://avalanche-c-chain-rpc.publicnode.com", "https://api.avax.network/ext/bc/C/rpc"] }, // safety-ok: unlisted-url public RPC endpoints
  evm: { type: "evm", native: "ETH", endpoints: [] }, // generic: pass --rpc
};

// ---------- RPC pool (shared by all chains) ----------

// Errors that mean "your request is wrong or too big". Do NOT retry the same request: change it.
// Kept narrow on purpose: wording like "rate limit" or "limited to N requests" must fall through to RATE_ERR.
const RANGE_ERR = /block range|ranges? (is |are )?(over|too (wide|large))|exceed.*range|range.*exceed|more than \d+ results|response size|too many (results|logs)|query returned more|logs? (limit|range)|not supported on free plan/i;
// This endpoint cannot serve old data (pruned node or paid archive). Another endpoint may. Cool this one down and move on.
const ARCHIVE_ERR = /archive|missing trie node|header not found|historical state|pruned|state .* not available/i;
const RATE_ERR = /rate|limit|too many|busy|capacity|throttl|try again/i;

// Order matters: a range message can also contain "limit", so range is tested first, then archive, then rate.
export function classifyRpcError(msg) {
  if (RANGE_ERR.test(msg)) return "range";
  if (ARCHIVE_ERR.test(msg)) return "archive";
  if (RATE_ERR.test(msg)) return "rate";
  return "other";
}

// Host only. Keyed endpoints carry the API key in the path or query, and errors end up in logs and reports.
const hostOf = (url) => { try { return new URL(url).host; } catch { return "endpoint"; } };
// Short stable hash, to keep an endpoint URL (and any key in it) out of cache keys.
const hash = (s) => { let h = 5381; for (const c of s) h = ((h * 33) ^ c.codePointAt(0)) >>> 0; return h.toString(36); };

const EVM_ADDR = /^0x[0-9a-fA-F]{40}$/;
const SOL_ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_HASH = /^0x[0-9a-fA-F]{64}$/;
const SOL_SIG = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;
export function checkInput(kind, value, label) {
  const ok = { evm: EVM_ADDR, sol: SOL_ADDR, evmtx: EVM_HASH, soltx: SOL_SIG }[kind].test(String(value ?? ""));
  if (!ok) throw new Error(`${label}: "${value ?? ""}" is not a valid ${kind.startsWith("sol") ? "Solana" : "EVM"} ${kind.endsWith("tx") ? "transaction id" : "address"}`);
  return value;
}

export class RpcPool {
  constructor({ endpoints, rps = 3, concurrency = 3, maxRetries = 6, timeoutMs = 20000, cache = new Map(), scope = "" } = {}) {
    if (!endpoints?.length) throw new Error("no RPC endpoint: pass --rpc <url>");
    this.scope = scope; // cache namespace: the same method and params mean different data on different chains
    this.eps = endpoints.map((url) => ({ url, nextFree: 0, lastCall: 0, fails: 0 }));
    this.minGap = 1000 / rps; // min gap between calls to the SAME endpoint
    this.concurrency = concurrency;
    this.active = 0;
    this.waiters = [];
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
    this.cache = cache;
    this.stats = { calls: 0, cached: 0, retries: 0, rateLimited: 0 };
  }

  async #acquire() {
    if (this.active >= this.concurrency) await new Promise((r) => this.waiters.push(r));
    this.active++;
  }
  #release() {
    this.active--;
    const w = this.waiters.shift();
    if (w) w();
  }

  // Pick the endpoint that will be free the soonest. Claim its slot right away.
  #pick() {
    const ep = this.eps.reduce((a, b) => (Math.max(a.nextFree, a.lastCall + this.minGap) <= Math.max(b.nextFree, b.lastCall + this.minGap) ? a : b));
    const at = Math.max(ep.nextFree, ep.lastCall + this.minGap, Date.now());
    ep.lastCall = at; // reserve
    return { ep, wait: at - Date.now() };
  }

  async call(method, params = [], { cacheable = false } = {}) {
    const key = cacheable ? this.scope + "|" + method + JSON.stringify(params) : null;
    if (key && this.cache.has(key)) {
      this.stats.cached++;
      return this.cache.get(key);
    }
    await this.#acquire();
    try {
      let lastErr;
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        const { ep, wait } = this.#pick();
        if (wait > 0) await sleep(wait);
        this.stats.calls++;
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
        try {
          const res = await fetch(ep.url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
            signal: ctl.signal,
          });
          if (res.status === 429 || res.status === 403 || res.status >= 500) {
            if (res.status === 429) this.stats.rateLimited++;
            const ra = Number(res.headers.get("retry-after"));
            ep.nextFree = Date.now() + (ra > 0 ? ra * 1000 : 2000 * 2 ** Math.min(ep.fails, 5)); // cool this endpoint down
            ep.fails++;
            throw new Error(`HTTP ${res.status} from ${hostOf(ep.url)}`);
          }
          const body = await res.json();
          if (body.error) {
            const msg = JSON.stringify(body.error);
            const kind = classifyRpcError(msg);
            if (kind === "range") throw Object.assign(new Error(msg), { fatal: true, range: true });
            if (kind === "archive") {
              ep.nextFree = Date.now() + 30000;
              throw new Error(`no archive data on ${hostOf(ep.url)}`);
            }
            if (kind === "rate") {
              ep.nextFree = Date.now() + 2000 * 2 ** Math.min(ep.fails++, 5);
              throw new Error(`RPC limit from ${hostOf(ep.url)}`);
            }
            throw Object.assign(new Error(msg), { fatal: true });
          }
          ep.fails = 0;
          if (key && body.result !== null) this.cache.set(key, body.result);
          return body.result;
        } catch (e) {
          if (e.fatal) throw e;
          lastErr = e;
          this.stats.retries++;
          await sleep(Math.random() * Math.min(8000, 400 * 2 ** attempt)); // full jitter
        } finally {
          clearTimeout(timer);
        }
      }
      throw new Error(`RPC failed after retries: ${lastErr?.message}`);
    } finally {
      this.#release();
    }
  }
}

// ---------- Solana adapter ----------

export const TOKEN_PROGRAMS = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022 (verified against the owner of a Token-2022 mint on mainnet)
];
const ui = (b) => (b?.uiTokenAmount?.uiAmountString !== undefined ? Number(b.uiTokenAmount.uiAmountString) : 0);

// Token balance change per (owner, mint) in one parsed transaction.
export function tokenDeltas(tx) {
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];
  const idx = new Map();
  for (const b of pre) idx.set(b.accountIndex, { owner: b.owner, mint: b.mint, pre: ui(b), post: 0 });
  for (const b of post) {
    const r = idx.get(b.accountIndex) ?? { owner: b.owner, mint: b.mint, pre: 0, post: 0 };
    r.post = ui(b);
    idx.set(b.accountIndex, r);
  }
  const sum = new Map(); // owner|mint -> delta
  for (const r of idx.values()) {
    const k = r.owner + "|" + r.mint;
    sum.set(k, (sum.get(k) ?? 0) + (r.post - r.pre));
  }
  return [...sum].map(([k, delta]) => ({ owner: k.split("|")[0], mint: k.split("|")[1], delta })).filter((x) => Math.abs(x.delta) > 1e-9);
}

export function instructionTypes(tx) {
  const inner = (tx.meta?.innerInstructions ?? []).flatMap((i) => i.instructions);
  const all = [...tx.transaction.message.instructions, ...inner];
  return [...new Set(all.map((i) => i.parsed?.type).filter(Boolean))];
}

export class SolanaReader {
  constructor(pool) {
    this.pool = pool;
    this.chain = "solana";
  }

  async summary(addr) {
    const [bal, ...tok] = await Promise.all([
      this.pool.call("getBalance", [addr]),
      ...TOKEN_PROGRAMS.map((p) => this.pool.call("getTokenAccountsByOwner", [addr, { programId: p }, { encoding: "jsonParsed" }])),
    ]);
    const tokens = tok.flatMap((t) => t.value).map((a) => ({ mint: a.account.data.parsed.info.mint, amount: Number(a.account.data.parsed.info.tokenAmount.uiAmountString) }));
    return { chain: "solana", address: addr, native: { symbol: "SOL", amount: bal.value / 1e9 }, tokens: tokens.filter((t) => t.amount > 0).sort((a, b) => b.amount - a.amount) };
  }

  // Newest first. Stops at `limit` signatures or when older than `since` (ISO date).
  // out.truncated is true when the limit stopped the scan before `since` (or before the start of history) was reached.
  async signatures(addr, { limit = 20, since } = {}) {
    const out = [];
    out.truncated = false;
    let before;
    const sinceTs = since ? Date.parse(since) / 1000 : 0;
    const want = limit + 1; // one extra tells "stopped by the limit" apart from "history ended exactly at the limit"
    while (out.length < want) {
      const size = Math.min(1000, want - out.length);
      const page = await this.pool.call("getSignaturesForAddress", [addr, { limit: size, before }]);
      for (const s of page) {
        if (s.blockTime && s.blockTime < sinceTs) return out;
        out.push(s);
      }
      if (page.length < size) return out; // a short page is the end of history
      before = page[page.length - 1].signature;
    }
    out.pop();
    out.truncated = true;
    return out;
  }

  // Token accounts the wallet owns for one mint. A plain SPL transfer names the recipient's token account, not the
  // wallet, so getSignaturesForAddress(wallet) alone misses incoming transfers. Closed token accounts are not listed.
  async tokenAccounts(owner, mint) {
    const r = await this.pool.call("getTokenAccountsByOwner", [owner, { mint }, { encoding: "jsonParsed" }]);
    return r.value.map((a) => a.pubkey);
  }

  // Signatures for the wallet, or with a mint for each of its token accounts for that mint. Merged, newest first.
  async signaturesFor(addr, { limit = 20, since, mint } = {}) {
    // With a mint, every movement of that mint touches one of the owner's token accounts, so scan those and skip the
    // wallet address itself (it would only add unrelated SOL and other-token traffic). No token account found: use the wallet.
    const atas = mint ? await this.tokenAccounts(addr, mint) : [];
    const targets = atas.length ? atas : [addr];
    const seen = new Map();
    let truncated = false;
    for (const t of targets) {
      const sigs = await this.signatures(t, { limit, since });
      truncated ||= sigs.truncated;
      for (const s of sigs) seen.set(s.signature, s);
    }
    const out = [...seen.values()].sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0));
    if (out.length > limit) truncated = true;
    const cut = out.slice(0, limit);
    cut.truncated = truncated;
    cut.accountsScanned = targets.length;
    return cut;
  }

  // A null result does NOT prove the tx is missing: some providers keep short history and answer null.
  // So we ask again; the pool rotates endpoints, so each retry usually hits a different one.
  async tx(signature) {
    for (let i = 0; i < this.pool.eps.length + 1; i++) {
      const r = await this.pool.call("getTransaction", [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, commitment: "finalized" }], { cacheable: true });
      if (r) return r;
    }
    return null;
  }

  async txs(addr, { limit = 20, since, mint, stride = 1 } = {}) {
    const rows = await this.txsScan(addr, { limit, since, mint, stride });
    return rows.rows;
  }

  async txsScan(addr, { limit = 20, since, mint, stride = 1 } = {}) {
    const all = await this.signaturesFor(addr, { limit, since, mint });
    const sigs = all.filter((_, i) => i % stride === 0);
    const rows = await Promise.all(
      sigs.map(async (s) => {
        const t = await this.tx(s.signature);
        const time = s.blockTime ? new Date(s.blockTime * 1000).toISOString() : null;
        if (!t) return { time, signature: s.signature, missing: true };
        let d = tokenDeltas(t);
        if (mint) d = d.filter((x) => x.mint === mint);
        return { time, signature: s.signature, err: !!s.err, types: instructionTypes(t), deltas: d };
      })
    );
    const times = all.map((s) => s.blockTime).filter(Boolean);
    return {
      rows,
      newest: times.length ? new Date(Math.max(...times) * 1000).toISOString() : null,
      oldest: times.length ? new Date(Math.min(...times) * 1000).toISOString() : null,
      truncated: all.truncated,
      accountsScanned: all.accountsScanned,
    };
  }

  // Aggregate token flow of one wallet for one mint, grouped by counterparty.
  async flows(addr, { token, mint = token, since, limit = 200, stride = 1 } = {}) {
    if (!mint) throw new Error("--token <mint> is required for flows on Solana");
    const scan = await this.txsScan(addr, { limit, since, mint, stride });
    const rows = scan.rows;
    const inflow = {}, outflow = {};
    let burned = 0, missing = 0;
    for (const r of rows) {
      if (r.missing) { missing++; continue; }
      const me = r.deltas.find((x) => x.owner === addr);
      if (!me) continue;
      const others = r.deltas.filter((x) => x.owner !== addr);
      if (me.delta > 0) {
        const src = others.filter((x) => x.delta < 0).map((x) => x.owner);
        const key = src.length ? src.join("+") : "(mint or unknown)";
        inflow[key] = (inflow[key] ?? 0) + me.delta;
      } else {
        if (r.types.some((t) => t === "burn" || t === "burnChecked")) { burned += -me.delta; continue; }
        const dst = others.filter((x) => x.delta > 0).map((x) => x.owner);
        const key = dst.length ? dst.join("+") : "(unknown)";
        outflow[key] = (outflow[key] ?? 0) + -me.delta;
      }
    }
    const note = [
      stride > 1 ? `SAMPLE: every ${stride}th transaction only, totals are not complete` : null,
      scan.truncated ? "TRUNCATED: --limit stopped the scan before --since (or the start of history); totals cover newest..oldest only" : null,
      missing ? `${missing} transactions could not be fetched and are not counted` : null,
      "token accounts closed before now are not scanned",
    ].filter(Boolean);
    const r9 = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Number(v.toFixed(9))])); // UI amounts are floats: trim summing noise
    return { chain: "solana", address: addr, token: mint, scanned: rows.length, accountsScanned: scan.accountsScanned, newest: scan.newest, oldest: scan.oldest, stride, truncated: scan.truncated, missing, inflow: r9(inflow), outflow: r9(outflow), burned: Number(burned.toFixed(9)), note };
  }

  // Mint facts and the largest holders. Authorities that are null mean "disabled" (cannot mint / cannot freeze).
  async mintView(mint, holders = []) {
    const acc = await this.pool.call("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
    const info = acc?.value?.data?.parsed?.info;
    if (!info || acc.value.data.parsed.type !== "mint") throw new Error(`${mint} is not an SPL token mint`);
    const supply = Number(info.supply) / 10 ** info.decimals;
    const out = {
      chain: "solana", mint, program: acc.value.owner, decimals: info.decimals, supply,
      mintAuthority: info.mintAuthority ?? null, freezeAuthority: info.freezeAuthority ?? null,
      extensions: (info.extensions ?? []).map((e) => e.extension),
    };
    // Best effort: public endpoints often throttle or block this heavy call for big tokens. The mint facts above still stand.
    try {
      const big = await this.pool.call("getTokenLargestAccounts", [mint]);
      const accts = big.value.map((a) => a.address);
      const meta = accts.length ? await this.pool.call("getMultipleAccounts", [accts, { encoding: "jsonParsed" }]) : { value: [] };
      out.largestHolders = big.value.map((a, i) => ({
        tokenAccount: a.address, owner: meta.value[i]?.data?.parsed?.info?.owner ?? null,
        amount: Number(a.uiAmountString), pctOfSupply: supply ? (Number(a.uiAmountString) / supply) * 100 : null,
      }));
    } catch (e) {
      out.largestHolders = null;
      out.largestHoldersError = `${e.message}. Public endpoints often refuse this call; pass a keyed endpoint with --rpc, or read holders from an explorer and mark them Reported.`;
    }
    out.holders = {};
    for (const h of holders) {
      const sum = (await this.summary(h)).tokens.filter((t) => t.mint === mint).reduce((s, t) => s + t.amount, 0);
      out.holders[h] = sum;
    }
    out.note = "largestHolders = top 20 token accounts, not top 20 owners; one owner may hold several. Owner identity is unknown unless an official source says so.";
    return out;
  }
}

// ---------- EVM adapter (Ethereum, Base, Arbitrum, Optimism, BNB, Polygon, Avalanche, any other EVM) ----------

const SEL = { balanceOf: "0x70a08231", decimals: "0x313ce567", symbol: "0x95d89b41", name: "0x06fdde03", totalSupply: "0x18160ddd" };
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO = "0x0000000000000000000000000000000000000000";
const DEAD = "0x000000000000000000000000000000000000dead";
const isBurnAddr = (a) => a === ZERO || a === DEAD;

const padAddr = (a) => a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const topicAddr = (t) => ("0x" + t.slice(26)).toLowerCase();
const hexToBig = (h) => (h && h !== "0x" ? BigInt(h) : 0n);

// BigInt amount -> decimal string without losing precision.
export function formatUnits(v, decimals) {
  const neg = v < 0n;
  let s = (neg ? -v : v).toString().padStart(decimals + 1, "0");
  const i = s.length - decimals;
  const frac = s.slice(i).replace(/0+$/, "");
  return (neg ? "-" : "") + s.slice(0, i) + (frac ? "." + frac : "");
}

// ABI string or bytes32 string.
export function decodeString(hex) {
  if (!hex || hex === "0x") return null;
  const h = hex.slice(2);
  const bytes = (x) => new TextDecoder().decode(Uint8Array.from(x.match(/../g) ?? [], (b) => parseInt(b, 16))).replace(/\0+$/g, "");
  if (h.length === 64) return bytes(h);
  const len = parseInt(h.slice(64, 128), 16);
  return bytes(h.slice(128, 128 + len * 2));
}

export class EvmReader {
  constructor(pool, { chain = "evm", native = "ETH" } = {}) {
    this.pool = pool;
    this.chain = chain;
    this.native = native;
  }

  #call(to, data, block = "latest") {
    // Only calls at a fixed block can be cached.
    return this.pool.call("eth_call", [{ to, data }, block], { cacheable: block !== "latest" });
  }

  // strict: decimals must be readable, else throw. A missing decimals() must never fall back to a guess (wrong amounts).
  // Non-strict (used to decode logs of unknown tokens) returns decimals: null and the caller keeps raw amounts.
  async tokenInfo(token, { strict = true } = {}) {
    const [name, symbol, dec, supply] = await Promise.all(
      ["name", "symbol", "decimals", "totalSupply"].map((m) => this.#call(token, SEL[m]).catch((e) => (m === "decimals" ? e : null)))
    );
    if (dec instanceof Error) {
      if (strict) throw new Error(`could not read decimals() of ${token}: ${dec.message}`);
      return { token, name: decodeString(name), symbol: decodeString(symbol), decimals: null, totalSupply: null };
    }
    if (!dec || dec === "0x") {
      if (strict) throw new Error(`${token} on ${this.chain} has no decimals(): not an ERC-20 token contract (check the chain and address, and use the "code" command)`);
      return { token, name: decodeString(name), symbol: decodeString(symbol), decimals: null, totalSupply: null };
    }
    const decimals = Number(hexToBig(dec));
    return { token, name: decodeString(name), symbol: decodeString(symbol), decimals, totalSupply: supply ? formatUnits(hexToBig(supply), decimals) : null };
  }

  // Who can change this token. A null owner() does not prove nobody controls it: roles, multisigs and custom admin
  // functions are invisible here. A proxy means the logic can be replaced by the admin.
  async control(token) {
    const addrFrom = (w) => (w && /^0x0{24}[0-9a-f]{40}$/i.test(w) && !/^0x0{64}$/.test(w) ? "0x" + w.slice(26).toLowerCase() : null);
    const owner = await this.#call(token, "0x8da5cb5b").then((r) => (r && r.length >= 66 ? "0x" + r.slice(26, 66).toLowerCase() : null)).catch(() => null);
    const slot = (s) => this.pool.call("eth_getStorageAt", [token, s, "latest"]).then(addrFrom).catch(() => null);
    const implementation = await slot("0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
    const proxyAdmin = await slot("0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103");
    return {
      owner, ownerRenounced: owner === ZERO, isEip1967Proxy: !!implementation, implementation, proxyAdmin,
      note: "owner() and EIP-1967 slots only. null means not found by these probes, not proof of no control. Ask who owns the owner address with the code command.",
    };
  }

  async balanceOf(token, holder, decimals) {
    const r = await this.#call(token, SEL.balanceOf + padAddr(holder));
    return formatUnits(hexToBig(r), decimals);
  }

  async summary(addr, { tokens = [] } = {}) {
    const bal = await this.pool.call("eth_getBalance", [addr, "latest"]);
    const out = [];
    for (const t of tokens) {
      const info = await this.tokenInfo(t);
      out.push({ token: t, symbol: info.symbol, amount: await this.balanceOf(t, addr, info.decimals) });
    }
    return { chain: this.chain, address: addr, native: { symbol: this.native, amount: formatUnits(hexToBig(bal), 18) }, tokens: out, note: "EVM cannot list all tokens of a wallet: pass --token for each token you care about." };
  }

  // Token supply view: total supply, what sits in burn addresses, and optional holders.
  async tokenView(token, holders = []) {
    const info = await this.tokenInfo(token);
    const burned = {};
    for (const b of [ZERO, DEAD]) burned[b] = await this.balanceOf(token, b, info.decimals);
    const held = {};
    for (const h of holders) held[h] = await this.balanceOf(token, h, info.decimals);
    return { chain: this.chain, ...info, burnAddressBalances: burned, holders: held, control: await this.control(token) };
  }

  async code(addr) {
    const c = await this.pool.call("eth_getCode", [addr, "latest"]);
    return { chain: this.chain, address: addr, isContract: c !== "0x", codeBytes: (c.length - 2) / 2 };
  }

  async tx(hash) {
    const [t, r] = await Promise.all([
      this.pool.call("eth_getTransactionByHash", [hash], { cacheable: true }),
      this.pool.call("eth_getTransactionReceipt", [hash], { cacheable: true }),
    ]);
    if (!t || !r) return null;
    const decimalsCache = new Map();
    const transfers = [];
    for (const l of r.logs) {
      if (l.topics[0] !== TRANSFER_TOPIC || l.topics.length !== 3) continue; // ERC-20 only
      if (!decimalsCache.has(l.address)) decimalsCache.set(l.address, await this.tokenInfo(l.address, { strict: false }));
      const info = decimalsCache.get(l.address);
      const raw = hexToBig(l.data);
      transfers.push({ token: l.address, symbol: info.symbol, from: topicAddr(l.topics[1]), to: topicAddr(l.topics[2]), ...(info.decimals === null ? { amountRaw: raw.toString(), note: "decimals unknown" } : { amount: formatUnits(raw, info.decimals) }) });
    }
    return { chain: this.chain, hash, from: t.from, to: t.to, block: Number(hexToBig(r.blockNumber)), status: r.status === "0x1" ? "ok" : "failed", valueNative: formatUnits(hexToBig(t.value), 18), transfers };
  }

  async #blockTime(n) {
    const b = await this.pool.call("eth_getBlockByNumber", ["0x" + n.toString(16), false], { cacheable: true });
    return Number(hexToBig(b.timestamp));
  }

  // First block whose time is >= the given date (binary search).
  async blockAt(iso) {
    const ts = Date.parse(iso) / 1000;
    let hi = Number(hexToBig(await this.pool.call("eth_blockNumber")));
    let lo = 0;
    if ((await this.#blockTime(hi)) <= ts) return hi;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      (await this.#blockTime(mid)) < ts ? (lo = mid + 1) : (hi = mid);
    }
    return lo;
  }

  // Transfer logs of one token touching one address, newest range first, in adaptive chunks.
  async transfers(token, addr, { since, fromBlock, toBlock, maxLogs = 2000, span = 5000 } = {}) {
    // No default window: a silent "last N blocks" reads as "no activity" on a busy token. The caller must say how far back.
    if (fromBlock === undefined && !since) throw new Error("pass --since YYYY-MM-DD: flows will not guess how far back to read");
    const head = toBlock ?? Number(hexToBig(await this.pool.call("eth_blockNumber")));
    const start = fromBlock ?? (await this.blockAt(since));
    const a = "0x" + padAddr(addr);
    const logs = [];
    let hi = head, step = span, notes = 0, failed = false; // failed: this endpoint refused a range once, so stop widening
    while (hi >= start && logs.length < maxLogs) {
      const lo = Math.max(start, hi - step + 1);
      try {
        // topic filter: (from = addr) OR (to = addr). Two queries, because EVM filters cannot do OR across positions.
        const [out, inn] = [
          await this.pool.call("eth_getLogs", [{ address: token, fromBlock: "0x" + lo.toString(16), toBlock: "0x" + hi.toString(16), topics: [TRANSFER_TOPIC, a] }], { cacheable: hi < head - 20 }),
          await this.pool.call("eth_getLogs", [{ address: token, fromBlock: "0x" + lo.toString(16), toBlock: "0x" + hi.toString(16), topics: [TRANSFER_TOPIC, null, a] }], { cacheable: hi < head - 20 }),
        ];
        logs.push(...out, ...inn);
        hi = lo - 1;
        if (!failed && out.length + inn.length < 200) step = Math.min(step * 2, 100000); // quiet range: widen, until an endpoint refuses once
      } catch (e) {
        if (!e.range || step <= 50) throw e;
        failed = true;
        step = Math.max(50, Math.floor(step / 2)); // range too wide: halve and retry
        notes++;
      }
    }
    logs.sort((x, y) => Number(hexToBig(y.blockNumber)) - Number(hexToBig(x.blockNumber)));
    return { logs, fromBlock: start, toBlock: head, reachedStart: hi < start, halvings: notes };
  }

  // Aggregate token flow of one address, grouped by counterparty.
  async flows(addr, { token, since, limit = 2000, fromBlock, toBlock } = {}) {
    if (!token) throw new Error("--token <tokenAddress> is required on EVM");
    const info = await this.tokenInfo(token);
    const me = addr.toLowerCase();
    const { logs, ...range } = await this.transfers(token, addr, { since, fromBlock, toBlock, maxLogs: limit });
    const inflow = {}, outflow = {};
    let burned = 0n;
    const seen = new Set();
    const inRaw = {}, outRaw = {};
    for (const l of logs) {
      const id = l.transactionHash + ":" + l.logIndex;
      if (seen.has(id) || l.topics.length !== 3) continue;
      seen.add(id);
      const from = topicAddr(l.topics[1]), to = topicAddr(l.topics[2]), v = hexToBig(l.data);
      if (to === me && from !== me) inRaw[from] = (inRaw[from] ?? 0n) + v;
      else if (from === me && to !== me) {
        if (isBurnAddr(to)) burned += v;
        else outRaw[to] = (outRaw[to] ?? 0n) + v;
      }
    }
    for (const [k, v] of Object.entries(inRaw)) inflow[k === ZERO ? "(mint)" : k] = formatUnits(v, info.decimals);
    for (const [k, v] of Object.entries(outRaw)) outflow[k] = formatUnits(v, info.decimals);
    const covered = { from: new Date((await this.#blockTime(range.fromBlock)) * 1000).toISOString(), to: new Date((await this.#blockTime(range.toBlock)) * 1000).toISOString() };
    const note = [
      range.reachedStart ? null : "TRUNCATED: --limit stopped the scan before the start of the range; totals cover newest..oldest only",
      "token transfers only; native coin is not in logs",
      "Transfer logs show what the contract emitted; fee-on-transfer and rebasing tokens can move different amounts than logged",
    ].filter(Boolean);
    return { chain: this.chain, address: me, token, symbol: info.symbol, covered, ...range, logsRead: seen.size, inflow, outflow, burned: formatUnits(burned, info.decimals), note };
  }
}

// ---------- factory ----------

export function makeReader(chain, { rpc = [], env = typeof process !== "undefined" ? process.env : {}, cache, rps = 3, concurrency = 3, native } = {}) {
  const cfg = CHAINS[chain];
  if (!cfg) throw new Error(`unknown chain "${chain}". Known: ${Object.keys(CHAINS).join(", ")}. For another EVM chain use "evm" with --rpc <url>.`);
  const fromEnv = env[`RPC_${chain.toUpperCase()}`] ?? (chain === "solana" ? env.SOLANA_RPC : undefined);
  const endpoints = [...rpc, ...(fromEnv ? [fromEnv] : []), ...cfg.endpoints];
  // The generic "evm" chain has no fixed network, so its cache is scoped by the first endpoint (hashed, never the URL).
  const scope = chain === "evm" ? "evm:" + hash(endpoints[0] ?? "") : chain;
  const pool = new RpcPool({ endpoints, rps, concurrency, cache, scope });
  const reader = cfg.type === "solana" ? new SolanaReader(pool) : new EvmReader(pool, { chain, native: native ?? cfg.native });
  return { reader, pool };
}

// ---------- CLI (Node only) ----------
if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("chain-reader.mjs")) {
  const args = process.argv.slice(2);
  const chain = args.shift();
  const cmd = args.shift();
  const opt = { rpc: [], token: [], holder: [] }, pos = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const k = args[i].slice(2), v = args[++i];
      if (v === undefined || v.startsWith("--")) { console.error(`--${k} needs a value`); process.exit(1); }
      Array.isArray(opt[k]) ? opt[k].push(v) : (opt[k] = v);
    } else pos.push(args[i]);
  }
  const fs = await import("node:fs");
  const cache = new Map(opt.cache && fs.existsSync(opt.cache) ? JSON.parse(fs.readFileSync(opt.cache, "utf8")) : []);
  const n = (v, d) => (v === undefined ? d : Number(v));
  const save = () => { if (opt.cache) fs.writeFileSync(opt.cache, JSON.stringify([...cache])); };
  let pool;
  try {
    const made = makeReader(chain, { rpc: opt.rpc, cache, rps: n(opt.rps, 3), concurrency: n(opt.concurrency, 3), native: opt.native });
    const reader = made.reader;
    pool = made.pool;
    const evm = reader instanceof EvmReader;
    const addr = (v, label) => checkInput(evm ? "evm" : "sol", v, label);
    const tok = Array.isArray(opt.token) ? opt.token[0] : opt.token;
    if (evm && opt.stride !== undefined) throw new Error("--stride is Solana only; EVM flows read every Transfer log in the range");
    let result;
    if (cmd === "summary") {
      if (!pos.length) throw new Error("summary needs at least one address");
      result = [];
      for (const a of pos) result.push(await (evm ? reader.summary(addr(a, "address"), { tokens: opt.token.map((t) => addr(t, "--token")) }) : reader.summary(addr(a, "address"))));
    } else if (cmd === "txs" && !evm) result = await reader.txs(addr(pos[0], "address"), { limit: n(opt.limit, 20), since: opt.since, mint: opt.mint && addr(opt.mint, "--mint"), stride: n(opt.stride, 1) });
    else if (cmd === "flows") {
      if (!tok && !(opt.mint && !evm)) throw new Error("flows needs --token <token or mint>");
      result = await reader.flows(addr(pos[0], "address"), evm
        ? { token: addr(tok, "--token"), since: opt.since, limit: n(opt.limit, 2000) }
        : { token: addr(tok ?? opt.mint, "--token"), since: opt.since, limit: n(opt.limit, 200), stride: n(opt.stride, 1) });
    } else if (cmd === "tokeninfo") result = evm ? await reader.tokenView(addr(pos[0], "token"), opt.holder.map((h) => addr(h, "--holder"))) : await reader.mintView(addr(pos[0], "mint"), opt.holder.map((h) => addr(h, "--holder")));
    else if (cmd === "tx") result = await reader.tx(checkInput(evm ? "evmtx" : "soltx", pos[0], "transaction"));
    else if (cmd === "code" && evm) result = await reader.code(addr(pos[0], "address"));
    else throw new Error("usage: chain-reader.mjs <chain> <summary|txs|flows|tokeninfo|tx|code> ... (see file header; txs is Solana only, code is EVM only)");
    console.log(JSON.stringify(result, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));
  } catch (e) {
    console.error("error:", e.message);
    process.exitCode = 1;
  } finally {
    if (pool) console.error("stats:", pool.stats);
    save(); // keep what was fetched even when a long scan fails, so a re-run costs less
  }
}

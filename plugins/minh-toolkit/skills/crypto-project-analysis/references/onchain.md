# On-chain checks with scripts/chain-reader.mjs

Node 18+, no dependencies, read-only. It reads public RPC endpoints politely: it stays under rate limits, backs off on 429, fails over between endpoints, and caches immutable data. Run from the skill's folder or give the full path. Offline self-tests (hand-written and seeded property tests, no network): `node --test scripts/chain-reader.test.mjs scripts/chain-reader.fuzz.test.mjs`. Run them after any change to the script.

```
node scripts/chain-reader.mjs <chain> summary   <addr>... [--token <tokenAddr> ...]
node scripts/chain-reader.mjs <chain> tokeninfo <tokenOrMint> [--holder <addr> ...]
node scripts/chain-reader.mjs <chain> flows     <addr> --token <tokenOrMint> --since 2026-08-01 [--limit N] [--stride N]
node scripts/chain-reader.mjs <chain> tx        <hashOrSignature>
node scripts/chain-reader.mjs <chain> txs       <addr> [--mint <mint>] [--since D] [--limit N] [--stride N]   (Solana)
node scripts/chain-reader.mjs <chain> code      <addr>                                                         (EVM: contract or wallet?)
Options: --rpc <url> (repeatable)  --cache file.json  --rps 3  --concurrency 3  --native SYMBOL
```

Chains: `solana`, `ethereum`, `base`, `arbitrum`, `optimism`, `bsc`, `polygon`, `avalanche`. Another EVM chain: use `evm` with `--rpc <url>` and `--native SYMBOL`. Bitcoin, Cosmos, TON, Sui and the like are **not supported**.

`--since` is required for EVM `flows`: the script will not guess a window. Use `--cache` on any long scan so a failed run is not lost. A keyed endpoint goes in `--rpc` or the env var `RPC_<CHAIN>` (for example `RPC_BASE`); error messages show only the host.

## What to check on every project
1. **Token facts.** `tokeninfo`. EVM: supply, decimals, balance in the burn addresses, and a `control` block (`owner()`, EIP-1967 implementation and proxy admin). Solana: supply, decimals, mint authority, freeze authority, token-2022 extensions and the largest token accounts with owner.
2. **Treasury, burn and team wallets** named on the official page: `summary`.
3. **Each claimed burn:** `tx` on the burn transaction, then `flows` on the burn wallet to trace where the burned tokens came from. Report the traced share and the unexplained rest.
4. **Buy bots or fee wallets:** sample with `txs` or `flows`, and say it is a sample.

## Read these output fields before using a total
- `note`: lists every caveat that applies to this run (sample, truncated, missing transactions, token transfers only).
- `truncated` / `reachedStart`: `--limit` stopped the scan early, so totals cover the newest transactions only. Raise `--limit`, narrow `--since`, or report the total as partial.
- `covered` (EVM): the real time range read. Put it in the report.
- `missing` (Solana): transactions that could not be fetched.
- `stride`: more than 1 means a sample.
- `control.owner` or `mintAuthority` null: means "not found by these probes" on EVM, and "disabled" on Solana. They are different.
- `largestHolders` is the top token accounts, not owners; one owner may hold several. Never name an owner from this. `null` with `largestHoldersError` means the public endpoints refused the call (common for large tokens): use a keyed `--rpc`, or take holders from an explorer and tag them Reported.

## Known limits (put the ones that applied in the report's limits section)
- EVM JSON-RPC cannot list all tokens or all transactions of a wallet. `summary` needs `--token` addresses. `flows` reads Transfer logs of one token and covers token transfers only, not the native coin. Fee-on-transfer and rebasing tokens can move amounts that differ from the logs.
- Public EVM endpoints cap `eth_getLogs` ranges and keep little history. The script halves the range on "too wide" errors and fails over on "archive" errors. An old range can still fail: add an archive or keyed endpoint.
- Solana `flows` follow the wallet's current token accounts for the mint. Closed accounts are not scanned.
- Contract-control probes find the common patterns only (`owner()`, EIP-1967). Multisigs, role-based admin and timelocks are invisible; null is not proof of no control.
- Public endpoints change. If one is dead, pass another with `--rpc`.
- If the shell cannot reach the network, run the same functions in a browser tool (paste the file without its final CLI block), one call at a time. Otherwise mark on-chain checks "Unknown".
- Never claim a wallet is "the team's" unless an official source says so.

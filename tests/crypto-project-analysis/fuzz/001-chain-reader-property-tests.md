---
id: 001
skill: crypto-project-analysis
target: scripts/chain-reader.mjs (executable tests live beside the script; see Input)
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-26
---

## Scenario
The report's on-chain numbers (burn totals, inflow shares, supply, contract control) come from this
script, and the skill tells the agent to trust the traced share it prints. A bug here yields a
believable wrong number, not a crash, so the script is checked against oracles computed from the
same random data instead of against hand-picked examples.

## Input
`scripts/chain-reader.fuzz.test.mjs` (seeded; `CHAIN_FUZZ_SEED`, `CHAIN_FUZZ_ROUNDS` change the
seed and length, a failure prints its seed). Offline, no network. It checks:
- `formatUnits`, `decodeString`, `checkInput`, `tokenDeltas` as round-trip or oracle properties.
- `classifyRpcError`: total on any text including unicode, and a range message is always classed
  "range" even with rate-limit or archive words around it.
- Solana `flows` against an in-memory ledger: 1 or 2 token accounts with overlapping signatures,
  random `since`, `limit`, `stride`, missing transactions, burn and burnChecked, foreign mints.
  Totals, `scanned`, `missing`, `truncated` and the SAMPLE/TRUNCATED notes must match the oracle.
- EVM `flows` against an in-memory chain whose `eth_getLogs` rejects ranges above a random cap and
  sometimes repeats a log: each log counted once, totals and `logsRead` match the oracle.
- `RpcPool`: fatal errors fail on the first call and never show the endpoint path or key.
The hand-written cases are in `scripts/chain-reader.test.mjs`. Run both with
`node --test scripts/chain-reader.test.mjs scripts/chain-reader.fuzz.test.mjs`.

## Expected behavior
All properties hold for every seed. Re-introducing any past defect fails at least one property.

## Result
Found and fixed: `truncated` was reported when the history held exactly `--limit` transactions
(the scan could not tell "stopped by the limit" from "ended there"); it now asks for one extra
signature. Mutation check: each of these deliberately broken copies of the script is caught by the
suite: burnChecked not counted as a burn, "ranges over N blocks" not classed as a range error,
range halving disabled (hangs, caught by a timeout), duplicate logs counted twice, overlapping
signatures not de-duplicated, the extra-signature probe removed, `--stride` ignored, `formatUnits`
trailing-zero trim removed, address validation loosened. Two mutants first survived (range wording
and duplicate logs) because the generated data could not reach them; the generators were widened.
CI runs both test files in the `validate` job (step "Test skill scripts (Node)").

## Regression check (2026-10-26)
Case created with the suite. Re-run it whenever `chain-reader.mjs` changes, and rerun the mutation
list above by hand if a property is edited.

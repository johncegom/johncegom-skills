# Full report skeleton

Keep this order and numbering. A section that does not apply keeps its number and reads "Not applicable: <reason>". Every number carries a tag and a source id (see the rules in SKILL.md). Decide per section whether a diagram helps, using [diagrams.md](diagrams.md); it lists which sections get one.

**Title block:** project, date read, scope line (sources used, including every added source), one-line disclaimer.

1. **Summary.** First the holder case parts "How this fails" and "What a holder is betting on" (see SKILL.md). Then one short paragraph per area (cash flow, token, advantage, people, delist) and a short callout "three uncertain points".
2. **How the project works.** What it sells, to whom, how it makes money. A short list of easy-to-confuse terms. "What is unknown".
3. **Cash flow**
   - 3.1 Money-flow diagram (who pays whom, numbered steps) plus a step table: what happens, certainty, source.
   - 3.2 Statement-style table: income, expenses, token buyback or burn, profit if known. Unknown rows stay marked.
   - 3.3 Revenue by quarter and by month. Compare with peers for the same period only.
   - 3.4 Holder revenue: how much reaches the token, and how reliable that number is.
   - Then "How to read it", "Challenge and inversion", "What is unknown".
4. **Token**
   - Price and market value, allocation, unlock schedule.
   - What holders actually receive (dividend, staking, buyback, burn, utility) and whether a perk goes to all users or only to holders.
   - Monthly unlock vs monthly burn: the ratio, three scenarios, and the USD needed to offset (tokens x price).
   - **Contract control:** who can mint, freeze, pause, upgrade or change fees. EVM: `owner()`, proxy and admin from `tokeninfo`. Solana: mint and freeze authority, token-2022 extensions. Say what the probes cannot see (multisig membership, role-based admin, timelocks), and whether an audit or a past exploit is reported by a source.
   - On-chain wallet check (identity unknown unless an official source says otherwise).
   - **Holder case table:** the checklist rows from SKILL.md, including why hold, allocation and vesting, and dilution (Met / Partly / Unmet / Unknown, evidence, source id), the decisive gap, and the evidence-coverage label. Keep it next to the holder-benefits facts it rests on.
   - Then "How to read it", "Challenge and inversion", "What is unknown".
5. **Business advantage.** Facts first (share, growth, ratios vs peers). Then a pre-mortem table: failure mechanism, metric to watch, evidence now, observed or not. A sensitivity example, where the analysis could be wrong, "What is unknown".
6. **People.** Names, roles, evidence, source. Team statements vs data. Missing roles (finance, legal, custody). "Challenge and inversion".
7. **Delist and liquidity risk.** Venues, delist rules (if no source gives them write "Unknown", never invent), volume, depth, holder concentration.
8. **Data conflicts.** Table: item, the two values, likely reason, status.
9. **Two readings.** A positive reading and a defensive reading, built only from facts in the report, with section references. Each ends with "what would prove this view wrong" (a measurable condition). Then three things the reader can watch, each tied to the decisive gap or a checklist row. State that these are perspectives, not advice, and that they do not answer the delist question unless sources do.
10. **Limits of the report and how to refresh it.** Include the on-chain limits that applied (see onchain.md) and the date the data was read.
11. **Source table.** Id, title, owner, link, date read, type (official, independent, sponsored, self-declared).

## Quick tier mapping

The Quick .docx uses the title block, the holder case (all five parts, short), one paragraph per area from section 1, the three uncertain points, one table of the key numbers (revenue definition, supply, next unlock, burn, holder share, contract control, main venues), "what is unknown", a short limits paragraph, and the source table from section 11. It does not need sections 3 to 9 as separate chapters, but any number it shows follows the same rules.

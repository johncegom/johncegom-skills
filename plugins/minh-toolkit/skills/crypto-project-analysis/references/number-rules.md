# Number rules and the mistakes behind them

Each rule is here because the opposite happened in a real analysis.

## Revenue and ratios
- Define each revenue line as its source defines it. Say whether it is gross or after paying users (for example after buybacks). A diagram node called "gross revenue" must not hide that a buyback was already deducted.
- Do not call a ratio a "profit margin" unless all costs are deducted. Name it exactly (for example "revenue after buyback, % of spend") and state its period. A one-month ratio was once presented as a general margin.
- GMV is volume, not revenue. Marketplace volume is not revenue.
- Token buyback and burn is an expense. Show it, with a caveat if the amount is unknown.
- Compare with peers for the same period only.

## Holders, burns and unlocks
- A burn is not a payment to holders. Check what holders really get (dividend, staking, buyback, burn, utility), and whether a perk goes to all users or only to holders.
- Split supply reduction (burn) from demand (bot buying).
- Monthly unlock vs burn: give a ratio, three scenarios, and USD = tokens x price needed to offset.

## Zero, outliers and conflicts
- A dashboard value of 0 is not proof of 0. It can be a missing wallet list. A dashboard once showed 0 burn while the chain showed two burns.
- A single-source number that looks big must be checked on chain. A lower bound once came from an unmerged pull request and over-counted about 35 times.
- Show both values when sources disagree. Write "not explained" if the reason is unknown.

## Wallets
- Do not infer a wallet owner from activity. Write "identity unknown".
- Trace burn inflows and report the traced share and the unexplained rest. A sample is a sample: say it, and say the stride.

## Sources and wording
- A project-funded report was once described as independent. Always disclose who paid.
- An inference (for example what funded a burn) was once written as fact. Mark inference and give evidence for and against.
- Quote the source's exact words and use one term across the report. Term drift ("buy back packs" vs "buy back cards") made two different things look like one.
- A listed source that has no page or article on the project (a tracker with no entry, a news site with no story) is logged as "searched, nothing found", with the date and what was tried. Never write "does not exist" or treat it as proof. A guessed URL that returns 404 or 403 is weak evidence at best: say which. Use it only as a hint (for example, no unlock tracker entry fits a project with no token) and say it is weak.

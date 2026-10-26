# Diagrams

Goal: make the structure easier to see. A diagram is a view of facts already in the report, never a new claim.

Two kinds, kept apart:
- **Diagrams** show structure: who does what, where money goes, which conditions hold. They are **generic**: roles first, a name only to show the owner, and no figures.
- **Data charts** (bars, stacked bar, range) show size over time or across sources. They are numeric by nature, optional, and never part of Quick.

## Generic means
- **No figures.** No amounts, percentages, dates or counts inside a box or on an arrow. "100 USD" paths, "6% fee" and "90% buyback" belong in a table, not in a diagram. The names go in the text and tables too, with source ids.
- **Role first, name only to show the owner.** Label each box with its role ("user", "project", "marketplace", "custodian", "token holder"). Add the project, protocol or company name in brackets where it tells the reader whose step it is, for example "Project (Courtyard)" or "Custodian (Brink's)". Use a name only for a party a source ties to that step. Do not use names for rounds, products, chains or data sources, and do not use a name in place of a role.
- **Status, not size.** Each box carries one status line: Reported with a source id, Unverified, Unknown, or None. A step the sources do not show is a dashed box that says "Unknown", never an invented one.
- **This project's own flows.** Build each flow diagram from the sources for this project. Do not copy the structure of another project or of the template. A project has the payers, uses of money and parties its sources show, no more and no fewer. Add a box only for a party or step a source shows; if a step might exist but no source shows it, draw it dashed as "Unknown" or leave it out and list it under "what is unknown".

## When to draw one
Draw only if it shows a flow or a set of conditions that a table hides, and every box and arrow is backed by a tagged source (or marked Unknown). If not, use a table or text. If a diagram would need an invented link, do not draw it.

| Section | Diagram | Rule |
|---|---|---|
| 1 Summary | Holder-case strip: one cell per checklist condition, labelled Met / Partly / Unmet / Unknown / Not applicable | Always |
| 2 How it works | Business-model map: what the project sells, to whom, and what moves between the parties (goods, rights, tokens, not money: money is in the cash-flow map). Same format and rules as the cash-flow map; orange marks the assets (the item, the token, the vault) | Always |
| 3 Cash flow | Cash-flow map (see below) | Always |
| 4 Token | The holder leg of the cash-flow map, redrawn alone: which flows (dividend, buyback, burn, utility) end at token holders and which do not | When a token exists |
| 6, 9, 10, 11 | None | A table or text is clearer. An org chart would imply structure the sources do not show |

Quick tier: three diagrams at most, the holder-case strip, the business-model map and the cash-flow map. Full adds the data charts that apply.

## The cash-flow map
It answers: where does money come in, where does it go, and does any of it end at a token holder? The nodes and arrows come from this project's real cash flow, so the shape differs for each project.
- **How to find the flows.** List every way money enters (each kind of payer, investors, partners). List every place it goes that a source shows (costs, custody, partners, rewards, buybacks, burns, payouts). Then draw one arrow per flow, with the direction of the money. A flow that goes both ways is two arrows.
- **Format.** A top-down graph. Boxes are parties and stages; each arrow has a short label on a grey chip, and the main steps are numbered in order. Blue for parties and revenue, orange for where money goes and the token side. Dashed for an indirect, unverified, unknown or non-existent step. The label also says it in words ("Unknown", "None"), so colour is never the only signal. [cashflow-template.dot](cashflow-template.dot) shows the syntax and look only.
- **The token question.** Show where a token holder stands in this project's flow, whatever it is: a direct payout, a buyback and burn that act through the price, a utility, or nothing. Draw only the token-side boxes the project has (for example a token market, or an unlock inflow from insiders, if the project has a token and a source shows it). A holder receives value through price, not cash, unless a source shows a direct payout. A buyback is an expense and a burn is not a payment to holders.
- **No token or no path.** One box "Token holder: none" with the reason is enough. Do not draw a market, unlock or burn step that does not exist. Say who the money does reach (for example equity holders) when a source says so.
- **Notes inside a label** may say what is not confirmed, for example "(source of funds not fully confirmed)". No figures.

## Data charts (Full tier, optional)
| Section | Chart | Draw only if |
|---|---|---|
| 3 Cash flow | Revenue by month as bars; partial months marked | 3+ months of data |
| 4 Token | Allocation as a stacked bar; unlock vs burn by month | the data exists |
| 5 Advantage | Peer bars | two or more peers share the same period and definition |
| 7 Delist and liquidity | Volume by venue | 3+ venues of data |
| 8 Data conflicts | Range chart: one metric, one mark per source | 3+ sources give the same metric |

Every number on a chart carries its tag and source id, and the numbers sit in a small table next to it so a reader can check them.

## Rules
1. At most two diagrams per section (data charts count separately). Put each right after the section's lead paragraph, with one sentence on how to read it.
2. Caption: what it shows, the sources, the date read, and the definition used (for example gross vs net).
3. Do not rely on colour alone. Write the label (Met, Unknown, Reported) in the cell or box.
4. Text in the report's language. Keep the same terms as the tables.

## How to build
- **Flow diagrams (business-model map, cash-flow map):** write the graph as Graphviz DOT (start from the template), render it to a PNG, and insert it with alt text that describes the flow in words. Any renderer works: Graphviz `dot`, the Mermaid CLI, or a Node or Python package that renders DOT or draws boxes and arrows. If none is installed, install one into a scratch folder, not into the skill. Check the image text for the language's accents. Keep the DOT source in scratch with the build files.
- **Fallback when nothing can render an image:** native .docx tables, with shaded cells joined by arrow characters in columns (income, project, uses, token holders). Say the graph form was skipped.
- **Strip and tables:** native .docx tables, no image needed.
- **Data charts:** draw a PNG with matplotlib or any plotting library available, insert it with alt text, and keep the table beside it. If none is available, use the table alone and say the chart was skipped.
- Check the render if a converter is available. Otherwise say the visual check was skipped.

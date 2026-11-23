# ArchXchange fee calculator (standalone page)

A single page that works out an architect's fee from the COA minimum fee scale. Plain HTML, CSS and JavaScript: no build step and no installs. Open `index.html` in a browser, or serve the folder.

**Live:** https://vasudevan-archi.github.io/archxchange-fee-calculator/ (GitHub Pages, repository `vasudevan-archi/archxchange-fee-calculator`, public).

To publish a change, run `node test.js`, then commit and push from this folder. Pages rebuilds in about a minute.

```
git add -A
git commit -m "Describe the change"
git push
```

## Files

| File | What it holds | Edit it to |
|---|---|---|
| `coa-data.js` | COA Tables 1–4, slabs, payment stages, definitions, repetition rule | Change only if COA changes its scale |
| `market.js` | Experience levels (years, premium range) and city tiers (premium) on top of COA | Tune the market guidance |
| `building-types.js` | COA's list of building types in each category, word for word, plus everyday names (marriage hall, kalyana mandapam, PG…) that point to them | Add an everyday name to `ALIASES`; never edit COA's `TYPES` |
| `fee-calc.js` | All the maths: `AXFee.calculate(input)` | Change how a fee is worked out, or add a service |
| `app.js` | Reads the form, draws the result, share / copy / print | Change what the page shows |
| `index.html` | The page and its questions | Change wording, add a field, change the premium buttons |
| `style.css` | Look and layout (phone first; two columns from 960px) | Change the design |
| `test.js` | 32 checks on the data, the maths and the building search | Add a check when you change the maths |

Run the checks after any change to `coa-data.js`, `market.js`, `fee-calc.js` or `building-types.js`:

```
node test.js
```

## The rule

- **COA fee** = gross construction cost × COA %. The % comes from the COA table for the service, then the building category (or discipline), Simple or Complex, and the cost slab the project falls in. It is never adjusted.
- **Your fee** = COA fee × (1 + experience premium + city premium). Both come from `market.js`. Where a level has a range, the fee is the middle of it.

  | Experience | Premium | City | Premium |
  |---|---|---|---|
  | Starting out, 0–3 yrs | −10% to COA (fee: COA − 5%) | Metro | +10% |
  | Mid-level, 3–6 yrs | at COA | Tier 2 city | +5% |
  | Established, 6–10 yrs | +5% | Tier 3 and towns | 0% |
  | Senior, 10+ yrs | +10% | | |

  - **Starting out** is the only level that may go below COA, by at most 10%, and it never goes above COA. The city premium does not apply to it, so the range is the same in every city.
  - **Every other level** is at COA or above, plus the city premium.
  - **"Set my own"** replaces the experience premium with a % you type. It cannot go below COA, and the city premium still applies.
- **Peers** = COA fee × (1 + the low or high end of the experience range + the city premium).
- **What you charge today** can be entered as ₹ per sq.ft, % of cost or a lump sum. The page compares it with COA and with peers, and says whether you are below COA, undercharging, in line or above, with the ₹ gap. Anything inside your level's range counts as in line, so a beginner within 10% of COA is told they are in line, with a nudge to move up to COA.
- **Client pays** = your fee + 18% GST.
- **Building search (step 02):** type what you are designing ("marriage hall", "kalyana mandapam", "school") and pick a match. It sets the COA category, and the result names the COA building type, e.g. "Category 4 – Hospitality (Banquet Halls)". A name can match more than one category: a marriage hall shows Banquet Halls (Category 4) and Community Centres (Category 7).
- **The i button** next to the category opens COA's list of building types for every category. Tap one to use it. The line under the category always shows what COA puts in it.
- **Comprehensive + Interiors** = Table 1 on the construction cost + Table 3 (Interior Design) on the fit-out cost. COA has no single table for this, so the page adds the two, the same way it does for Architecture + Interiors.
- **Architecture + Interiors** = Table 2 on the construction cost + Table 3 (Interior Design) on the fit-out cost. Each part uses its own slab, because COA prices Table 3 on "the gross construction cost of the respective discipline".
- **Repeated identical blocks** use COA's tiers, read as in the fee workbook: repeats 1–3 at 50% each, 4–6 at 30%, beyond 6 at 20%. They apply to Tables 1 and 2.
- **Missing percentages:** where COA prints "–" (for example a house above ₹99.9 Cr), the page shows a warning instead of a fee.
- **Payment stages:**
  - The page starts with COA's 15 stages (§4.3.2).
  - "Customise stages" opens an editor where you can rename stages, change the %, add or remove stages, or start again from COA.
  - Stages save only when each one has a name and a % above 0 and they total 100%. The last stage takes the rounding, so the amounts add up exactly to the fee.
  - Custom stages are saved on the device and used on the PDF and in the WhatsApp text. "Use COA stages" switches back.
  - Custom stages change only how the fee is split, never the fee.

## Send to your client

- **The fields:** your name or firm, phone, client's name, project, and a note. All are optional, and they are saved in the browser on that device.
- **COA line on the PDF:** "This fee is not below the COA minimum fee" is printed only when it is true. A beginner's fee below COA leaves the line out.
- **WhatsApp and Copy** send a short message to the client: the fee, GST, total, the payment stages and the COA basis, signed with your name. It does not include peers or what you charge today.
- **Download PDF proposal** builds a one-page A4 proposal and saves it as `Fee proposal - <client>.pdf`. It contains your firm, the client, the project, the scope, the fee and GST, the COA basis, the 15 payment stages, your note, standard terms and signature lines.
- **How the PDF is made:** the library (html2pdf.js 0.10.1) loads from cdnjs only when the button is pressed. Offline, the button opens Print, where "Save as PDF" gives the same page.
- **Branding:** "Powered by ArchXchange" appears on the PDF and the message. To remove it for the paid plan, set `BRANDING = false` at the top of the "Send to your client" part of `app.js`.

## Source and checking

- COA's building types per category come from §4.5.1 of the same volume.
- COA percentages come from the Council of Architecture *Manual of Architectural Practice*, Vol. 4, §4.8.1, Tables 1–4. Payment stages come from §4.3.2.
- On 21 Nov 2026 all 368 percentages in `ArchXchange_Architects_Fee_Calculator.xlsx` were compared with COA's published PDF (coa.org.in, `COA Vol_4_R13.pdf`). There were 0 mismatches.
- Tables 3 and 4 use COA's own six slabs, starting at ₹0–9.9 Cr. The workbook splits that first slab into two columns with the same %, so the results are identical.

## Market guidance

- **Experience and city premiums** in `market.js` were set by the owner on 23 Nov 2026: starting out −10% to COA, mid-level at COA, established +5%, senior +10%, city premiums unchanged.
- **Everyday building names** in `building-types.js` (`ALIASES`) are ArchXchange's, not COA's. They are ArchXchange's market guidance, not COA rules, and are labelled that way on the page.

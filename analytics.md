# Manifest — Analytics

Owner-only reporting surface (`/analytics`). Read-only — no writes happen here, all data is aggregated from Trips, Advances, and Ledger entries.

## 1. Access

Restricted to the **Truck Owner** role. Enforced server-side in the route's page/layout (redirects Record Manager away, not just hidden from nav) — see `modules.md` and `requirements.md` §2.

## 2. Views

### 2.1 Profit & loss trend
- Line/bar chart of trip profit over time (daily/weekly/monthly toggle).
- Profit = freight amount − fuel/expenses − advance allocation − hired-truck payout (if applicable).
- Date range filter, exportable as CSV via the shared `/api/export` route handler.

### 2.2 Per-truck profitability
- Table ranked by total profit contributed, one row per truck.
- Columns: trips completed, total freight, total expenses/advances, net profit, avg. profit/trip.
- Drill into a truck to land on its Masters detail page (trip history).

### 2.3 Per-driver profitability
- Same shape as per-truck, keyed by driver — useful since a driver can be reassigned across trucks over time.
- Includes outstanding advance balance column, pulled from the Advances ledger.

### 2.4 Outstanding balances snapshot
- Two summary cards/tables: total outstanding driver advances, total outstanding transporter payables/receivables.
- Each row links to the relevant Driver/Operator detail page's ledger.

### 2.5 Invoice status breakdown
- Count/amount by status: draft, sent, paid, overdue.
- Overdue invoices surfaced prominently (semantic `danger` color per `design.md` §2) with days-overdue.

## 3. Calculation notes

- All profit figures are computed at query time from Trip + Advance + LedgerEntry rows — nothing is pre-aggregated/cached in v1, since write volume is low enough that live aggregation queries are cheap (see `Rnd.md` §2 on SQLite write volume).
- If this becomes a performance concern at scale, the natural next step is a materialized daily-rollup table refreshed on trip completion — not needed for v1.

## 4. Chart implementation

- Charts use CSS-variable-driven theming (see `design.md` §6) so they flip correctly between dark/light without separate chart configs.
- Semantic status colors (`design.md` §2) used consistently: profit-positive in success green, profit-negative in danger red — never the accent copper color, which is reserved for primary actions/navigation, not data encoding.

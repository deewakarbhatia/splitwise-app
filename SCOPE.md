\# SCOPE.md



\## Anomalies Detected



\### Duplicate Expense



\* Dinner - Marina Bites appeared as a likely duplicate.

\* Duplicate row skipped.



\### Amount Formatting



\* Amount containing comma separators:



&#x20; \* Example: "1,200"

\* Normalized to numeric value.



\### Excess Precision



\* Amount "899.995"

\* Rounded to 900.



\### Missing Payer



\* House cleaning supplies contained no payer.

\* Row skipped.



\### Settlement Recorded as Expense



\* "Rohan paid Aisha back"

\* Reclassified as settlement.



\### Percentage Split Totals



\* Two percentage-based expenses totaled 110%.

\* Percentages normalized proportionally to 100%.



\### Currency Differences



\* USD expenses detected.

\* Converted using fixed USD→INR exchange rate during balance calculation.



\### Name Variations



Examples:



\* Priya

\* priya

\* Priya S

\* Rohan

\* rohan



Normalized to canonical names.



\### Unsupported Split Type Found



Source data contained:



\* split\_type = share



Examples:



\* Scooter rentals

\* April rent



Weighted-share logic was implemented after discovery.



\### Zero Amount Expense



\* Dinner order Swiggy

\* Imported and retained for traceability.



\### Inconsistent Date Format



\* Mar-14



Stored as source value and flagged for future normalization.



\### Possible Duplicate-Like Records



\* Dinner at Thalassa

\* Thalassa dinner



Not merged because payer and amount differed.




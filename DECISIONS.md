\# DECISIONS.md



\## Database



SQLite was selected because:



\* Lightweight

\* No external setup

\* Suitable for assignment scope



\## Name Normalization



Different spellings and casing variations were mapped to canonical participant names.



\## Currency Handling



A fixed USD→INR exchange rate was used during balance calculation.



Reason:



\* Keeps balances in a single ledger.

\* Easier verification by reviewers.



\## Share Split Support



The source dataset included a previously undocumented split type called "share".



Example:



\* Aisha 2

\* Rohan 1

\* Priya 1



Implementation distributes expense proportionally based on weights.



\## Deposits



Deposit-related rows were treated as standard expenses because insufficient information existed to model them separately.



\## Duplicate Detection



Automatic merging occurs only when confidence is high.



Potential duplicates with differing amounts or payers are retained and flagged rather than merged automatically.



\## Guest Participants



"Dev's friend Kabir" was treated as a distinct participant because no independent Kabir record existed elsewhere.



\## Date Storage



Dates were preserved in original source format rather than transformed to avoid modifying source data during import.




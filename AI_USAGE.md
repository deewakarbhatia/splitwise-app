\# AI\_USAGE.md



\## AI Tools Used



\* ChatGPT

\* Claude



\## Usage Areas



\* Database schema design

\* Import pipeline design

\* Dashboard implementation

\* Debugging support

\* Documentation assistance



\## Example 1: Name Normalization Issue



AI initially did not identify that "Rohan" and "rohan " were being treated as separate users.



Manual investigation revealed the issue.



Solution:



\* Added normalization mapping.

\* Re-imported data.



\## Example 2: Share Split Type



AI initially focused on percentage split debugging.



Root cause was later identified as an undocumented split\_type called "share".



Solution:



\* Implemented weighted-share allocation logic.

\* Re-imported data.



\## Example 3: Balance Discrepancy Investigation



AI suggested multiple possible causes for a ₹51,600 discrepancy.



Manual debugging revealed:



\* Scooter rentals

\* April rent



were using split\_type = share and had no generated expense splits.



Solution:



\* Added support for share-based allocation.



\## Verification Process



All AI-generated suggestions were manually reviewed, tested, and validated before inclusion in the final solution.




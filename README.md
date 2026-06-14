\# Roommate Expense Dashboard



\## Overview



This project imports roommate expense data from a CSV export, detects and logs anomalies, stores normalized data in SQLite, calculates net balances, and displays results through a web dashboard.



\## Features



\* CSV import pipeline

\* SQLite database storage

\* Name normalization

\* Amount parsing and cleanup

\* Duplicate detection

\* Settlement detection

\* Equal split support

\* Unequal split support

\* Percentage split support

\* Weighted share split support

\* Multi-currency handling (USD converted using fixed exchange rate)

\* Import anomaly reporting

\* Net balance calculation

\* Dashboard UI



\## Technology Stack



\* Node.js

\* Express.js

\* SQLite (better-sqlite3)

\* HTML/CSS/JavaScript



\## Setup



1\. Install dependencies



```bash

npm install

```



2\. Import CSV



```bash

node import.js "Expenses Export.csv"

```



3\. Run balance calculation



```bash

node balances.js

```



4\. Start server



```bash

node server.js

```



5\. Open



http://localhost:3000



\## Deliverables



\* Database schema

\* Import pipeline

\* Anomaly report

\* Balance calculation engine

\* Dashboard UI



\## AI Usage



AI tools were used for implementation guidance, debugging assistance, and architecture suggestions. All generated code was reviewed, tested, and modified before inclusion.




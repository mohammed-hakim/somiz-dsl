# SOMIZ – DSL Logistics Digitalization

Developed during my Software Engineering Internship at **SOMIZ Spa**, this project aims to digitalize and streamline the logistics workflow of the DSL (Direction des Services Logistiques), replacing manual document handling with a structured digital process.

The application manages document creation, validation, and approval across different departments and roles.

**Status:** Deployed.

---

## Set-up Guide

### Database

- Create a SQL Server (Express) database named `parc_roulant_test`.
- Execute `database.sql` and `mock.sql`.
- Modify the Python configuration files if needed.
- Note: The current version uses SQLite.

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend-s
py -m venv venv
source venv/Scripts/Activate
pip install -r requirements.txt
py app.py
```

## Test the Process Flow

Use the following test accounts:

| Nom | Prenom | Matricule | Num_Cont | Structure | Role |
|---|---|---|---|---|---|
| karim | isi | 010874 | 021669 | ISI | agent |
| mansor | isi | 798072 | 715172 | ISI | secretaire |
| zakaria | isi | 048010 | 031691 | DSL | chef service |
| jamal | dsl | 030870 | 031860 | DSL | secretaire |
| ahmed | dsl | 048009 | 031692 | DSL | chef service |
| amine | cpa | 039009 | 031693 | CPA | secretaire |
| reda | cpa | 039010 | 031694 | CPA | chef service |
| ryad | MVE | 457890 | 451536 | MVE | secretaire |
| baraa | MVE | 457891 | 451537 | MVE | chef service |

**Login password:** `123456`

### Example workflow

1. Log in as an ISI agent or secretary and create a document.
2. Log in as the ISI department head to approve or reject it.
3. Log in as the DSL department head to approve or reject it.
4. Test the workflow with other roles and departments.


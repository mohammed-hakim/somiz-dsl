# Set-up Guide

### Database

+ create sql server (express) database : parc_roulant_test
+ then execute database.sql, mock.sql (modify py files) (now its sqlite!)
+ if no error , then proceed

### Frontend

+ npm install 
+ npm run dev


### Backend
+ backend-s
+ py -m venv venv
+ source venv/Scripts/Activate
+ pip install -r ./requirements.txt 
+ py ./app.py

### Test the process flow
| Nom     | Prenom | Matricule | Num_Cont | Structure | Role              |
|---------|--------|-----------|----------|-----------|-------------------|
| karim   | isi    | 010874    | 021669   | ISI       | agent             |
| mansor  | isi    | 798072    | 715172   | ISI       | secretaire        |
| zakaria | isi    | 048010    | 031691   | DSL       | chef service      |
| jamal   | dsl    | 030870    | 031860   | DSL       | secretaire        |
| ahmed   | dsl    | 048009    | 031692   | DSL       | chef service      |
| amine   | cpa    | 039009    | 031693   | CPA       | secretaire        |
| reda    | cpa    | 039010    | 031694   | CPA       | chef service      |
| ryad    | MVE    | 457890    | 451536   | MVE       | secretaire        |
| baraa   | MVE    | 457891    | 451537   | MVE       | chef service      |

+ login using matricule and password : 123456

+ follow this process : 
+ create the doc using ISI agent or ISI secretaire
+ approve or refuse by ISI chef department 
+ approve or refuse by DSL chef department 
+ then try all different roles and structures ...
+ GG
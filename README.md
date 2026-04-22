# Set-up Guide

### Database

+ create sql server (express) database : parc_roulant_test
+ then execute database.sql 
+ if no error , then proceed

### Frontend

+ npm install 
+ npm run dev


### Backend
+ go to backend-s for sqlite or backend-m for sql server express
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
| ali     | isi    | 068184    | 220727   | ISI       | chef departement  |
| chehhat | dsl    | 010873    | 021663   | DSL       | agent             |
| jamal   | dsl    | 030870    | 031860   | DSL       | secretaire        |
| ahmed   | dsl    | 048009    | 031692   | DSL       | chef service      |
| anes    | dsl    | 010870    | 021660   | DSL       | chef departement  |
| tayeb   | cpa    | 010871    | 021661   | CPA       | agent             |
| amine   | cpa    | 039009    | 031693   | CPA       | secretaire        |
| reda    | cpa    | 039010    | 031694   | CPA       | chef service      |
| fateh   | cpa    | 010872    | 021662   | CPA       | chef departement  |
| malek   | MVE    | 010883    | 021683   | MVE       | agent             |
| ryad    | MVE    | 457890    | 451536   | MVE       | secretaire        |
| baraa   | MVE    | 457891    | 451537   | MVE       | chef service      |
| malek   | MVE    | 010894    | 021664   | MVE       | chef departement  |

+ login using matricule and password : 123456

+ follow this process : 
+ create the doc using ISI agent or ISI secretaire
+ approve or refuse by ISI chef department 
+ approve or refuse by DSL chef department 
+ then try all different roles and structures ...
+ GG
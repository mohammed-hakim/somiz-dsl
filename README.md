# Set-up Guide

### Database
+ create sql server (express) database : parc_roulant_test2
+ then execute database.sql 
+ if no error , then proceed

### Frontend
+ npm install 
+ npm run dev


### Backend
+ py -m venv venv
+ source venv/Scripts/Activate
+ pip install -r ./requirements.txt 
+ py ./app.py

### Test the process flow
| nom     | prenom | matricule | NUM_CONT | structure | role             |
| ------- | ------ | --------- | -------- | --------- | ---------------- |
| karim   | yacine | 010874    | 021669   | ISI       | agent            |
| mansor  | omar   | 798072    | 715172   | ISI       | secretaire       |
| salem   | amina  | 068184    | 220727   | ISI       | chef departement |
| chehhat | dsl    | 010873    | 021663   | DSL       | agent            |
| anes    | dsl    | 010870    | 021660   | DSL       | chef departement |

+ login using matricule and password : 123456

+ follow this process : 
+ create the doc using ISI agent or ISI secretaire
+ approve or refuse by ISI chef department 
+ approve or refuse by DSL chef department 
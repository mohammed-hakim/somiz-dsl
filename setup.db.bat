@echo off
sqlcmd -S ".\SQLEXPRESS" -E -C -Q "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'parc_roulant_test') BEGIN CREATE DATABASE parc_roulant_test END"
sqlcmd -S ".\SQLEXPRESS" -E -C -i abs_path_to_database.sql

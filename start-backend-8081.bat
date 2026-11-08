@echo off
cd /d "C:\Zoho's RDP\AI Task\GovGuide\backend"
call mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY backend/target/*.jar app.jar
COPY content/ content/

ENV APP_CONTENT_ROOT=/app/content/services
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]

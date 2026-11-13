FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY backend/.mvn backend/.mvn
COPY backend/mvnw backend/pom.xml backend/
RUN cd backend && chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY backend/src backend/src
RUN cd backend && ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/backend/target/*.jar app.jar
COPY content/services content/services
ENV GOVGUIDE_CONTENT_ROOT=/app/content/services
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

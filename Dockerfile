# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend-react/package.json frontend-react/package-lock.json ./
RUN npm ci
COPY frontend-react/ ./
RUN npm run build

# Stage 2: Build backend
FROM eclipse-temurin:21-jdk-alpine AS backend-build
WORKDIR /app
COPY backend/.mvn backend/.mvn
COPY backend/mvnw backend/pom.xml backend/
RUN cd backend && chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY backend/src backend/src
RUN cd backend && ./mvnw package -DskipTests -B

# Stage 3: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar
COPY --from=frontend-build /app/dist /app/frontend
COPY content/services content/services
RUN mkdir -p /app/data
ENV GOVGUIDE_CONTENT_ROOT=/app/content/services
EXPOSE 8080
CMD java -Xmx384m -jar app.jar --server.port=${PORT:-8080} --app.data.dir=/app/data --spring.profiles.active=db --app.frontend.dir=/app/frontend --spring.web.resources.static-locations=file:/app/frontend/

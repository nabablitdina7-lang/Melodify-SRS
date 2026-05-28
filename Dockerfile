FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY melodify-0.0.1-SNAPSHOT.jar app.jar
COPY uploads uploads/
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
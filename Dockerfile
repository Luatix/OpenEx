FROM node:22.14.0-alpine3.20 AS front-builder

WORKDIR /opt/openbas-build/openbas-front
COPY openbas-front/packages ./packages
COPY openbas-front/.yarn ./.yarn
COPY openbas-front/package.json openbas-front/yarn.lock openbas-front/.yarnrc.yml ./
RUN yarn install
COPY openbas-front /opt/openbas-build/openbas-front
RUN yarn build

FROM maven:3.9.9-eclipse-temurin-21 AS api-builder

WORKDIR /opt/openbas-build/openbas
COPY openbas-model ./openbas-model
COPY openbas-framework ./openbas-framework
COPY openbas-api ./openbas-api
COPY pom.xml ./pom.xml
COPY --from=front-builder /opt/openbas-build/openbas-front/builder/prod/build ./openbas-front/builder/prod/build
RUN mvn install -DskipTests -Pdev

FROM eclipse-temurin:21.0.5_11-jre AS app

RUN DEBIAN_FRONTEND=noninteractive apt-get update -q && DEBIAN_FRONTEND=noninteractive apt-get install -qq -y tini && rm -rf /var/lib/apt/lists/*
COPY --from=api-builder /opt/openbas-build/openbas/openbas-api/target/openbas-api.jar ./

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["java", "-jar", "openbas-api.jar"]

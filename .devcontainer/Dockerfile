FROM mcr.microsoft.com/devcontainers/base:jammy

RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

RUN npm install -g @adobe/aem-cli @adobe/aio-cli @adobe/aio-cli-plugin-api-mesh
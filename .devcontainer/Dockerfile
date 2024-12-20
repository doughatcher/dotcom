FROM mcr.microsoft.com/devcontainers/base:jammy

RUN apt-get update && apt-get install -y npm && npm install -g yarn && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN npm install -g @adobe/aio-cli @adobe/aem-cli @adobe/aio-cli-plugin-api-mesh
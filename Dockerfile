FROM --platform=linux/amd64 node:26.3.0-slim

RUN apt update && apt install -y chromium

# need this for puppeteer to work in container, otherwise it tries to download own chromium and errors out.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY --chown=1000:1000 *.json /app/
COPY --chown=1000:1000 src/ /app/src/ 
RUN chown 1000 /app
USER 1000
RUN npm install

ENTRYPOINT [ "npm", "run", "start", "--", "--docker" ]

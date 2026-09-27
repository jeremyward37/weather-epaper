FROM node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c

ARG SHARP_VERSION=0.33.5
ARG PILLOW_VERSION=12.3.0

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        python3=3.11.2-1+b1 \
        python3-pip=23.0.1+dfsg-1 \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m pip install --break-system-packages --no-cache-dir "Pillow==${PILLOW_VERSION}" \
    && python3 -c "import PIL; assert PIL.__version__ == '${PILLOW_VERSION}'" \
    && mkdir -p /opt/renderer

RUN --mount=type=bind,source=design/package.json,target=/opt/renderer/package.json,ro \
    --mount=type=bind,source=design/package-lock.json,target=/opt/renderer/package-lock.json,ro \
    npm ci --omit=dev --prefix /opt/renderer \
    && node -e "if (require('/opt/renderer/node_modules/sharp/package.json').version !== '${SHARP_VERSION}') process.exit(1)"

ENV NODE_PATH=/opt/renderer/node_modules \
    WEATHER_EPAPER_PYTHON=python3

WORKDIR /work

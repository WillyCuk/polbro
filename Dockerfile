FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_AUTH_BACKEND_API_URL
ARG NEXT_PUBLIC_POLLING_BACKEND_API_URL
ARG NEXT_PUBLIC_POLLING_FRONTEND_API_URL

#PARSE ARG TO ENV

ENV NEXT_PUBLIC_AUTH_BACKEND_API_URL=${NEXT_PUBLIC_AUTH_BACKEND_API_URL}
ENV NEXT_PUBLIC_POLLING_BACKEND_API_URL=${NEXT_PUBLIC_POLLING_BACKEND_API_URL}
ENV NEXT_PUBLIC_POLLING_FRONTEND_API_URL=${NEXT_PUBLIC_POLLING_FRONTEND_API_URL}

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
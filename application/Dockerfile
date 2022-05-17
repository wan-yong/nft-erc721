FROM node:14-alpine3.14 AS build

RUN apk add --no-cache g++ make python3 dumb-init

WORKDIR /app

COPY --chown=node:node . /app

RUN npm ci
RUN npm prune --production

FROM node:14-alpine3.14
ENV NODE_ENV production
WORKDIR /app

COPY --chown=node:node --from=build /app .

EXPOSE 3000  

USER node

ENTRYPOINT [ "dumb-init", "--", "npm", "run"]
CMD ["initmsg"]

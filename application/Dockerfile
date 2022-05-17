FROM node:14 AS build

RUN apt-get update
RUN apt-get install -y g++ make python3 dumb-init

WORKDIR /app

RUN mkdir -p /app/test-network/organizations/peerOrganizations/
COPY --chown=node:node . /app/nft-erc721/application/

WORKDIR /app/nft-erc721/application/

RUN npm ci
RUN npm prune --production

FROM node:14
ENV NODE_ENV production
WORKDIR /app

COPY --chown=node:node --from=build /app .

EXPOSE 3000  

USER node

ENTRYPOINT [ "dumb-init", "--", "npm", "run"]
CMD ["initmsg"]

FROM node:lts-alpine

ENV HOME_DIR /home/node/app
WORKDIR $HOME_DIR

# NPM BUG TEMP FIX
RUN npm config set unsafe-perm true

ENV NODE_ENV production
RUN npm install -g nodemon sequelize-cli

COPY package.json $HOME_DIR
RUN npm install --production

COPY config $HOME_DIR/config
COPY sequelize $HOME_DIR/sequelize
COPY src $HOME_DIR/src
COPY .sequelizerc $HOME_DIR/
RUN chown node:node * -R

USER node

CMD ["npm", "start"]

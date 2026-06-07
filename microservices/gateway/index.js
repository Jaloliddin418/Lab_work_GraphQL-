const { ApolloServer } = require('@apollo/server');
const { ApolloGateway, IntrospectAndCompose } = require('@apollo/gateway');
const { startStandaloneServer } = require('@apollo/server/standalone');

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      {
        name: 'users',
        url: process.env.USERS_SERVICE_URL || 'http://localhost:4001/graphql',
      },
      {
        name: 'products',
        url: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:4002/graphql',
      },
      {
        name: 'orders',
        url: process.env.ORDERS_SERVICE_URL || 'http://localhost:4003/graphql',
      },
    ],
  }),
});

const server = new ApolloServer({ gateway });

const PORT = process.env.PORT || 4000;

startStandaloneServer(server, {
  listen: { port: PORT },
}).then(({ url }) => {
  console.log(`Gateway running at ${url}`);
});

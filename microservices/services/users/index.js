const { ApolloServer } = require('@apollo/server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { gql } = require('graphql-tag');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/users_db',
  { logging: false }
);

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'customer',
  },
}, { tableName: 'users' });

const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: String
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!, role: String): User!
    updateUser(id: ID!, name: String, email: String, role: String): User
    deleteUser(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    users: async () => await User.findAll(),
    user: async (_, { id }) => await User.findByPk(id),
  },
  Mutation: {
    createUser: async (_, { name, email, role }) => {
      return await User.create({ name, email, role: role || 'customer' });
    },
    updateUser: async (_, { id, ...fields }) => {
      const user = await User.findByPk(id);
      if (!user) return null;
      return await user.update(fields);
    },
    deleteUser: async (_, { id }) => {
      const deleted = await User.destroy({ where: { id } });
      return deleted > 0;
    },
  },
  User: {
    __resolveReference: async ({ id }) => await User.findByPk(id),
    createdAt: (user) => user.createdAt?.toISOString() || null,
  },
};

async function start() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('Users DB connected');

  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });

  const PORT = process.env.PORT || 4001;
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });
  console.log(`Users service running at ${url}`);
}

start().catch(console.error);

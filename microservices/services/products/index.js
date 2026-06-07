const { ApolloServer } = require('@apollo/server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { gql } = require('graphql-tag');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/products_db',
  { logging: false }
);

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  category: {
    type: DataTypes.STRING,
  },
}, { tableName: 'products' });

const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type Product @key(fields: "id") {
    id: ID!
    name: String!
    description: String
    price: Float!
    stock: Int!
    category: String
    createdAt: String
  }

  type Query {
    products: [Product!]!
    product(id: ID!): Product
    productsByCategory(category: String!): [Product!]!
  }

  type Mutation {
    createProduct(name: String!, description: String, price: Float!, stock: Int, category: String): Product!
    updateProduct(id: ID!, name: String, description: String, price: Float, stock: Int, category: String): Product
    deleteProduct(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    products: async () => await Product.findAll(),
    product: async (_, { id }) => await Product.findByPk(id),
    productsByCategory: async (_, { category }) =>
      await Product.findAll({ where: { category } }),
  },
  Mutation: {
    createProduct: async (_, args) => await Product.create(args),
    updateProduct: async (_, { id, ...fields }) => {
      const product = await Product.findByPk(id);
      if (!product) return null;
      return await product.update(fields);
    },
    deleteProduct: async (_, { id }) => {
      const deleted = await Product.destroy({ where: { id } });
      return deleted > 0;
    },
  },
  Product: {
    __resolveReference: async ({ id }) => await Product.findByPk(id),
    createdAt: (product) => product.createdAt?.toISOString() || null,
  },
};

async function start() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('Products DB connected');

  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });

  const PORT = process.env.PORT || 4002;
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });
  console.log(`Products service running at ${url}`);
}

start().catch(console.error);

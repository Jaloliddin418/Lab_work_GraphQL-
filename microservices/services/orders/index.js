const { ApolloServer } = require('@apollo/server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { gql } = require('graphql-tag');
const mongoose = require('mongoose');

mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/orders_db'
).then(() => console.log('Orders MongoDB connected'))
 .catch(console.error);

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productIds: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  totalPrice: { type: Number, required: true },
  address: { type: String },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

  type Order @key(fields: "id") {
    id: ID!
    userId: ID!
    productIds: [ID!]!
    status: String!
    totalPrice: Float!
    address: String
    createdAt: String
    user: User
    products: [Product]
  }

  type User @key(fields: "id", resolvable: false) {
    id: ID!
  }

  type Product @key(fields: "id", resolvable: false) {
    id: ID!
  }

  type Query {
    orders: [Order!]!
    order(id: ID!): Order
    ordersByUser(userId: ID!): [Order!]!
  }

  type Mutation {
    createOrder(userId: ID!, productIds: [ID!]!, totalPrice: Float!, address: String): Order!
    updateOrderStatus(id: ID!, status: String!): Order
    deleteOrder(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    orders: async () => await Order.find(),
    order: async (_, { id }) => await Order.findById(id),
    ordersByUser: async (_, { userId }) => await Order.find({ userId }),
  },
  Mutation: {
    createOrder: async (_, { userId, productIds, totalPrice, address }) => {
      const order = new Order({ userId, productIds, totalPrice, address });
      return await order.save();
    },
    updateOrderStatus: async (_, { id, status }) => {
      return await Order.findByIdAndUpdate(id, { status }, { new: true });
    },
    deleteOrder: async (_, { id }) => {
      const result = await Order.findByIdAndDelete(id);
      return !!result;
    },
  },
  Order: {
    id: (order) => order._id.toString(),
    createdAt: (order) => order.createdAt?.toISOString() || null,
    user: (order) => ({ __typename: 'User', id: order.userId }),
    products: (order) =>
      order.productIds.map((id) => ({ __typename: 'Product', id })),
    __resolveReference: async ({ id }) => await Order.findById(id),
  },
};

async function start() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });

  const PORT = process.env.PORT || 4003;
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });
  console.log(`Orders service running at ${url}`);
}

start().catch(console.error);

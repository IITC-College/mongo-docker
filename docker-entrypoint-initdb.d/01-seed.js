// Part 7 — Database initialization script (reference solution)
//
// Runs only when MongoDB starts with an EMPTY data directory (fresh volume).
// Seeds an e-commerce dataset into the `appdb` database.

const appdb = db.getSiblingDB('appdb');

// --- users ---
const users = [
  { _id: 1, name: 'Alice Cohen',  email: 'alice@example.com',  createdAt: new Date() },
  { _id: 2, name: 'Bob Levi',     email: 'bob@example.com',     createdAt: new Date() },
  { _id: 3, name: 'Carol Mizrahi',email: 'carol@example.com',   createdAt: new Date() },
];
appdb.users.insertMany(users);

// --- products ---
const products = [
  { _id: 101, name: 'Mechanical Keyboard', price: 349.90, stock: 25 },
  { _id: 102, name: 'USB-C Hub',           price: 129.00, stock: 60 },
  { _id: 103, name: '27" Monitor',         price: 1299.00, stock: 12 },
  { _id: 104, name: 'Webcam 1080p',        price: 219.50, stock: 40 },
];
appdb.products.insertMany(products);

// --- orders --- (reference users + products)
const orders = [
  {
    _id: 1001,
    userId: 1,
    items: [
      { productId: 101, qty: 1, unitPrice: 349.90 },
      { productId: 102, qty: 2, unitPrice: 129.00 },
    ],
    total: 607.90,
    status: 'paid',
    createdAt: new Date(),
  },
  {
    _id: 1002,
    userId: 2,
    items: [{ productId: 103, qty: 1, unitPrice: 1299.00 }],
    total: 1299.00,
    status: 'pending',
    createdAt: new Date(),
  },
  {
    _id: 1003,
    userId: 3,
    items: [
      { productId: 104, qty: 1, unitPrice: 219.50 },
      { productId: 102, qty: 1, unitPrice: 129.00 },
    ],
    total: 348.50,
    status: 'shipped',
    createdAt: new Date(),
  },
];
appdb.orders.insertMany(orders);

// --- confirm seed (visible in `docker logs <container>`) ---
print('Seed complete for appdb:');
print('  users:    ' + appdb.users.countDocuments());
print('  products: ' + appdb.products.countDocuments());
print('  orders:   ' + appdb.orders.countDocuments());

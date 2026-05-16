// Part 7 — Database initialization script
//
// MongoDB runs every .js / .sh file in /docker-entrypoint-initdb.d/
// ONLY when it starts with an EMPTY data directory (fresh volume).
//
// Goal: seed an e-commerce dataset into the `appdb` database.
//
// TODO 1: switch to the appdb database
// const db = db.getSiblingDB('appdb');

// TODO 2: insert sample documents into a `users` collection
//         (e.g. _id, name, email)

// TODO 3: insert sample documents into a `products` collection
//         (e.g. _id, name, price, stock)

// TODO 4: insert sample documents into an `orders` collection
//         each order should reference a user and one or more products

// TODO 5: print the document count of each collection so you can confirm
//         the seed ran (check `docker logs <container>`)

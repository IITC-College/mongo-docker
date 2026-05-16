# Reference Solution — Commands

> Only on the `solution` branch. Use after attempting `LAB.md` yourself.
> Linux/macOS shell syntax; on Windows PowerShell replace `\` line breaks
> with backticks or put each command on one line.
>
> Provided (do not change): `docker-entrypoint-initdb.d/01-seed.js` — it
> creates the `appuser` application user **and** seeds the e-commerce data.
> You build: the `Dockerfile` + all docker / mongosh commands below.

## Part 1 — Run stock MongoDB without persistence

```bash
docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:7

docker ps

mongosh "mongodb://root:secret@localhost:27017/?authSource=admin" --eval '
  db = db.getSiblingDB("appdb");
  db.products.insertMany([{name:"Keyboard", price:349.9},{name:"USB-C Hub", price:129}]);
  print(db.products.countDocuments());
'
```

MongoDB stores data at `/data/db` inside the container.

## Part 2 — Destroy (data loss)

```bash
docker stop mongo-lab && docker rm mongo-lab

docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:7

mongosh "mongodb://root:secret@localhost:27017/?authSource=admin" --eval '
  print(db.getSiblingDB("appdb").products.countDocuments());  // 0 — gone
'
```

Removing the container destroyed its writable layer, including `/data/db`.

## Part 3 — Named volume

```bash
docker stop mongo-lab && docker rm mongo-lab
docker volume create mongodata

docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  -v mongodata:/data/db \
  mongo:7

mongosh "mongodb://root:secret@localhost:27017/?authSource=admin" --eval '
  db.getSiblingDB("appdb").products.insertOne({name:"Monitor", price:1299});
'
```

## Part 4 — Verify persistence

```bash
docker stop mongo-lab && docker rm mongo-lab

docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  -v mongodata:/data/db \
  mongo:7

mongosh "mongodb://root:secret@localhost:27017/?authSource=admin" --eval '
  print(db.getSiblingDB("appdb").products.countDocuments());  // survives
'
```

Difference from Part 2: data lives in the `mongodata` volume, not the
container layer.

## Part 5 — Build the custom auto-seeding image

The `Dockerfile` (reference) bakes the provided init dir into the image:

```dockerfile
FROM mongo:7
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
EXPOSE 27017
```

Init scripts only run on a **fresh** data dir, so use a clean volume:

```bash
docker build -t mongo-lab-img .

docker stop mongo-lab 2>/dev/null; docker rm mongo-lab 2>/dev/null
docker volume rm mongodata 2>/dev/null; docker volume create mongodata

docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  -v mongodata:/data/db \
  mongo-lab-img

sleep 12
docker logs mongo-lab | grep "Seed complete" -A4
# Seed complete for appdb:  users: 3  products: 4  orders: 3
```

The `01-` prefix sets load order; init scripts only fire on a fresh data
directory — same reason a populated volume in Parts 3–4 keeps its old data.

## Part 6 — Connect and explore as `appuser`

The seed created `appuser` / `appsecret` scoped to `appdb`. Connect as that
user, not root:

```bash
mongosh "mongodb://appuser:appsecret@localhost:27017/appdb" --eval '
  print("users="    + db.users.countDocuments());
  print("products=" + db.products.countDocuments());
  print("orders="   + db.orders.countDocuments());
  const o = db.orders.findOne();
  printjson(db.users.findOne({_id:o.userId}));
  printjson(db.products.findOne({_id:o.items[0].productId}));
'

# Least privilege: appuser cannot act outside appdb
mongosh "mongodb://appuser:appsecret@localhost:27017/appdb" --eval '
  db.getSiblingDB("admin").system.users.find().toArray();  // -> not authorized
' || echo "denied (expected)"
```

`docker rm` + recreate on the **same** volume: data persists, but the seed
does **not** re-run (data dir is not fresh).

## Part 7 — Inspect volumes

```bash
docker volume ls
docker volume inspect mongodata
```

Note `Name`, `Mountpoint`, `Driver` (`local`). On a Linux host the data sits
under `/var/lib/docker/volumes/mongodata/_data`. On Docker Desktop it lives
inside the Docker VM, not directly on the host filesystem.

## Part 8 — Bind mount comparison

```bash
mkdir -p ./hostdata

docker stop mongo-lab && docker rm mongo-lab
docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  -v "$(pwd)/hostdata:/data/db" \
  mongo-lab-img

ls -la ./hostdata     # MongoDB files visible directly on the host
```

CI / managed persistence → named volume (portable, Docker-managed, fewer
permission issues). Local file inspection → bind mount (direct host access,
but host-path dependent and permission-prone).

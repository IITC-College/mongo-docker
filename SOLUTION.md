# Reference Solution — Commands

> Only on the `solution` branch. Use after attempting `LAB.md` yourself.
> Linux/macOS shell syntax; on Windows PowerShell replace `\` line breaks
> with backticks or put commands on one line.

## Part 1 — Run without persistence

```bash
docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:7

docker ps

mongosh "mongodb://root:secret@localhost:27017/?authSource=admin" --eval '
  db = db.getSiblingDB("appdb");
  db.products.insertMany([
    {name:"Keyboard", price:349.9},
    {name:"USB-C Hub", price:129}
  ]);
  print(db.products.countDocuments());
'
```

MongoDB stores data at `/data/db` inside the container.

## Part 2 — Destroy (data loss)

```bash
docker stop mongo-lab
docker rm mongo-lab

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

## Part 5 — Inspect volumes

```bash
docker volume ls
docker volume inspect mongodata
```

Note `Name`, `Mountpoint`, `Driver` (`local`). On a Linux host the data sits
under `/var/lib/docker/volumes/mongodata/_data`. On Docker Desktop it lives
inside the Docker VM, not directly on the host filesystem.

## Part 6 — Custom Dockerfile

```bash
docker build -t mongo-lab-img .

docker stop mongo-lab && docker rm mongo-lab
docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  -v mongodata:/data/db \
  mongo-lab-img
```

## Part 7 — Init scripts (fresh volume required)

Init scripts run only on an empty data dir. Use a fresh volume:

```bash
docker stop mongo-lab && docker rm mongo-lab
docker volume rm mongodata          # or use a new name: mongodata2
docker volume create mongodata

docker run -d --name mongo-lab -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  -v mongodata:/data/db \
  mongo-lab-img

docker logs mongo-lab | grep "Seed complete" -A4

mongosh "mongodb://root:secret@localhost:27017/?authSource=admin" --eval '
  const a = db.getSiblingDB("appdb");
  print("users="    + a.users.countDocuments());
  print("products=" + a.products.countDocuments());
  print("orders="   + a.orders.countDocuments());
'
```

Scripts in `/docker-entrypoint-initdb.d/` run in lexical order (hence the
`01-` prefix). They only fire on a fresh data directory — same reason a
populated volume in Parts 3–4 keeps its old data.

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

CI / managed persistence → named volume (portable, Docker-managed,
fewer permission issues). Local inspection of files → bind mount
(direct host access, but host-path dependent and permission-prone).

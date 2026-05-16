# Lab — Persist MongoDB Data with Docker Named Volumes

> **Working branch:** `main`. The seed script is already provided in
> `docker-entrypoint-initdb.d/01-seed.js` — **do not modify it**. Your job is
> the Docker setup: build an image that runs the seed, persist its data with a
> named volume, and connect with `mongosh`. Stuck? `git checkout solution` for
> the reference, then `git checkout main` and try again yourself.

**The scenario:** Your DevOps team is standardizing the backend team's MongoDB
environment using Docker. The seed data and init script are given. You must
containerize MongoDB so every developer and CI run gets the same seeded
database — and so the data survives container removal.

**Conventions used below:**

- Image name: `mongo-lab-img`
- Container name: `mongo-lab`
- Port: `27017`
- Root user / password: `root` / `secret` (admin only)
- App user / password: `appuser` / `appsecret` (created by the seed, scoped to `appdb`)
- App database: `appdb` (seeded by the provided script)
- Named volume: `mongodata`

**What is provided vs. what you do:**

| Provided (do not change)                 | You build                                   |
| ---------------------------------------- | ------------------------------------------- |
| `docker-entrypoint-initdb.d/01-seed.js`  | `Dockerfile` (currently a stub with TODOs)  |
| This `LAB.md`                            | All `docker` / `docker volume` commands     |
|                                          | The `mongosh` connection                    |

---

## Part 1 — Run Stock MongoDB Without Persistence

**Objective:** Get the official `mongo` image running and feel that it is
ephemeral. (No custom image yet — that's Part 5.)

### Instructions

1. Run an official `mongo` container in the background.
2. Configure via flags / environment variables:
   - container name `mongo-lab`
   - publish port `27017`
   - root credentials via `MONGO_INITDB_ROOT_USERNAME` and
     `MONGO_INITDB_ROOT_PASSWORD`
3. Confirm it is running (`docker ps`).
4. Connect with `mongosh` using the root credentials.
5. Manually create database `appdb`, a `products` collection, and 2–3 docs.

### Verification

- `docker ps` shows `mongo-lab` as `Up`
- `mongosh` connects; `db.products.countDocuments()` returns your count

### Investigation Questions

- Inside the container, which directory does MongoDB write its data files to?
- What does the `MONGO_INITDB_ROOT_*` env config do on first start?

---

## Part 2 — Destroy the Container

**Objective:** Experience data loss firsthand.

### Instructions

1. Stop the `mongo-lab` container.
2. **Remove** it completely (`docker rm`).
3. Run a brand-new `mongo` container with the same settings (still no volume).
4. Reconnect with `mongosh` and look for your `appdb` / `products` data.

### Verification

- The new container is running
- Your data is **gone**

### Investigation Questions

- Why did the data disappear?
- Where was MongoDB storing the files, and what happened to that storage on
  `docker rm`?
- Are containers designed to hold persistent state? Why / why not?

---

## Part 3 — Add a Named Volume

**Objective:** Make stock MongoDB persistent with Docker-managed storage.

### Instructions

1. Create a named volume called `mongodata`.
2. Run a fresh `mongo` container, mounting `mongodata` at MongoDB's internal
   data path (`/data/db`).
3. Connect with `mongosh` and recreate some sample data.

### Verification

- `docker volume ls` lists `mongodata`
- Data is queryable

### Investigation Questions

- Why `/data/db` specifically? How did you confirm the correct path?
- Is the volume tied to this container's lifecycle?

---

## Part 4 — Verify Persistence

**Objective:** Prove the volume outlives the container.

### Instructions

1. Stop the container, then **remove** it completely (`docker rm`).
2. Run a **brand-new** `mongo` container mounting the **same** `mongodata`
   volume at `/data/db`.
3. Connect with `mongosh` and check your data.

### Verification

- The container was fully removed and recreated
- Your data **still exists**

### Investigation Questions

- What is the key difference between Part 2 and Part 4?
- State, in one sentence, the relationship between containers and volumes.

---

## Part 5 — Build a Custom Image That Auto-Seeds

**Objective:** Stop creating data by hand. Build an image from the provided
`Dockerfile` (currently a stub) that bakes in the **provided** seed script so
MongoDB seeds `appdb` automatically on first start.

### Instructions

1. Inspect `docker-entrypoint-initdb.d/01-seed.js` — this is **provided and
   working**. Do not modify it. Note it seeds `users`, `products`, `orders`
   into `appdb`, **and creates the `appuser` application user** scoped to
   `appdb`.
2. Open `Dockerfile` (a stub with TODOs). Implement it so that:
   - it is based on the official `mongo` image (pin a tag, not `:latest`)
   - it copies the `docker-entrypoint-initdb.d/` directory into the image at
     `/docker-entrypoint-initdb.d/`
3. Build the image: tag it `mongo-lab-img`.
4. Run a container from **your** image. Because init scripts only run on a
   **fresh** data directory, use a **new** named volume (or remove the old
   `mongodata` first).
5. Check `docker logs mongo-lab` for the `Seed complete` output.

### Verification

- `docker build` succeeds
- `docker logs` shows the seed counts (users: 3, products: 4, orders: 3)

### Investigation Questions

- Why pin a specific `mongo` tag instead of `latest`?
- Why must the volume be *fresh* for the seed to run? (Relate to Parts 3–4.)
- What is the load order if there are multiple init scripts? (Hint: the `01-`
  prefix.)

---

## Part 6 — Connect and Explore the Seeded Data

**Objective:** Use `mongosh` to confirm the auto-seeded e-commerce data, and
connect as the least-privilege `appuser` the seed created.

### Instructions

1. Connect to `appdb` with `mongosh` as **`appuser`** (not root). The seed
   created this user scoped to `appdb` with `readWrite`.
2. Run queries to confirm the seed:
   - count documents in `users`, `products`, `orders`
   - find one order and trace its `userId` / `productId` references back to
     the `users` and `products` collections
3. Try a privileged action outside `appdb` (e.g. list databases or write to
   another DB) and observe `appuser` is denied.

### Verification

- `appuser` connects to `appdb` successfully
- `db.users.countDocuments()` → 3
- `db.products.countDocuments()` → 4
- `db.orders.countDocuments()` → 3
- You can resolve an order's references to a real user and real products
- `appuser` is rejected when acting outside `appdb`

### Investigation Questions

- Why connect as `appuser` instead of root? What is least privilege?
- Did you have to insert any data by hand this time? Why not?
- If you `docker rm` this container and recreate it on the **same** volume,
  will the seed run again? Will the data still be there? (Explain both.)

---

## Part 7 — Inspect Docker Volumes

**Objective:** Understand where and how Docker stores volume data.

### Instructions

1. List all Docker volumes.
2. Inspect the volume backing your seeded container.
3. Identify the **name**, **mountpoint**, and **driver**.
4. Research: on a Linux Docker host, which directory holds named-volume data?

### Verification

- You can state the mountpoint and driver for the volume

### Investigation Questions

- Why is the mountpoint *Docker-managed* rather than a path you chose?
- On Docker Desktop (Windows/macOS), where does this data physically live?

---

## Part 8 — Bind Mounts vs Named Volumes

**Objective:** Compare the two persistence mechanisms.

### Instructions

1. Run a container from your image using a **bind mount** to a host path
   (e.g. the `mongo-init/` directory or another host folder) for `/data/db`
   instead of a named volume.
2. Inspect the host directory — note you can browse the files directly.
3. Compare with the named-volume behavior from Parts 3–7.

### Comparison

| Bind Mount                  | Named Volume                 |
| --------------------------- | ---------------------------- |
| Good for development access | Good for managed persistence |
| Host path dependent         | Docker managed               |
| Easier manual inspection    | More portable                |
| Riskier permissions         | Cleaner abstraction          |

### Investigation Questions

- For a CI pipeline's database, which would you choose, and why?
- For a developer who wants to inspect files on the host, which fits?
- What permission problems can bind mounts cause that named volumes avoid?

---

## Final Learning Outcome

You should now be able to explain, with confidence:

- **Containers are ephemeral** — their writable layer dies with `docker rm`.
- **Volumes are persistent infrastructure** — independent of any container.
- A custom image + init scripts gives every developer and CI run an
  identical, auto-seeded database.
- Named volumes are Docker-managed and portable; bind mounts give direct host
  access at the cost of portability and permission safety.

That distinction is one of the most important concepts in real DevOps work.

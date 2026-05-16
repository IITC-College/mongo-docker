# Lab — Persist MongoDB Data with Docker Named Volumes

> **Working branch:** `main` (skeleton). Stuck? Peek at `git checkout solution`,
> then return with `git checkout main`. Try each part yourself first.

**The scenario:** Your DevOps team is standardizing the backend team's MongoDB
environment using Docker. It works at first — then container removal wipes all
data. Fix it.

**Conventions used below:**

- Container name: `mongo-lab`
- Port: `27017`
- Root user / password: `root` / `secret`
- App database: `appdb`
- Named volume: `mongodata`

---

## Part 1 — Run MongoDB Without Persistence

**Objective:** Get MongoDB running in a container and create real data.

### Instructions

1. Run an official `mongo` container in the background.
2. Configure via flags / environment variables:
   - container name `mongo-lab`
   - publish port `27017`
   - root username/password using `MONGO_INITDB_ROOT_USERNAME` and
     `MONGO_INITDB_ROOT_PASSWORD`
3. Confirm the container is running (`docker ps`).
4. Connect with `mongosh` (or Compass) using the root credentials.
5. Create:
   - database `appdb`
   - collection `products`
   - 2–3 sample documents

### Verification

- `docker ps` shows `mongo-lab` as `Up`
- `mongosh` connects and `db.products.countDocuments()` returns your count

### Investigation Questions

- Inside the container, what directory does MongoDB write its data files to?
- What does the `MONGO_INITDB_ROOT_*` env config actually do on first start?

---

## Part 2 — Destroy the Container

**Objective:** Experience data loss firsthand.

### Instructions

1. Stop the `mongo-lab` container.
2. **Remove** the container completely (`docker rm`).
3. Run a brand-new `mongo` container with the same settings (no volume).
4. Reconnect with `mongosh`.
5. Look for your `appdb` / `products` data.

### Verification

- The new container is running
- `appdb` / `products` data is **gone**

### Investigation Questions

- Why did the data disappear?
- Where exactly was MongoDB storing the files, and what happened to that
  storage when the container was removed?
- What happens to *any* container filesystem changes after `docker rm`?
- Are containers designed to hold persistent state? Why / why not?

---

## Part 3 — Add a Named Volume

**Objective:** Introduce Docker-managed persistent storage.

### Instructions

1. Create a named volume called `mongodata`.
2. Run a fresh `mongo` container, mounting `mongodata` at MongoDB's internal
   data path (`/data/db`).
3. Connect and recreate your sample data (`appdb` / `products`).

### Verification

- `docker volume ls` lists `mongodata`
- Container runs and your data is queryable

### Investigation Questions

- Why `/data/db` specifically? How did you find the correct path?
- Is the volume tied to this container's lifecycle?

---

## Part 4 — Verify Persistence

**Objective:** Prove the volume outlives the container.

### Instructions

1. Stop the container.
2. **Remove** the container completely (`docker rm`).
3. Run a **brand-new** `mongo` container mounting the **same** `mongodata`
   volume at `/data/db`.
4. Connect and check your data.

### Verification

- The container was fully removed and recreated
- `appdb` / `products` data **still exists**

### Investigation Questions

- What is the key difference between Part 2 and Part 4?
- Restate, in one sentence, the relationship between containers and volumes.

---

## Part 5 — Inspect Docker Volumes

**Objective:** Understand where and how Docker stores volume data.

### Instructions

1. List all Docker volumes.
2. Inspect the `mongodata` volume.
3. Identify from the output:
   - volume **name**
   - **mountpoint**
   - **driver**
4. Research: on a Linux Docker host, what directory holds named-volume data?

### Verification

- You can state the mountpoint and driver for `mongodata`

### Investigation Questions

- Why is the mountpoint path *Docker-managed* rather than something you chose?
- On Docker Desktop (Windows/macOS), where does this data physically live?

---

## Part 6 — Create a Dockerfile

**Objective:** Build a custom MongoDB image instead of using `mongo` directly.

### Instructions

1. Open the `Dockerfile` in this repo (currently a stub with TODOs).
2. Base it off the official `mongo` image (pin a tag).
3. Build the image with a tag (e.g. `mongo-lab`).
4. Run a container from **your** image, still using the `mongodata` volume.

### Verification

- `docker build` succeeds
- A container from your image runs and serves MongoDB on `27017`

### Investigation Questions

- Why pin a specific `mongo` tag instead of `latest`?
- What did your custom image add over the base image (so far)?

---

## Part 7 — Add Initialization Scripts

**Objective:** Auto-seed the database on first run.

### Instructions

1. Open `docker-entrypoint-initdb.d/01-seed.js` (stub with TODOs).
2. Implement it to seed an e-commerce dataset into `appdb`:
   - `users`, `products`, `orders` collections
   - a few sample documents each (orders should reference users/products)
3. Ensure your `Dockerfile` copies the script into
   `/docker-entrypoint-initdb.d/`.
4. Rebuild the image.
5. Run a container against a **fresh** volume so the init scripts execute.

### Verification

- On a fresh volume, `appdb` contains seeded `users`, `products`, `orders`
- `db.orders.countDocuments()` returns the seeded count

### Investigation Questions

- Why do scripts in `/docker-entrypoint-initdb.d/` only run on a *fresh*
  data directory? (Hint: relate this to Parts 3–4.)
- What is the load order of multiple init scripts?

---

## Part 8 — Bind Mounts vs Named Volumes

**Objective:** Compare the two persistence mechanisms.

### Instructions

1. Run a MongoDB container using a **bind mount** to a host path
   (use the `mongo-init/` directory or another host folder) instead of a
   named volume for `/data/db`.
2. Inspect the host directory — note you can browse the files directly.
3. Compare with the named-volume behavior from Parts 3–5.

### Comparison

| Bind Mount                  | Named Volume                 |
| --------------------------- | ---------------------------- |
| Good for development access | Good for managed persistence |
| Host path dependent         | Docker managed               |
| Easier manual inspection    | More portable                |
| Riskier permissions         | Cleaner abstraction          |

### Investigation Questions

- For a CI pipeline, which would you choose for the database, and why?
- For a developer who wants to inspect seed files on the host, which fits?
- What permission problems can bind mounts cause that named volumes avoid?

---

## Final Learning Outcome

You should now be able to explain, with confidence:

- **Containers are ephemeral** — their writable layer dies with `docker rm`.
- **Volumes are persistent infrastructure** — independent of any container.
- Named volumes are Docker-managed and portable; bind mounts give you direct
  host access at the cost of portability and permission safety.

That distinction is one of the most important concepts in real DevOps work.

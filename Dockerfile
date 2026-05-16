# Custom MongoDB image (reference solution — LAB.md Part 5)
# Pin a major tag for reproducibility — never :latest in CI.
FROM mongo:7

# Bake in the provided init dir. MongoDB runs these scripts (creating
# appuser + seeding appdb) only on a FRESH data directory.
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/

# Documentation only; publishing the port still requires -p at run time.
EXPOSE 27017

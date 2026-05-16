# Part 6 — Custom MongoDB image (reference solution)
# Pin a major tag for reproducibility — never :latest in CI.
FROM mongo:7

# Part 7 — Init scripts run automatically on a FRESH data directory.
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/

# Documentation only; publishing the port still requires -p at run time.
EXPOSE 27017

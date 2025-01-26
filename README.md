# Build Image

```bash
docker build -t judge .
```


# Create Container

```bash
docker run -d --privileged --name=judge -p 8000:8000 -p 5050:5050 judge
```

## Create Container With `Docker Compose`

Create four containers with `docker compose`, run the following command in current directory:

```bash
docker-compose up -d
```

With file `docker-compose.yml`, the command will create four running containers.
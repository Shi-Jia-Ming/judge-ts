# Build Image

```bash
docker build -t judge .
```


# Create Container

```bash
docker run -it --privileged --name=judge judge
```

# Use Automatic Shell

```bash
#without proxy
sudo ./build.sh

# with proxy
sudo proxychains3 ./build.sh
```

docker rm judge
docker rmi judge

docker build -t judge .
docker run -it --privileged --name judge -p 8000:8000 -p 5050:5050 judge
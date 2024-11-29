docker stop judge-hitwhoj
docker rm judge-hitwhoj
docker rmi judge-hitwhoj

docker build -t judge-hitwhoj .
docker run -it --privileged --name judge-hitwhoj -p 8000:8000 -p 5050:5050 judge-hitwhoj

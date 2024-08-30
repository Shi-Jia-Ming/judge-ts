FROM ubuntu:latest

WORKDIR /root

COPY ./go-judge ./mount.yaml /root/

RUN apt update && apt install -y curl sudo git
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && apt-get install -y nodejs

RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/

RUN git clone -b master https://github.com/hitwhoj/judge-ts.git

RUN cd judge-ts && npm install && npm run build

RUN apt install -y gcc g++

COPY ./start.sh /root/start.sh

EXPOSE 5050/tcp 8000/tcp

ENTRYPOINT [ "./start.sh" ]
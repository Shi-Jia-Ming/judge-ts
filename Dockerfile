FROM ubuntu:latest

WORKDIR /root

COPY ./go-judge ./mount.yaml /root/

RUN apt update && apt install -y curl sudo git
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
RUN apt-get install -y nodejs

RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/

RUN git clone -b master https://github.com/hitwhoj/judge-ts.git

RUN cd judge-ts && npm install && npm run build

# TODO temproraily use simple copy
RUN cd judge-ts && cp .env.example .env

RUN apt install -y gcc g++
RUN mkdir /root/output

COPY ./start.sh /root/start.sh

RUN chmod +x ./start.sh
RUN chmod +x ./go-judge

EXPOSE 5050/tcp 8000/tcp

ENTRYPOINT [ "sh", "start.sh" ]

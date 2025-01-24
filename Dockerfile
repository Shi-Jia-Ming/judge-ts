FROM criyle/go-judge

WORKDIR /opt

RUN apt update && apt install -y curl sudo git gcc g++ supervisor
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
RUN apt-get install -y nodejs

RUN npm config set registry https://mirrors.huaweicloud.com/repository/npm/

RUN git clone -b dev-sjm https://github.com/hitwhoj/judge-ts.git

RUN cd judge-ts && npm install && npm run build

COPY ./go-judge.conf /etc/supervisor/conf.d/go-judge.conf
COPY ./.env /opt/.env

EXPOSE 5050/tcp 8000/tcp

ENTRYPOINT [  "/bin/sh", "-c", "supervisord -c /etc/supervisor/supervisord.conf && node judge-ts/dist/index.js" ]

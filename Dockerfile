
FROM registry.cn-hangzhou.aliyuncs.com/maobon/python:3.11-slim

WORKDIR /application

COPY . .

RUN pip install -r requirements.txt

EXPOSE 10000

ENTRYPOINT ["python", "h5Server.py"]

#                             --name container's name
#                -p outter:container                             --port python server port
# docker run -id -p 9000:9000 -p 10000:10000/udp --name asr_web_client e7230ae69930 --port 9000

FROM registry.cn-hangzhou.aliyuncs.com/maobon/python:3.11-slim

WORKDIR /application

COPY . .

RUN pip install -r requirements.txt

ARG port

ENTRYPOINT ["python", "h5Server.py"]

#                             --name container's name
#                -p outter:container                         --port python server port
# docker run -id -p 9000:9000 --name asr_web_client IMAGE_ID --port 9000
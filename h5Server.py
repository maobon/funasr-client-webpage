# -*- coding: utf-8 -*-
###
### Copyright FunASR (https://github.com/alibaba-damo-academy/FunASR). All Rights
### Reserved. MIT License  (https://opensource.org/licenses/MIT)
###
### 2022-2023 by zhaoming,mali aihealthx.com
import os

from flask import Flask, redirect, jsonify, request
from broadcast import send_udp_broadcast
import argparse

# from gevent.pywsgi import WSGIServer

app = Flask(__name__, static_folder="src", static_url_path="/src")


@app.route("/")
def homepage():
    return redirect("/src/homepage.html")

# server for webpage client send message to this server
# broadcast received message UDP
@app.route('/post_endpoint', methods=['POST'])
def post_endpoint():
    data = request.json
    # 处理data，例如存储数据、计算结果等
    print(f'UDP broadcast server received data: {data}')
    send_udp_broadcast(data)

    # 返回响应
    return 'Data received', 200
# -------------

parser = argparse.ArgumentParser()
parser.add_argument(
    "--host", type=str, default="0.0.0.0", required=False, help="host ip, localhost, 0.0.0.0"
)
parser.add_argument("--port", type=int, default=1337, required=False, help="html5 server port")

parser.add_argument(
    "--certfile", type=str, default="./ssl_key/server.crt", required=False, help="certfile for ssl"
)

parser.add_argument(
    "--keyfile", type=str, default="./ssl_key/server.key", required=False, help="keyfile for ssl"
)


if __name__ == "__main__":

    args = parser.parse_args()
    port = args.port

    # WSGIServer
    # ssl = {
    #    'certfile': 'server.crt',
    #    'keyfile': 'server.key'
    # }
    # httpsServer = WSGIServer(("0.0.0.0",port), app, **ssl)
    # httpsServer.serve_forever()

    # flask
    print("srv run on ", args.host)

    app.run(
        debug=False,
        threaded=True,
        host=args.host,
        port=port,
        #    ssl_context=(args.certfile, args.keyfile),
    )

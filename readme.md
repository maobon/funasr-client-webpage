
#### Html5

```shell
h5Server.py [-h] [--host HOST] [--port PORT] [--certfile CERTFILE] [--keyfile KEYFILE]             
```
As shown in the example below, pay attention to the IP address. If accessing from another device (such as a mobile phone), you need to set the IP address to the real public IP address.
```shell
python h5Server.py --host 0.0.0.0 --port 1337
```

Build exe package, 
first of all use pip install pyinstaller, delete build and dist folder if existed.
Also delete h5Server.spec file which using for pyinstaller analysis.

```shell
pyinstaller --onefile --windowed --add-data "src;src" .\h5Server.py
```
How to use exe file ?
In your terminal exe it. add --port 9000 to spec port.
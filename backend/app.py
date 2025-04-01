from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
@app.route('/')
def hello_world():
    print("Flask,Hellow", flush=True)
    return 'Hello, This changes everything'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
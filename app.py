# -*- coding: utf-8 -*-
from flask import Flask, render_template
import os
import json

app = Flask(__name__)

@app.route('/')
def index():
    path = 'static/svg'
    files = os.listdir(path)
    filter_files = []
    for file in files:
        if file.endswith('svg'):
            filter_files.append(file)
    return render_template('index.html', files=filter_files)

@app.route('/painting/<name>')
def painting(name=None):
    print name
    file = 'static/svg/{}'.format(name)
    color_json = 'static/svg/{}'.format(name.replace('svg', 'json'))
    with open(file) as f:
        svg = f.read()
    with open(color_json) as f:
        colors = json.loads(f.read())
    encode_colors = []
    for color in colors: 
        encode_colors.append(color.encode('ascii'))
    return render_template('painting.html', svg=svg, colors=encode_colors, name=name)
    

if __name__ == "__main__":
    app.run(debug=True, port=8000, host='0.0.0.0')
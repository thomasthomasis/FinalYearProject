from flask import Flask, request, jsonify, Response, render_template
import json
from generate_notes import create_array_of_generated_notes

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generatenotes', methods=['POST'])
def generate_notes():
    data = request.get_json()
    numNotes = data['numNotes']
    returnedData = create_array_of_generated_notes(data, numNotes)
    print(data)
    print("returned data: ", returnedData)

    return jsonify(returnedData)

@app.route('/generatenotesget', methods=['GET'])
def generate_notes_get():
    print("yes")


if __name__ == '__main__':
    app.run(debug=True)

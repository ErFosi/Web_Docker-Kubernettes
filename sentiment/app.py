# app.py
from flask import Flask, request, jsonify
from textblob import TextBlob


app = Flask(__name__)

@app.route('/analyze_sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    message = data.get('message', '')

    # Analizar el sentimiento con TextBlob (puedes usar tu propio modelo o servicio)
    analysis = TextBlob(message)
    sentiment = 'positivo' if analysis.sentiment.polarity > 0 else 'negativo' if analysis.sentiment.polarity < 0 else 'neutro'
    print("Mensaje con sentimiento:"+sentiment)
    return jsonify({'sentiment': sentiment})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
    print("Mensaje enviado")
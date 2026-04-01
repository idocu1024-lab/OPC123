import json
import os
import uuid
from datetime import date
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
DATA_FILE = os.path.join(DATA_DIR, 'articles.json')


def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_data(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/data/articles.json')
def get_articles():
    return jsonify(load_data())


@app.route('/api/articles', methods=['POST'])
def add_article():
    body = request.get_json()
    if not body:
        return jsonify({'error': 'JSON body required'}), 400

    url = body.get('url', '').strip()
    title = body.get('title', '').strip()
    summary = body.get('summary', '').strip()
    category = body.get('category', 'getting-started').strip()

    if not url or not title:
        return jsonify({'error': 'title and url are required'}), 400

    data = load_data()

    # Dedup by URL
    if any(a['url'] == url for a in data['articles']):
        return jsonify({'error': 'Article with this URL already exists'}), 409

    # Validate category
    valid_cats = [c['id'] for c in data['categories']]
    if category not in valid_cats:
        category = 'getting-started'

    article = {
        'id': f'art-{uuid.uuid4().hex[:8]}',
        'title': title,
        'url': url,
        'summary': summary,
        'category': category,
        'tags': body.get('tags', []),
        'source': body.get('source', ''),
        'datePublished': body.get('datePublished', date.today().isoformat()),
        'language': body.get('language', 'en'),
    }

    data['articles'].insert(0, article)
    save_data(data)

    return jsonify({'ok': True, 'article': article}), 201


@app.route('/api/articles/<article_id>', methods=['DELETE'])
def delete_article(article_id):
    data = load_data()
    before = len(data['articles'])
    data['articles'] = [a for a in data['articles'] if a['id'] != article_id]

    if len(data['articles']) == before:
        return jsonify({'error': 'Article not found'}), 404

    save_data(data)
    return jsonify({'ok': True})


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import os
from gemini_service import GeminiService
from speech_processor import SpeechRecognizer
from code_analyzer import CodeAnalyzer
from user_profiles import UserProfileManager
from dotenv import load_dotenv
app = Flask(__name__)
CORS(app)

# Initialize services
load_dotenv()
GEMINI_API_KEY="INSERT API KEY HERE"
gemini_service = GeminiService(api_key=GEMINI_API_KEY)
speech_recognizer = SpeechRecognizer()
code_analyzer = CodeAnalyzer()
user_profile_manager = UserProfileManager()

# Update your app initialization
app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Add a route to serve frontend files
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')
@app.route('/api/generate_test_cases', methods=['POST'])
def generate_test_cases():
    data = request.json
    code = data.get('code')
    language = data.get('language')
    test_cases = gemini_service.generate_test_cases(code, language)
    return jsonify({
        'status': 'success',
        'test_cases': test_cases
    })

@app.route('/api/generate_documentation', methods=['POST'])
def generate_documentation():
    data = request.json
    code = data.get('code')
    language = data.get('language')
    documentation = gemini_service.generate_documentation(code, language)
    return jsonify({
        'status': 'success',
        'documentation': documentation
    })

@app.route('/api/process_voice', methods=['POST'])
def process_voice():
    audio_data = request.files.get('audio')
    user_id = request.form.get('user_id')
    
    # Process audio to text
    text = speech_recognizer.transcribe(audio_data)
    
    # Get user context
    user_context = user_profile_manager.get_user_context(user_id)
    
    # Generate response using Gemini
    response = gemini_service.generate_code_response(text, user_context)
    
    return jsonify({
        'text': text,
        'response': response
    })
# Add these routes for file operations
@app.route('/api/format_code', methods=['POST'])
def format_code():
    data = request.json
    code = data.get('code')
    language = data.get('language')
    
    # Simple formatting logic (you might want to use language-specific formatters)
    formatted_code = code  # Replace with actual formatting
    
    return jsonify({
        'status': 'success',
        'formatted_code': formatted_code
    })

@app.route('/api/explain_code', methods=['POST'])
def explain_code():
    data = request.json
    code = data.get('code')
    language = data.get('language')
    
    explanation = gemini_service.explain_code(code, language)
    
    return jsonify({
        'status': 'success',
        'explanation': explanation
    })

@app.route('/api/improve_code', methods=['POST'])
def improve_code():
    data = request.json
    code = data.get('code')
    language = data.get('language')
    
    improved_code, explanation = gemini_service.improve_code(code, language)
    
    return jsonify({
        'status': 'success',
        'improved_code': improved_code,
        'explanation': explanation
    })

@app.route('/api/analyze_code', methods=['POST'])
def analyze_code():
    data = request.json
    code = data.get('code')
    language = data.get('language')
    
    analysis = code_analyzer.analyze(code, language)
    suggestions = gemini_service.get_code_improvements(code, language)
    
    return jsonify({
        'analysis': analysis,
        'suggestions': suggestions
    })

@app.route('/api/get_preferences', methods=['GET'])
def get_preferences():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    preferences = user_profile_manager.get_user_context(user_id)
    
    return jsonify({
        'status': 'success',
        'preferences': preferences
    })

if __name__ == '__main__':
    app.run(debug=True)

import speech_recognition as sr
import tempfile
import os

class SpeechRecognizer:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        
    def transcribe(self, audio_file):
        """Convert speech audio to text"""
        # Save the uploaded file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_filename = temp_audio.name
            
        try:
            with sr.AudioFile(temp_filename) as source:
                audio_data = self.recognizer.record(source)
                text = self.recognizer.recognize_google(audio_data)
                return text
        except Exception as e:
            return f"Error transcribing audio: {str(e)}"
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)

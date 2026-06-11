import google.generativeai as genai
import os
import re

class GeminiService:
    def __init__(self, api_key):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
    def generate_code_response(self, text_query, user_context):
        """Generate code and explanations based on voice input"""
        prompt = f"""
        As an AI pair programmer, help with the following request:
        
        User request: {text_query}
        
        User context:
        - Preferred language: {user_context.get('preferred_language', 'Python')}
        - Skill level: {user_context.get('skill_level', 'intermediate')}
        - Current project: {user_context.get('current_project', 'Not specified')}
        
        Provide:
        1. Code implementation
        2. Brief explanation
        3. Potential improvements
        """
        
        response = self.model.generate_content(prompt)
        return response.text
        
    def get_code_improvements(self, code, language):
        """Analyze code and suggest improvements"""
        prompt = f"""
        Analyze this {language} code and suggest improvements:
        
        ```
        {code}
        ```
        
        Focus on:
        - Performance optimizations
        - Best practices
        - Potential bugs
        - Readability
        """
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def explain_code(self, code, language):
        """Generate explanation for code"""
        prompt = f"""
        Explain this {language} code in detail:
        
        ```
        {code}
        ```
        
        Provide a clear, concise explanation of:
        1. What the code does
        2. How it works
        3. Any important patterns or concepts it demonstrates
        """
        
        response = self.model.generate_content(prompt)
        return response.text

    def improve_code(self, code, language):
        """Improve code and explain changes"""
        prompt = f"""
        Improve this {language} code:
        
        ```
        {code}
        ```
        
        Provide:
        1. An improved version of the code
        2. An explanation of what changes were made and why
        
        Format your response exactly like this:
        
        ```
        [Your improved code here]
        ```
        
        [Your explanation here]
        """
        
        response = self.model.generate_content(prompt)
        text = response.text
        
        # Extract improved code and explanation
        code_pattern = re.compile(r'``````')
        code_match = code_pattern.search(text)
        
        if code_match:
            improved_code = code_match.group(1).strip()
            # Remove the code block to get the explanation
            explanation = code_pattern.sub('', text).strip()
            return improved_code, explanation
        
        # Fallback if parsing fails
        return code, text
    
    def format_code(self, code, language):
        """Format code according to language best practices"""
        prompt = f"""
        Format this {language} code according to best practices and style guides:
        
        ```
        {code}
        ```
        
        Only respond with the formatted code, nothing else.
        """
        
        response = self.model.generate_content(prompt)
        text = response.text
        
        # Try to extract just the code if it's wrapped in markdown code blocks
        code_pattern = re.compile(r'``````')
        code_match = code_pattern.search(text)
        
        if code_match:
            return code_match.group(1).strip()
        
        return text.strip()
    
    def generate_test_cases(self, code, language):
        """Generate test cases for the given code"""
        prompt = f"""
        Generate comprehensive test cases for this {language} code:
        
        ```
        {code}
        ```
        
        Include:
        1. Unit tests covering main functionality
        2. Edge cases
        3. Error handling tests
        
        Provide the test code in {language} syntax.
        """
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def debug_code(self, code, error_message, language):
        """Help debug code based on error message"""
        prompt = f"""
        Debug this {language} code that's producing the following error:
        
        Error: {error_message}
        
        Code:
        ```
        {code}
        ```
        
        Provide:
        1. Explanation of what's causing the error
        2. Fixed version of the code
        3. Tips to avoid similar issues in the future
        """
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def generate_documentation(self, code, language):
        """Generate documentation for code"""
        prompt = f"""
        Generate comprehensive documentation for this {language} code:
        
        ```
        {code}
        ```
        
        Include:
        1. Overview of what the code does
        2. Function/class descriptions
        3. Parameter explanations
        4. Return value descriptions
        5. Usage examples
        
        Format the documentation according to {language} best practices.
        """
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def answer_coding_question(self, question, language):
        """Answer general coding questions"""
        prompt = f"""
        Answer this coding question about {language}:
        
        {question}
        
        Provide:
        1. A clear explanation
        2. Code examples where appropriate
        3. Best practices related to the question
        """
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def suggest_code_completion(self, partial_code, language):
        """Suggest completion for partial code"""
        prompt = f"""
        Complete this partial {language} code:
        
        ```
        {partial_code}
        ```
        
        Only provide the completed code, nothing else.
        """
        
        response = self.model.generate_content(prompt)
        text = response.text
        
        # Try to extract just the code if it's wrapped in markdown code blocks
        code_pattern = re.compile(r'``````')
        code_match = code_pattern.search(text)
        
        if code_match:
            return code_match.group(1).strip()
        
        return text.strip()

import ast
import re

class CodeAnalyzer:
    def __init__(self):
        self.language_analyzers = {
            'python': self.analyze_python,
            'javascript': self.analyze_javascript,
            # Add more language analyzers as needed
        }
    
    def analyze(self, code, language):
        """Analyze code for potential issues and improvements"""
        language = language.lower()
        if language in self.language_analyzers:
            return self.language_analyzers[language](code)
        return {"error": f"Language {language} not supported for analysis"}
    
    def analyze_python(self, code):
        """Analyze Python code"""
        results = {
            "complexity": 0,
            "issues": [],
            "suggestions": []
        }
        
        try:
            # Parse the code into an AST
            tree = ast.parse(code)
            
            # Check for common issues
            for node in ast.walk(tree):
                # Check for excessive function complexity
                if isinstance(node, ast.FunctionDef):
                    if len(node.body) > 20:
                        results["issues"].append(f"Function '{node.name}' might be too complex")
                        results["suggestions"].append(f"Consider breaking '{node.name}' into smaller functions")
                    
                # Check for bare except clauses
                if isinstance(node, ast.ExceptHandler) and node.type is None:
                    results["issues"].append("Bare except clause detected")
                    results["suggestions"].append("Specify exception types to catch")
            
            # Calculate complexity score based on AST node count
            results["complexity"] = sum(1 for _ in ast.walk(tree))
            
        except SyntaxError as e:
            results["issues"].append(f"Syntax error: {str(e)}")
        
        return results
    
    def analyze_javascript(self, code):
        """Analyze JavaScript code"""
        results = {
            "complexity": 0,
            "issues": [],
            "suggestions": []
        }
        
        # Check for console.log statements
        if re.search(r'console\.log', code):
            results["issues"].append("Console.log statements found")
            results["suggestions"].append("Remove console.log statements before production")
        
        # Check for var usage instead of let/const
        if re.search(r'\bvar\b', code):
            results["issues"].append("'var' keyword usage detected")
            results["suggestions"].append("Use 'let' or 'const' instead of 'var'")
        
        # Estimate complexity by counting braces and semicolons
        results["complexity"] = code.count('{') + code.count(';')
        
        return results

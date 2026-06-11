import json
import os
from datetime import datetime

class UserProfileManager:
    def __init__(self, storage_path="user_profiles"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
    
    def get_user_context(self, user_id):
        """Get user context including preferences and history"""
        profile_path = os.path.join(self.storage_path, f"{user_id}.json")
        
        if not os.path.exists(profile_path):
            # Create default profile
            default_profile = {
                "user_id": user_id,
                "created_at": datetime.now().isoformat(),
                "preferences": {
                    "preferred_language": "Python",
                    "skill_level": "intermediate",
                    "theme": "dark",
                    "font_size": 14
                },
                "history": [],
                "learning_path": {
                    "current_level": 1,
                    "completed_challenges": []
                }
            }
            
            with open(profile_path, 'w') as f:
                json.dump(default_profile, f, indent=2)
            
            return default_profile
        
        # Load existing profile
        with open(profile_path, 'r') as f:
            return json.load(f)
    
    def update_preferences(self, user_id, preferences):
        """Update user preferences"""
        profile = self.get_user_context(user_id)
        profile["preferences"].update(preferences)
        profile["updated_at"] = datetime.now().isoformat()
        
        profile_path = os.path.join(self.storage_path, f"{user_id}.json")
        with open(profile_path, 'w') as f:
            json.dump(profile, f, indent=2)
        
        return profile["preferences"]
    
    def add_history_entry(self, user_id, entry_type, content):
        """Add an entry to user history"""
        profile = self.get_user_context(user_id)
        
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": entry_type,
            "content": content
        }
        
        profile["history"].append(history_entry)
        
        # Limit history size
        if len(profile["history"]) > 100:
            profile["history"] = profile["history"][-100:]
        
        profile_path = os.path.join(self.storage_path, f"{user_id}.json")
        with open(profile_path, 'w') as f:
            json.dump(profile, f, indent=2)

# simple_pharmacy_model.py
import pandas as pd
import numpy as np
import joblib
from datetime import datetime

class PharmacyScorer:
    def __init__(self, distance_weight=0.5, price_weight=0.3, availability_weight=0.2):
        self.distance_weight = distance_weight
        self.price_weight = price_weight
        self.availability_weight = availability_weight
        
        # Define reasonable ranges for normalization
        self.max_distance = 15.0  # km
        self.max_price = 150.0    # ₹
        self.max_stock = 200.0    # units
        
    def normalize_distance(self, distance_km):
        """Normalize distance (0-1, higher is better)"""
        normalized = 1 - min(distance_km / self.max_distance, 1.0)
        return max(0, normalized)
    
    def normalize_price(self, price):
        """Normalize price (0-1, higher is better)"""
        normalized = 1 - min(price / self.max_price, 1.0)
        return max(0, normalized)
    
    def normalize_availability(self, stock, expiry_date):
        """Normalize availability (0-1, higher is better)"""
        # Stock component
        stock_score = min(stock / self.max_stock, 1.0)
        
        # Expiry component
        try:
            expiry_date = pd.to_datetime(expiry_date).tz_localize(None)
            current_date = pd.Timestamp.now().tz_localize(None)
            days_until_expiry = (expiry_date - current_date).days
            expiry_score = min(days_until_expiry / 365, 1.0)
        except:
            expiry_score = 0.5  # Default if date parsing fails
        
        # Combine stock and expiry
        availability_score = (stock_score * 0.7 + expiry_score * 0.3)
        return max(0, availability_score)
    
    def calculate_score(self, pharmacy_data):
        """Calculate final score using priority weights"""
        distance = pharmacy_data['distance_km']
        price = pharmacy_data['price']
        stock = pharmacy_data['stock']
        expiry_date = pharmacy_data['expiry_date']
        
        # Calculate individual scores
        distance_score = self.normalize_distance(distance)
        price_score = self.normalize_price(price)
        availability_score = self.normalize_availability(stock, expiry_date)
        
        # Apply priority weights
        final_score = (
            distance_score * self.distance_weight +
            price_score * self.price_weight +
            availability_score * self.availability_weight
        )
        
        # Ensure score is between 0 and 1
        final_score = max(0, min(1, final_score))
        
        return round(final_score, 4)
    
    def save_model(self, filename='pharmacy_scorer.pkl'):
        """Save the model"""
        model_data = {
            'weights': {
                'distance': self.distance_weight,
                'price': self.price_weight,
                'availability': self.availability_weight
            },
            'max_values': {
                'distance': self.max_distance,
                'price': self.max_price,
                'stock': self.max_stock
            }
        }
        joblib.dump(model_data, filename)
        print(f"✅ Model saved as {filename}")

def initialize_model():
    """Initialize and save the model"""
    scorer = PharmacyScorer()
    scorer.save_model('pharmacy_scorer.pkl')
    return scorer

def load_model():
    """Load the model"""
    try:
        model_data = joblib.load('pharmacy_scorer.pkl')
        scorer = PharmacyScorer(
            distance_weight=model_data['weights']['distance'],
            price_weight=model_data['weights']['price'],
            availability_weight=model_data['weights']['availability']
        )
        return scorer
    except FileNotFoundError:
        print("❌ Model file not found. Creating new model...")
        return initialize_model()

# Initialize the model when this file is imported
scorer = load_model()
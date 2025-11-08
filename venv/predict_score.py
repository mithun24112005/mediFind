import pandas as pd
import numpy as np
import joblib
from datetime import datetime

class SimplePharmacyScorer:
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
        # Closer pharmacies get higher scores
        normalized = 1 - min(distance_km / self.max_distance, 1.0)
        return max(0, normalized)
    
    def normalize_price(self, price):
        """Normalize price (0-1, higher is better)"""
        # Cheaper pharmacies get higher scores
        normalized = 1 - min(price / self.max_price, 1.0)
        return max(0, normalized)
    
    def normalize_availability(self, stock, expiry_date):
        """Normalize availability (0-1, higher is better)"""
        # Stock component
        stock_score = min(stock / self.max_stock, 1.0)
        
        # Expiry component
        expiry_date = pd.to_datetime(expiry_date).tz_localize(None)
        current_date = pd.Timestamp.now().tz_localize(None)
        days_until_expiry = (expiry_date - current_date).days
        
        # More days until expiry = better score
        expiry_score = min(days_until_expiry / 365, 1.0)  # Normalize to 1 year
        
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
        
        return {
            'final_score': final_score,
            'components': {
                'distance': distance_score,
                'price': price_score,
                'availability': availability_score
            },
            'contributions': {
                'distance': distance_score * self.distance_weight,
                'price': price_score * self.price_weight,
                'availability': availability_score * self.availability_weight
            }
        }
    
    def save_model(self, filename='simple_pharmacy_scorer.pkl'):
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
        print(f"Model saved as {filename}")

def load_simple_model(filename='simple_pharmacy_scorer.pkl'):
    """Load the simple model"""
    try:
        model_data = joblib.load(filename)
        scorer = SimplePharmacyScorer(
            distance_weight=model_data['weights']['distance'],
            price_weight=model_data['weights']['price'],
            availability_weight=model_data['weights']['availability']
        )
        return scorer
    except FileNotFoundError:
        print(" Model file not found. Creating new model...")
        return SimplePharmacyScorer()

def test_scoring():
    """Test the scoring system with various examples"""
    scorer = SimplePharmacyScorer()
    
    print(" TESTING PHARMACY SCORING SYSTEM")
    print("=" * 60)
    
    test_cases = [
        {
            'name': 'PERFECT: Very close, very cheap, well-stocked',
            'data': {
                'distance_km': 0.5,
                'price': 10,
                'stock': 150,
                'expiry_date': '2026-12-31'
            }
        },
        {
            'name': 'EXCELLENT: Close, affordable, good stock',
            'data': {
                'distance_km': 1.0,
                'price': 25,
                'stock': 100,
                'expiry_date': '2025-12-31'
            }
        },
        {
            'name': 'YOUR TEST CASE: Good distance, very cheap, high stock',
            'data': {
                'distance_km': 2.0,
                'price': 2.0,
                'stock': 1000,  # Will be capped at max_stock
                'expiry_date': '2025-01-01'
            }
        },
        {
            'name': 'GOOD: Close but expensive',
            'data': {
                'distance_km': 1.5,
                'price': 80,
                'stock': 80,
                'expiry_date': '2025-06-30'
            }
        },
        {
            'name': 'AVERAGE: Moderate everything',
            'data': {
                'distance_km': 5.0,
                'price': 50,
                'stock': 50,
                'expiry_date': '2024-12-31'
            }
        },
        {
            'name': 'POOR: Far and expensive',
            'data': {
                'distance_km': 12.0,
                'price': 120,
                'stock': 20,
                'expiry_date': '2024-06-30'
            }
        },
        {
            'name': 'VERY POOR: Very far, very expensive, low stock',
            'data': {
                'distance_km': 20.0,  # Beyond max, will be capped
                'price': 200,         # Beyond max, will be capped
                'stock': 5,
                'expiry_date': '2024-03-31'
            }
        }
    ]
    
    for test in test_cases:
        result = scorer.calculate_score(test['data'])
        
        print(f"\n {test['name']}")
        print(f"   Input: {test['data']['distance_km']}km, ₹{test['data']['price']}, {test['data']['stock']} units")
        print(f"    Final Score: {result['final_score']:.4f}")
        
        # Show component breakdown
        print(f"    Distance: {result['components']['distance']:.3f} (contribution: {result['contributions']['distance']:.3f})")
        print(f"    Price: {result['components']['price']:.3f} (contribution: {result['contributions']['price']:.3f})")
        print(f"    Availability: {result['components']['availability']:.3f} (contribution: {result['contributions']['availability']:.3f})")
        
        # Show rating
        score = result['final_score']
        if score >= 0.8:
            rating = "⭐⭐⭐⭐⭐ EXCELLENT"
        elif score >= 0.6:
            rating = "⭐⭐⭐⭐ GOOD"
        elif score >= 0.4:
            rating = "⭐⭐⭐ AVERAGE"
        elif score >= 0.2:
            rating = "⭐⭐ BELOW AVERAGE"
        else:
            rating = "⭐ POOR"
        print(f"  Rating: {rating}")

def interactive_scorer():
    """Interactive version for user input"""
    scorer = SimplePharmacyScorer()
    
    print(" SIMPLE PHARMACY SCORING SYSTEM")
    print("=" * 50)
    print("Priority: Distance (50%) > Price (30%) > Availability (20%)")
    print("=" * 50)
    
    while True:
        print("\nEnter pharmacy details:")
        try:
            distance = float(input(" Distance in km: "))
            price = float(input(" Price (₹): "))
            stock = int(input(" Stock quantity: "))
            
            print(" Enter expiry date:")
            year = int(input("   Year (e.g., 2025): "))
            month = int(input("   Month (1-12): "))
            day = int(input("   Day (1-31): "))
            expiry_date = f"{year}-{month:02d}-{day:02d}"
            
            pharmacy_data = {
                'distance_km': distance,
                'price': price,
                'stock': stock,
                'expiry_date': expiry_date
            }
            
            result = scorer.calculate_score(pharmacy_data)
            score = result['final_score']
            
            print("\n" + "=" * 50)
            print(" SCORING RESULTS")
            print("=" * 50)
            print(f" Distance: {distance} km")
            print(f" Price: ₹{price}")
            print(f" Stock: {stock} units")
            print(f" Expiry: {expiry_date}")
            print(f"\n FINAL SCORE: {score:.4f}")
            
            # Show rating
            if score >= 0.8:
                rating = "⭐⭐⭐⭐⭐ EXCELLENT"
                rec = "Highly recommended!"
            elif score >= 0.6:
                rating = "⭐⭐⭐⭐ GOOD" 
                rec = "Good choice"
            elif score >= 0.4:
                rating = "⭐⭐⭐ AVERAGE"
                rec = "Consider other options"
            elif score >= 0.2:
                rating = "⭐⭐ BELOW AVERAGE"
                rec = "Not recommended"
            else:
                rating = "⭐ POOR"
                rec = "Avoid if possible"
            
            print(f" Rating: {rating}")
            print(f"Recommendation: {rec}")
            
            # Show contributions
            print(f"\n Score Breakdown:")
            print(f"   Distance contribution: {result['contributions']['distance']:.3f}")
            print(f"   Price contribution: {result['contributions']['price']:.3f}")
            print(f"   Availability contribution: {result['contributions']['availability']:.3f}")
            
            print("\n" + "=" * 50)
            continue_choice = input("\n Score another pharmacy? (y/n): ").lower().strip()
            if continue_choice != 'y':
                print("Thank you for using the Pharmacy Scoring System!")
                break
                
        except ValueError:
            print(" Please enter valid numbers!")
        except Exception as e:
            print(f" Error: {e}")

if __name__ == "__main__":
    # First test the system
    test_scoring()
    
    # Then save the model
    scorer = SimplePharmacyScorer()
    scorer.save_model('simple_pharmacy_scorer.pkl')
    
    print("\n" + "=" * 60)
    print(" Starting Interactive Mode...")
    print("=" * 60)
    
    # Start interactive mode
    interactive_scorer()
# generate_pharmacy_data_fixed.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_pharmacy_dataset_fixed(num_samples=1000):
    """
    Generate synthetic pharmacy data with FIXED timezone handling
    """
    np.random.seed(42)
    random.seed(42)
    
    pharmacy_chains = ['Apollo', 'MedPlus', 'Wellness', 'HealthPlus', 'Care', 'Life', 'Med', 'Pharma']
    pharmacy_types = ['Pharmacy', 'Medicals', 'Drugstore', 'Chemists']
    
    cities_states = [
        ('Bangalore', 'Karnataka'),
        ('Mumbai', 'Maharashtra'), 
        ('Delhi', 'Delhi'),
        ('Chennai', 'Tamil Nadu'),
        ('Hyderabad', 'Telangana'),
        ('Kolkata', 'West Bengal'),
        ('Pune', 'Maharashtra'),
        ('Ahmedabad', 'Gujarat')
    ]
    
    dataset = []
    
    for i in range(num_samples):
        pharmacy_id = f"P{str(i+1).zfill(3)}"
        chain = random.choice(pharmacy_chains)
        p_type = random.choice(pharmacy_types)
        name = f"{chain} {p_type}"
        
        distance_km = round(np.random.exponential(2.0), 2)
        distance_km = min(distance_km, 15)
        
        base_price = random.randint(15, 100)
        price = max(10, base_price + random.randint(-10, 20))
        
        stock = random.randint(0, 200)
        if random.random() < 0.1:
            stock = 0
        
        # FIX: Use timezone-naive dates
        days_from_now = random.randint(30, 1095)
        expiry_date = (datetime.now() + timedelta(days=days_from_now)).strftime("%Y-%m-%d")
        
        city, state = random.choice(cities_states)
        
        # Calculate target score (same as before)
        distance_score = max(0, 1 - (distance_km / 15))
        price_score = max(0, 1 - (price / 120))
        stock_score = min(1, stock / 100)
        
        days_until_expiry = days_from_now
        expiry_score = min(1, days_until_expiry / 180)
        availability_score = (stock_score + expiry_score) / 2
        
        weights = {'distance': 0.4, 'price': 0.35, 'availability': 0.25}
        final_score = (distance_score * weights['distance'] + 
                      price_score * weights['price'] + 
                      availability_score * weights['availability'])
        
        pharmacy_data = {
            "pharmacy_id": pharmacy_id,
            "name": name,
            "distance_km": distance_km,
            "price": price,
            "stock": stock,
            "expiry_date": expiry_date,  # Timezone-naive
            "city": city,
            "state": state,
            "target_score": round(final_score, 4)
        }
        
        dataset.append(pharmacy_data)
    
    return dataset

def save_fixed_dataset():
    """Save the fixed dataset"""
    dataset = generate_pharmacy_dataset_fixed(1000)
    df = pd.DataFrame(dataset)
    df.to_csv('pharmacy_recommendation_dataset_fixed.csv', index=False)
    print("Fixed dataset saved as 'pharmacy_recommendation_dataset_fixed.csv'")
    print(f"Dataset shape: {df.shape}")
    print(f"Sample expiry dates: {df['expiry_date'].head().tolist()}")
    return df

if __name__ == "__main__":
    save_fixed_dataset()
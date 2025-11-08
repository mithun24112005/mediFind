import json
import pickle
import numpy as np

def normalize_feature(values, reverse=False):
    """
    Normalize features to 0-1 scale
    If reverse=True, lower values are better (like distance, price)
    """
    min_val = min(values)
    max_val = max(values)
    
    if min_val == max_val:
        return [1.0] * len(values)
    
    normalized = []
    for value in values:
        if reverse:
            # For distance and price: lower is better
            norm_val = (max_val - value) / (max_val - min_val)
        else:
            # For stock: higher is better
            norm_val = (value - min_val) / (max_val - min_val)
        normalized.append(norm_val)
    
    return normalized

def calculate_pharmacy_scores(pharmacies):
    """
    Calculate scores for each pharmacy based on:
    - Distance: 60% weight (lower is better)
    - Price: 28% weight (lower is better) 
    - Stock: 12% weight (higher is better)
    """
    # Extract features
    distances = [p['distance_km'] for p in pharmacies]
    prices = [p['price'] for p in pharmacies]
    stocks = [p['stock'] for p in pharmacies]
    
    # Normalize features
    norm_distances = normalize_feature(distances, reverse=True)  # Lower distance = better
    norm_prices = normalize_feature(prices, reverse=True)       # Lower price = better
    norm_stocks = normalize_feature(stocks, reverse=False)      # Higher stock = better
    
    # Calculate weighted scores
    weights = {
        'distance': 0.60,  # 70%
        'price': 0.28,     # 20%
        'stock': 0.12      # 10%
    }
    
    scores = []
    for i in range(len(pharmacies)):
        score = (norm_distances[i] * weights['distance'] + 
                norm_prices[i] * weights['price'] + 
                norm_stocks[i] * weights['stock'])
        scores.append(score)
    
    return scores

def sort_pharmacies_by_score(pharmacies, scores):
    """
    Sort pharmacies by their calculated scores in descending order
    """
    # Combine pharmacies with their scores
    pharmacy_scores = list(zip(pharmacies, scores))
    
    # Sort by score (descending order)
    sorted_pharmacies = sorted(pharmacy_scores, key=lambda x: x[1], reverse=True)
    
    return sorted_pharmacies

def create_ranking_model(pharmacies):
    """
    Create a simple ranking model that stores the weights and normalization parameters
    """
    # Store the weights
    model = {
        'weights': {
            'distance': 0.60,
            'price': 0.28,
            'stock': 0.12
        },
        'feature_ranges': {}
    }
    
    # Calculate and store feature ranges for normalization
    distances = [p['distance_km'] for p in pharmacies]
    prices = [p['price'] for p in pharmacies]
    stocks = [p['stock'] for p in pharmacies]
    
    model['feature_ranges']['distance'] = {'min': min(distances), 'max': max(distances)}
    model['feature_ranges']['price'] = {'min': min(prices), 'max': max(prices)}
    model['feature_ranges']['stock'] = {'min': min(stocks), 'max': max(stocks)}
    
    return model

def save_model(model, filename="pharmacy_ranking_model.pkl"):
    """
    Save the trained model to a pickle file
    """
    with open(filename, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Model saved to {filename}")

def load_model(filename="pharmacy_ranking_model.pkl"):
    """
    Load the trained model from a pickle file
    """
    with open(filename, 'rb') as f:
        model = pickle.load(f)
    
    return model

def predict_ranking(pharmacies, model):
    """
    Use the trained model to rank pharmacies
    """
    def normalize_value(value, min_val, max_val, reverse=False):
        if min_val == max_val:
            return 1.0
        if reverse:
            return (max_val - value) / (max_val - min_val)
        else:
            return (value - min_val) / (max_val - min_val)
    
    scores = []
    for pharmacy in pharmacies:
        # Normalize each feature using stored ranges
        norm_distance = normalize_value(
            pharmacy['distance_km'], 
            model['feature_ranges']['distance']['min'],
            model['feature_ranges']['distance']['max'],
            reverse=True
        )
        
        norm_price = normalize_value(
            pharmacy['price'],
            model['feature_ranges']['price']['min'],
            model['feature_ranges']['price']['max'],
            reverse=True
        )
        
        norm_stock = normalize_value(
            pharmacy['stock'],
            model['feature_ranges']['stock']['min'],
            model['feature_ranges']['stock']['max'],
            reverse=False
        )
        
        # Calculate weighted score
        score = (norm_distance * model['weights']['distance'] + 
                norm_price * model['weights']['price'] + 
                norm_stock * model['weights']['stock'])
        
        scores.append(score)
    
    # Sort pharmacies by score
    pharmacy_scores = list(zip(pharmacies, scores))
    sorted_pharmacies = sorted(pharmacy_scores, key=lambda x: x[1], reverse=True)
    
    return sorted_pharmacies

def main():
    # Load the dataset
    try:
        with open('pharmacy_dataset.json', 'r') as f:
            pharmacies = json.load(f)
    except FileNotFoundError:
        print("Please run create_dataset.py first to create the dataset")
        return
    
    print(f"Loaded {len(pharmacies)} pharmacies")
    
    # Train the model
    model = create_ranking_model(pharmacies)
    
    # Save the model
    save_model(model)
    
    # Test the model
    print("\nTesting the model with first 10 pharmacies:")
    ranked_pharmacies = predict_ranking(pharmacies[:10], model)
    
    print("\nTop 5 ranked pharmacies:")
    for i, (pharmacy, score) in enumerate(ranked_pharmacies[:5]):
        print(f"{i+1}. ID: {pharmacy['pharmacy_id']}, "
              f"Distance: {pharmacy['distance_km']}km, "
              f"Price: ₹{pharmacy['price']}, "
              f"Stock: {pharmacy['stock']}, "
              f"Score: {score:.4f}")

if __name__ == "__main__":
    main()
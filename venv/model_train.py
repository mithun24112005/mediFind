import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
import warnings
from datetime import datetime
warnings.filterwarnings('ignore')

class PharmacyRecommendationModel:
    def __init__(self, distance_weight=0.5, price_weight=0.3, availability_weight=0.2):
        self.models = {
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'linear_regression': LinearRegression(),
            'svr': SVR(kernel='rbf')
        }
        self.scaler = StandardScaler()
        self.best_model = None
        self.best_model_name = None
        
        # Priority weights: Distance > Price > Availability
        self.distance_weight = distance_weight
        self.price_weight = price_weight
        self.availability_weight = availability_weight
        
    def prepare_features(self, df):
        """
        Prepare features for training with priority-based feature engineering
        """
        # Basic features
        X = df[['distance_km', 'price', 'stock']].copy()
        
        # Feature engineering with priority focus
        # 1. DISTANCE FEATURES (Highest Priority)
        X['distance_score'] = 1 / (X['distance_km'] + 0.1)  # Inverse distance (higher is better)
        X['distance_category'] = pd.cut(X['distance_km'], 
                                       bins=[0, 1, 3, 5, 10, 15], 
                                       labels=[5, 4, 3, 2, 1]).astype(int)  # 5=best, 1=worst
        X['is_very_close'] = (X['distance_km'] <= 1).astype(int)
        X['is_close'] = ((X['distance_km'] > 1) & (X['distance_km'] <= 3)).astype(int)
        
        # 2. PRICE FEATURES (Second Priority)
        X['price_score'] = 1 / (X['price'] + 0.1)  # Inverse price (higher is better)
        X['price_category'] = pd.cut(X['price'], 
                                    bins=[0, 20, 40, 60, 80, 120], 
                                    labels=[5, 4, 3, 2, 1]).astype(int)
        X['is_cheap'] = (X['price'] <= 25).astype(int)
        X['is_affordable'] = ((X['price'] > 25) & (X['price'] <= 50)).astype(int)
        X['price_per_km'] = X['price'] / (X['distance_km'] + 0.1)  # Combined metric
        
        # 3. AVAILABILITY FEATURES (Third Priority)
        X['stock_ratio'] = X['stock'] / 100
        X['is_well_stocked'] = (X['stock'] >= 80).astype(int)
        X['is_adequately_stocked'] = ((X['stock'] >= 30) & (X['stock'] < 80)).astype(int)
        X['is_out_of_stock'] = (X['stock'] == 0).astype(int)
        X['stock_category'] = pd.cut(X['stock'], 
                                    bins=[-1, 0, 10, 30, 80, 200], 
                                    labels=[1, 2, 3, 4, 5]).astype(int)
        
        # Expiry features
        df['expiry_date'] = pd.to_datetime(df['expiry_date'])
        current_date = pd.Timestamp.now().tz_localize(None)
        df['expiry_date'] = df['expiry_date'].dt.tz_localize(None)
        
        X['days_until_expiry'] = (df['expiry_date'] - current_date).dt.days
        X['expiry_urgency'] = 1 / (X['days_until_expiry'].clip(lower=1) + 1)
        X['has_long_expiry'] = (X['days_until_expiry'] > 365).astype(int)
        
        # Combined availability score (stock + expiry)
        X['availability_score'] = (X['stock_ratio'] * 0.6 + 
                                  (1 - X['expiry_urgency']) * 0.4)
        
        # City encoding
        cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad']
        for city in cities:
            X[f'city_{city}'] = (df['city'] == city).astype(int)
        
        # Priority-weighted combined features
        X['priority_weighted_score'] = (
            X['distance_score'] * self.distance_weight +
            X['price_score'] * self.price_weight +
            X['availability_score'] * self.availability_weight
        )
        
        return X
    
    def calculate_priority_based_score(self, pharmacy_data):
        """
        Calculate score using explicit priority-based formula
        This ensures distance > price > availability priority
        """
        distance = pharmacy_data['distance_km']
        price = pharmacy_data['price']
        stock = pharmacy_data['stock']
        
        # Normalize features with priority scaling
        # Distance: highest priority (exponential decay)
        distance_score = np.exp(-distance / 2)  # Sharp decay for distance
        
        # Price: medium priority  
        price_score = np.exp(-price / 50)  # Moderate decay for price
        
        # Availability: lowest priority (linear)
        stock_score = min(1, stock / 100)
        
        # Calculate expiry score
        expiry_date = pd.to_datetime(pharmacy_data['expiry_date'])
        current_date = pd.Timestamp.now().tz_localize(None)
        expiry_date = expiry_date.tz_localize(None)
        days_until_expiry = (expiry_date - current_date).days
        expiry_score = min(1, days_until_expiry / 180)
        
        availability_score = (stock_score + expiry_score) / 2
        
        # Apply priority weights
        final_score = (
            distance_score * self.distance_weight +
            price_score * self.price_weight +
            availability_score * self.availability_weight
        )
        
        return final_score
    
    def create_priority_weighted_target(self, df):
        """
        Create target scores using explicit priority-based formula
        """
        target_scores = []
        
        for _, row in df.iterrows():
            score = self.calculate_priority_based_score(row)
            target_scores.append(score)
        
        return np.array(target_scores)
    
    def train_models(self, df, test_size=0.2):
        """
        Train multiple models and select the best one with priority-based targets
        """
        # Prepare features
        X = self.prepare_features(df)
        
        # Create priority-weighted target scores
        y = self.create_priority_weighted_target(df)
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print("=== Model Training with Priority Weights ===")
        print(f"Distance Weight: {self.distance_weight}")
        print(f"Price Weight: {self.price_weight}") 
        print(f"Availability Weight: {self.availability_weight}")
        print(f"Training samples: {X_train.shape[0]}")
        print(f"Test samples: {X_test.shape[0]}")
        print(f"Features: {X.shape[1]}")
        print("\n" + "="*60)
        
        best_score = float('inf')
        results = {}
        
        for name, model in self.models.items():
            print(f"\nTraining {name}...")
            
            # Train model
            if name == 'svr':
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
            else:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
            
            # Calculate metrics
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            results[name] = {
                'model': model,
                'mae': mae,
                'mse': mse,
                'r2': r2,
                'predictions': y_pred
            }
            
            print(f"  MAE: {mae:.4f}")
            print(f"  MSE: {mse:.4f}")
            print(f"  R²: {r2:.4f}")
            
            # Update best model (based on MAE)
            if mae < best_score:
                best_score = mae
                self.best_model = model
                self.best_model_name = name
        
        self.results = results
        self.X_columns = X.columns.tolist()
        
        print(f"\n🎯 Best Model: {self.best_model_name} (MAE: {best_score:.4f})")
        return results
    
    def evaluate_models(self):
        """
        Compare model performance
        """
        print("\n=== Model Comparison ===")
        comparison_df = pd.DataFrame({
            model: {
                'MAE': results['mae'],
                'MSE': results['mse'], 
                'R²': results['r2']
            }
            for model, results in self.results.items()
        }).T
        
        print(comparison_df.round(4))
        return comparison_df
    
    def save_model(self, filename='pharmacy_recommendation_model.pkl'):
        """
        Save the best model and metadata
        """
        if self.best_model is None:
            raise ValueError("No model trained yet. Call train_models() first.")
        
        model_data = {
            'model': self.best_model,
            'model_name': self.best_model_name,
            'scaler': self.scaler,
            'feature_columns': self.X_columns,
            'training_results': self.results,
            'weights': {
                'distance': self.distance_weight,
                'price': self.price_weight,
                'availability': self.availability_weight
            }
        }
        
        joblib.dump(model_data, filename)
        print(f"\n💾 Model saved as: {filename}")
        
    def predict_score(self, pharmacy_data):
        """
        Predict score for new pharmacy data
        """
        if self.best_model is None:
            raise ValueError("No model loaded. Train or load a model first.")
        
        # Convert to DataFrame and prepare features
        X_new = self.prepare_features(pd.DataFrame([pharmacy_data]))
        
        # Ensure same column order as training
        X_new = X_new[self.X_columns]
        
        if self.best_model_name == 'svr':
            X_new_scaled = self.scaler.transform(X_new)
            prediction = self.best_model.predict(X_new_scaled)[0]
        else:
            prediction = self.best_model.predict(X_new)[0]
        
        return max(0, min(1, prediction))  # Ensure score between 0-1
    
    def explain_prediction(self, pharmacy_data):
        """
        Explain how the prediction was calculated based on priorities
        """
        distance = pharmacy_data['distance_km']
        price = pharmacy_data['price']
        stock = pharmacy_data['stock']
        
        # Calculate individual component scores
        distance_score = np.exp(-distance / 2)
        price_score = np.exp(-price / 50)
        stock_score = min(1, stock / 100)
        
        # Expiry calculation
        expiry_date = pd.to_datetime(pharmacy_data['expiry_date'])
        current_date = pd.Timestamp.now().tz_localize(None)
        expiry_date = expiry_date.tz_localize(None)
        days_until_expiry = (expiry_date - current_date).days
        expiry_score = min(1, days_until_expiry / 180)
        availability_score = (stock_score + expiry_score) / 2
        
        # Weighted contributions
        distance_contribution = distance_score * self.distance_weight
        price_contribution = price_score * self.price_weight
        availability_contribution = availability_score * self.availability_weight
        
        total_score = distance_contribution + price_contribution + availability_contribution
        
        print("\n🔍 PREDICTION EXPLANATION:")
        print("=" * 50)
        print(f"📍 Distance: {distance} km")
        print(f"   Score: {distance_score:.4f} × Weight: {self.distance_weight} = {distance_contribution:.4f}")
        print(f"💰 Price: ₹{price}")
        print(f"   Score: {price_score:.4f} × Weight: {self.price_weight} = {price_contribution:.4f}")
        print(f"📦 Availability (Stock: {stock}, Expiry: {days_until_expiry} days)")
        print(f"   Score: {availability_score:.4f} × Weight: {self.availability_weight} = {availability_contribution:.4f}")
        print("=" * 50)
        print(f"🎯 FINAL SCORE: {total_score:.4f}")
        
        return {
            'distance_contribution': distance_contribution,
            'price_contribution': price_contribution,
            'availability_contribution': availability_contribution,
            'total_score': total_score
        }

def load_and_prepare_data(filename='pharmacy_recommendation_dataset.csv'):
    """
    Load and prepare the dataset
    """
    print("Loading dataset...")
    df = pd.read_csv(filename)
    
    # Basic data validation
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    
    # Check for missing values
    missing = df.isnull().sum()
    if missing.any():
        print(f"Missing values:\n{missing[missing > 0]}")
        df = df.dropna()
    
    return df

def generate_priority_dataset():
    """
    Generate dataset with priority-based scoring
    """
    import random
    from datetime import datetime, timedelta
    
    sample_data = []
    for i in range(1000):
        days_to_expiry = random.randint(30, 1095)
        expiry_date = (datetime.now() + timedelta(days=days_to_expiry)).strftime("%Y-%m-%d")
        
        pharmacy_data = {
            "pharmacy_id": f"P{i:03d}",
            "name": f"Pharmacy_{i}",
            "distance_km": round(random.uniform(0.5, 15.0), 2),
            "price": random.randint(15, 120),
            "stock": random.randint(0, 200),
            "expiry_date": expiry_date,
            "city": random.choice(['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad']),
            "state": "State"
        }
        
        sample_data.append(pharmacy_data)
    
    df = pd.DataFrame(sample_data)
    return df

# Main execution
if __name__ == "__main__":
    # Try to load existing data, if not generate new
    try:
        df = load_and_prepare_data('pharmacy_recommendation_dataset.csv')
        print("✅ Dataset loaded successfully")
    except FileNotFoundError:
        print("❌ Dataset not found. Generating new dataset...")
        df = generate_priority_dataset()
    
    # Initialize model with priority weights: Distance > Price > Availability
    recommender = PharmacyRecommendationModel(
        distance_weight=0.5,    # Highest priority
        price_weight=0.3,       # Second priority  
        availability_weight=0.2 # Third priority
    )
    
    # Train models
    results = recommender.train_models(df)
    
    # Evaluate and compare models
    comparison = recommender.evaluate_models()
    
    # Save the best model
    recommender.save_model('pharmacy_recommendation_model.pkl')
    
    # Test with priority-based examples
    print("\n" + "="*60)
    print("🧪 TESTING PRIORITY-BASED SCORING")
    print("="*60)
    
    test_cases = [
        {
            'name': 'EXCELLENT: Very close, affordable, good stock',
            'data': {
                'distance_km': 0.8,
                'price': 25,
                'stock': 90,
                'expiry_date': '2025-12-31',
                'city': 'Bangalore'
            }
        },
        {
            'name': 'GOOD: Close but expensive',
            'data': {
                'distance_km': 1.2, 
                'price': 80,
                'stock': 80,
                'expiry_date': '2025-12-31',
                'city': 'Mumbai'
            }
        },
        {
            'name': 'POOR: Far but cheap',
            'data': {
                'distance_km': 8.0,
                'price': 20,
                'stock': 100,
                'expiry_date': '2026-12-31',
                'city': 'Delhi'
            }
        }
    ]
    
    for test in test_cases:
        print(f"\n📊 {test['name']}")
        score = recommender.predict_score(test['data'])
        print(f"   Input - Distance: {test['data']['distance_km']}km, Price: ₹{test['data']['price']}, Stock: {test['data']['stock']}")
        print(f"   🎯 Predicted Score: {score:.4f}")
        
        # Show explanation
        explanation = recommender.explain_prediction(test['data'])
    
    # Show feature importance if using tree-based model
    if hasattr(recommender.best_model, 'feature_importances_'):
        print("\n=== Feature Importance ===")
        feature_importance = pd.DataFrame({
            'feature': recommender.X_columns,
            'importance': recommender.best_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(feature_importance.head(10))
import os
import logging
import sys
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging to show in console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global variable to store the model
model = None

def load_model(model_path="pharmacy_ranking_model.pkl"):
    """
    Load the trained model from pickle file
    """
    global model
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        logger.info("✅ Model loaded successfully")
        logger.info(f"Model weights: {model['weights']}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        return False

def normalize_value(value, min_val, max_val, reverse=False):
    """
    Normalize a single value to 0-1 scale
    """
    if min_val == max_val:
        return 1.0
    if reverse:
        return (max_val - value) / (max_val - min_val)
    else:
        return (value - min_val) / (max_val - min_val)

def calculate_ai_score(pharmacy, model):
    """
    Calculate AI score for a single pharmacy using the trained model
    """
    try:
        # Get feature ranges from model
        dist_range = model['feature_ranges']['distance']
        price_range = model['feature_ranges']['price']
        stock_range = model['feature_ranges']['stock']
        
        # Get weights from model
        weights = model['weights']
        
        # Normalize features
        norm_distance = normalize_value(
            pharmacy['distance_km'], 
            dist_range['min'],
            dist_range['max'],
            reverse=True  # Lower distance = better
        )
        
        norm_price = normalize_value(
            pharmacy['price'],
            price_range['min'],
            price_range['max'],
            reverse=True  # Lower price = better
        )
        
        norm_stock = normalize_value(
            pharmacy['stock'],
            stock_range['min'],
            stock_range['max'],
            reverse=False  # Higher stock = better
        )
        
        # Calculate weighted score
        score = (norm_distance * weights['distance'] + 
                norm_price * weights['price'] + 
                norm_stock * weights['stock'])
        
        # Ensure score is between 0 and 1
        score = max(0.0, min(1.0, score))
        
        return score
        
    except Exception as e:
        logger.error(f"Error calculating score for {pharmacy.get('pharmacy_id', 'Unknown')}: {e}")
        return 0.0

@app.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check endpoint called")
    status = "healthy" if model is not None else "model not loaded"
    return jsonify({
        "status": status,
        "message": "ML API is running",
        "model_loaded": model is not None
    })

@app.route('/predict', methods=['POST'])
def predict_scores():
    """
    Predict AI scores for pharmacies using the trained model
    Expected JSON input (array of pharmacies):
    [
      {
        "pharmacy_id": "P001",
        "name": "Apollo Pharmacy", 
        "distance_km": 1.23,
        "price": 30,
        "stock": 70,
        "expiry_date": "2026-02-20T00:00:00.000Z",
        "city": "Bangalore",
        "state": "Karnataka"
      }
    ]
    
    Returns:
    [
      {
        "pharmacy_id": "P001",
        "ai_score": 0.832
      }
    ]
    """
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                "error": "Model not loaded. Please check if pharmacy_ranking_model.pkl exists",
                "status": "error"
            }), 500
        
        # Get JSON data from request
        pharmacies = request.get_json()
        
        # Log the incoming request
        logger.info(f"Received prediction request for {len(pharmacies) if isinstance(pharmacies, list) else 'unknown'} pharmacies")
        
        # Validate input is a list
        if not isinstance(pharmacies, list):
            return jsonify({
                "error": "Input must be an array of pharmacies",
                "status": "error"
            }), 400
        
        results = []
        for pharmacy in pharmacies:
            try:
                # Validate required fields
                required_fields = ['pharmacy_id', 'distance_km', 'price', 'stock']
                for field in required_fields:
                    if field not in pharmacy:
                        logger.warning(f"Missing field {field} in pharmacy {pharmacy.get('pharmacy_id', 'Unknown')}")
                        continue
                
                # Validate data types
                try:
                    distance_km = float(pharmacy['distance_km'])
                    price = float(pharmacy['price'])
                    stock = int(pharmacy['stock'])
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid data types for pharmacy {pharmacy['pharmacy_id']}: {e}")
                    continue
                
                # Calculate AI score using the trained model
                ai_score = calculate_ai_score(pharmacy, model)
                
                # Prepare response
                results.append({
                    "pharmacy_id": pharmacy['pharmacy_id'],
                    "ai_score": round(ai_score, 4)  # Round to 4 decimal places
                })
                
                logger.info(f"Calculated score {ai_score:.4f} for pharmacy {pharmacy['pharmacy_id']}")
                
            except Exception as e:
                logger.error(f"Error processing pharmacy {pharmacy.get('pharmacy_id', 'Unknown')}: {str(e)}")
                continue
        
        logger.info(f"Successfully processed {len(results)} pharmacies")
        
        return jsonify(results)
    
    except Exception as e:
        logger.error(f"Error processing prediction request: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e),
            "status": "error"
        }), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """
    Get information about the loaded model
    """
    if model is None:
        return jsonify({
            "error": "Model not loaded",
            "status": "error"
        }), 500
    
    return jsonify({
        "weights": model['weights'],
        "feature_ranges": model['feature_ranges'],
        "status": "loaded"
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "status": "error"
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "error": "Method not allowed",
        "status": "error"
    }), 405

if __name__ == '__main__':
    try:
        # Load the model when starting the server
        model_loaded = load_model()
        
        if not model_loaded:
            logger.error("❌ Failed to load model. Please make sure pharmacy_ranking_model.pkl exists")
            sys.exit(1)
        
        port = int(os.environ.get("PORT", 5001))
        logger.info(f"🚀 Starting ML API on http://0.0.0.0:{port}")
        logger.info(f"📊 Model weights: {model['weights']}")
        app.run(host="0.0.0.0", port=port, debug=False)
        
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)
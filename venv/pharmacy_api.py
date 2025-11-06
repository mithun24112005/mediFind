# pharmacy_api.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import sys

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
# Allow all origins for testing
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check endpoint called")
    return jsonify({
        "status": "healthy",
        "message": "ML API is running"
    })

@app.route('/predict', methods=['POST'])
def predict_scores():
    """
    Predict AI scores for pharmacies
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
      },
      {
        "pharmacy_id": "P002",
        "name": "Medico Plus",
        "distance_km": 2.5,
        "price": 25,
        "stock": 50,
        "expiry_date": "2025-12-15T00:00:00.000Z",
        "city": "Bangalore",
        "state": "Karnataka"
      }
    ]
    
    Returns:
    [
      {
        "pharmacy_id": "P001",
        "ai_score": 0.832
      },
      {
        "pharmacy_id": "P002", 
        "ai_score": 0.765
      }
    ]
    """
    try:
        # Get JSON data from request - expecting array of pharmacies
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
                required_fields = ['pharmacy_id', 'distance_km', 'price', 'stock', 'expiry_date']
                for field in required_fields:
                    if field not in pharmacy:
                        logger.warning(f"Missing field {field} in pharmacy {pharmacy.get('pharmacy_id', 'Unknown')}")
                        continue
                
                # Validate data types
                try:
                    distance_km = float(pharmacy['distance_km'])
                    price = float(pharmacy['price'])
                    stock = int(pharmacy['stock'])
                except (ValueError, TypeError):
                    logger.warning(f"Invalid data types for pharmacy {pharmacy['pharmacy_id']}")
                    continue
                
                # Calculate AI score
                # Mock AI score calculation
                distance = float(pharmacy.get('distance_km', 0))
                price = float(pharmacy.get('price', 0))
                stock = float(pharmacy.get('stock', 0))
                
                # Simple scoring formula
                score = (1 / (1 + distance)) * 0.4 + \
                       (1 - (price/200)) * 0.3 + \
                       (stock/100) * 0.3
                
                # Prepare response with only pharmacy_id and ai_score
                results.append({
                    "pharmacy_id": pharmacy['pharmacy_id'],
                    "ai_score": round(score, 3)
                })
                
                logger.info(f"Calculated score {score} for pharmacy {pharmacy['pharmacy_id']}")
                
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
        logger.info("🚀 Starting ML API on http://127.0.0.1:5001")
        # Change host to '0.0.0.0' to allow external connections
        app.run(host="0.0.0.0", port=5001, debug=True)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)
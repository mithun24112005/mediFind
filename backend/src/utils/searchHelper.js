import Pharmacy from "../models/pharma.model.js";
import Medicine from "../models/medicine.model.js";

export const findPharmaciesNearby = async (medicine_name, latitude, longitude) => {
  // 1️⃣ Find all pharmacies that have this medicine in stock
  const medicines = await Medicine.find({
    medicine_name: { $regex: medicine_name, $options: "i" },
    stock: { $gt: 0 },
    expiry_date: { $gte: new Date() }
  });

  // If no stores have it
  if (!medicines.length) return [];

  // 2️⃣ Get all unique pharmacy IDs from the medicines
  const pharmacyIds = medicines.map(m => m.pharmacy_id);

  // 3️⃣ Fetch those pharmacies and calculate distance from user
  const pharmacies = await Pharmacy.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "distance_km",
        spherical: true,
        query: { pharmacy_id: { $in: pharmacyIds } }
      }
    },
    {
      $project: {
        _id: 0,
        pharmacy_id: 1,
        name: 1,
        distance_km: 1,
        "address.city": 1,
        "address.state": 1
      }
    }
  ]);

  // 4️⃣ Combine pharmacy info with medicine info
  const results = pharmacies.map(pharmacy => {
    const med = medicines.find(m => m.pharmacy_id === pharmacy.pharmacy_id);
    return {
      ...pharmacy,
      price: med?.price || null,
      stock: med?.stock || null,
      expiry_date: med?.expiry_date || null
    };
  });

  return results;
};


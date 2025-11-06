import { getMLScores } from "../../utils/mlHelper.js";

describe("ML API Integration Tests", () => {
  const testData = [
    {
      pharmacy_id: "P001",
      name: "Apollo Pharmacy",
      distance_km: "1.23",
      price: 167.37,
      stock: 488,
      expiry_date: "2028-08-10T00:00:00.000Z",
      city: "Bangalore",
      state: "Karnataka",
    },
  ];

  test("should connect to ML API and get scores", async () => {
    const scores = await getMLScores(testData);
    expect(Array.isArray(scores)).toBeTruthy();
    expect(scores.length).toBeGreaterThan(0);
    expect(scores[0]).toHaveProperty("pharmacy_id");
    expect(scores[0]).toHaveProperty("ai_score");
  });
});

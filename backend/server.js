require('dotenv').config({ path: __dirname + '/.env' });

const app = require('./src/app');
const connectDB = require('./src/db/db');

const PORT = process.env.PORT || 3000;

// connect DB first, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ Failed to connect to DB:", err.message);
});
import app from './src/app.js';
import dotenv from 'dotenv';
import connectDB from './src/db/db.js';

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    if (connectDB) {
        console.log('Connected to MongoDB successfully');
    }
    console.log(`Server is running on port ${PORT}`);
});
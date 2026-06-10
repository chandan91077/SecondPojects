const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI;

let clientPromise = null;

async function getDb() {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }
  
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds connection timeout
    });
    clientPromise = client.connect().catch(err => {
      // Clear clientPromise so we can try to connect again on the next request
      clientPromise = null;
      throw err;
    });
  }
  
  const conn = await clientPromise;
  return conn.db('DevDATA');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Function to seed default admin if it doesn't exist (fails gracefully when offline)
async function seedAdmin() {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    const adminUser = await usersCollection.findOne({ username: 'brahamdev' });
    if (!adminUser) {
      console.log('Seeding default admin user...');
      const hashedPassword = hashPassword('brahamdev@7410');
      await usersCollection.insertOne({
        username: 'brahamdev',
        password: hashedPassword,
        createdAt: new Date()
      });
      console.log('Admin user seeded successfully.');
    }
  } catch (error) {
    console.warn('Warning: Could not seed admin user in MongoDB (DB offline/unreachable):', error.message);
  }
}

module.exports = {
  getDb,
  hashPassword,
  seedAdmin
};

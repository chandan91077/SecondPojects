const { ObjectId } = require('mongodb');
const { getDb } = require('../_db');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Invoice ID is required.' });
  }

  try {
    const db = await getDb();
    const billsCollection = db.collection('bills');

    let queryId;
    try {
      queryId = new ObjectId(id);
    } catch (err) {
      // If id is not a valid ObjectId (could be a local timestamp id from fallback)
      const fallbackBill = await billsCollection.findOne({ _id: id });
      if (fallbackBill) {
        return res.status(200).json({ success: true, bill: fallbackBill });
      }
      return res.status(400).json({ success: false, message: 'Invalid Invoice ID format.' });
    }

    const bill = await billsCollection.findOne({ _id: queryId });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    return res.status(200).json({ success: true, bill });

  } catch (error) {
    console.error('Public bill fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving invoice.' });
  }
};

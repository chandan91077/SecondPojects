const { ObjectId } = require('mongodb');
const { getDb } = require('../_db');
const { verifyToken } = require('../_token');

module.exports = async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract and verify Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token. Please log in again.' });
  }

  try {
    const db = await getDb();
    const bookingsCollection = db.collection('bookings');

    switch (req.method) {
      case 'GET': {
        const bookings = await bookingsCollection.find({}).sort({ createdAt: -1 }).toArray();
        return res.status(200).json({ success: true, bookings });
      }

      case 'POST': {
        const { name, phone, serviceType, message, status } = req.body;
        
        if (!name || !phone || !serviceType) {
          return res.status(400).json({ success: false, message: 'Name, phone, and service type are required.' });
        }

        const newBooking = {
          name,
          phone,
          serviceType,
          message: message || '',
          status: status || 'Pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await bookingsCollection.insertOne(newBooking);
        return res.status(201).json({ 
          success: true, 
          message: 'Booking created successfully.',
          booking: { ...newBooking, _id: result.insertedId }
        });
      }

      case 'PATCH': {
        const { id, status, name, phone, serviceType, message } = req.body;
        
        if (!id) {
          return res.status(400).json({ success: false, message: 'Booking ID is required.' });
        }

        const updateFields = {};
        if (status !== undefined) updateFields.status = status;
        if (name !== undefined) updateFields.name = name;
        if (phone !== undefined) updateFields.phone = phone;
        if (serviceType !== undefined) updateFields.serviceType = serviceType;
        if (message !== undefined) updateFields.message = message;
        
        updateFields.updatedAt = new Date();

        const result = await bookingsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updateFields },
          { returnDocument: 'after' }
        );

        if (!result) {
          return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Booking updated successfully.',
          booking: result.value || result
        });
      }

      case 'DELETE': {
        const { id } = req.body || req.query;
        
        if (!id) {
          return res.status(400).json({ success: false, message: 'Booking ID is required.' });
        }

        const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        return res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
      }

      default: {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
      }
    }

  } catch (error) {
    console.error('Bookings API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Database connection failed. Please ensure MongoDB access is enabled.' 
    });
  }
};

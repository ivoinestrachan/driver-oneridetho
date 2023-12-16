import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type Data = {
  lat?: number;
  lng?: number;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    const { address } = req.body;
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.API_KEY}`);
      const { lat, lng } = response.data.results[0].geometry.location;
      res.status(200).json({ lat, lng });
    } catch (error) {
      res.status(500).json({ error: 'Error in geocoding' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

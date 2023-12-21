import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  const { lat, lng } = req.query;

  if (typeof lat !== 'string' || typeof lng !== 'string') {
    res.status(400).json({ message: 'Invalid query parameters' });
    return;
  }

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.API_KEY}`);
    const data = await response.json();
    const address = data.results[0].formatted_address;
    res.status(200).json({ address });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving address" });
  }
}

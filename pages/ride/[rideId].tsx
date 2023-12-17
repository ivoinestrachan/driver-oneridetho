import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "90vh",
};

const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  zoomControl: false,
};

interface User {
  id: number;
  name: string;
  rating: number;
  phone: number;
}

interface Ride {
  id: number;
  pickupLocation: string; 
  dropoffLocation: any;   
  fare: number;
  user: User;
}

const RidePage = () => {
  const router = useRouter();
  const { rideId } = router.query;
  const [rideDetails, setRideDetails] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [directions, setDirections] = useState(null);
  const [driverLocation, setDriverLocation] = useState({ lat: 0, lng: 0 });
  const [pickupLocation, setPickupLocation] = useState(null);

  const mapRef = useRef();

  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map;
  }, []);

  const fetchCoordinates = async (address: any) => {
    try {
      const response = await axios.post('/api/geocode', { address });
      return response.data;
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchRideDetails = async () => {
      if (typeof rideId === 'string') {
        setIsLoading(true);
        try {
          const response = await axios.get(`/api/rides/${rideId}`);
          const fetchedRideDetails = response.data;
          setRideDetails(fetchedRideDetails);

          const coordinates = await fetchCoordinates(fetchedRideDetails.pickupLocation);
          if (coordinates) {
            setPickupLocation(coordinates);
          }
        } catch (error) {
          console.error("Error fetching ride details:", error);
          setError("Failed to load ride details.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchRideDetails();
  }, [rideId]);

  useEffect(() => {
    const updateDirections = () => {
      if (!mapRef.current || !pickupLocation) return;

      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: driverLocation,
          destination: pickupLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            //@ts-ignore
            setDirections(result);
          } else {
            console.error(`Error fetching directions: ${status}`);
          }
        }
      );
    };

    const intervalId = setInterval(updateDirections, 10000);
    return () => clearInterval(intervalId);
  }, [driverLocation, pickupLocation]);

  const openInMaps = () => {
    if (pickupLocation) {
      //@ts-ignore
      const destination = `${pickupLocation.lat},${pickupLocation.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(url, "_blank");
    }
  };

  const [manualDriverLat, setManualDriverLat] = useState('');
  const [manualDriverLng, setManualDriverLng] = useState('');
  

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setManualDriverLat(position.coords.latitude.toString());
        setManualDriverLng(position.coords.longitude.toString());
        setDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, (error) => {
        console.error("Error getting current location:", error);
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {rideDetails && (
        <>
                <div>
            <input
              type="text"
              placeholder="Enter Driver's Latitude"
              value={manualDriverLat}
              onChange={(e) => setManualDriverLat(e.target.value)}
              className="hidden"
          
            />
            <input
              type="text"
              placeholder="Enter Driver's Longitude"
              value={manualDriverLng}
              onChange={(e) => setManualDriverLng(e.target.value)}
              className="hidden"
           
            />
              <button onClick={() => getCurrentLocation()} className="py-2">
                Get Current Location
              </button>
          </div>

        

          <LoadScript googleMapsApiKey={process.env.API_KEY || ""}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={pickupLocation || { lat: 0, lng: 0 }}
              zoom={12}
              onLoad={onMapLoad}
              options={mapOptions}
            >
              <Marker position={driverLocation} label="Driver" />
              {pickupLocation && <Marker position={pickupLocation} label="Pickup" />}
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </LoadScript>
          <div className="absolute sm:bg-transparent bg-white h-[15vh] z-10 w-[95%] bottom-5 px-5 space-y-2 pt-4 ml-2 rounded-[8px]">
            {rideDetails.user ? (
              <div>
                <div>{rideDetails.user.name}</div>
              </div>
            ) : (
              <p>Loading user details...</p>
            )}
            <div className="flex items-center justify-between">
              <div>
                <button className="py-2 pl-4 pr-4 bg-black text-white rounded-md">
                  Picked Up
                </button>
              </div>
              <div>
                <button
                  className="py-2 pl-4 pr-4 bg-black text-white rounded-md"
                  onClick={openInMaps}
                >
                  Open in Maps
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RidePage;

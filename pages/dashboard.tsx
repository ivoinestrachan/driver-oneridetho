import {
  GoogleMap,
  InfoWindow,
  LoadScript,
  Marker,
} from "@react-google-maps/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { HiMiniStar } from "react-icons/hi2";

interface User {
  id: number;
  name: string;
  // photoUrl: string;
  rating: number;
  phone: number;
}

interface Ride {
  id: number;
  pickupLocation: any;
  dropoffLocation: any;
  fare: number;
  user: User;
}

const containerStyle = {
  width: "100%",
  height: "90vh",
};

const defaultCenter = {
  lat: 25.06,
  lng: -77.345,
};

const Dashboard = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");

  const { data: session } = useSession();
  const router = useRouter();
  const { rideId } = router.query;

  const onMarkerClick = (ride: Ride) => {
    setSelectedRide(ride);
  };

  const fetchRideById = async (rideId: any) => {
    try {
      const response = await fetch(`/api/rides/${rideId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      return null;
    }
  };

  useEffect(() => {
    if (rideId) {
      (async () => {
        setIsLoading(true);
        const ride = await fetchRideById(rideId);
        if (ride) {
          setSelectedRide(ride);
        }
        setIsLoading(false);
      })();
    }
  }, [rideId]);

  const acceptRide = async (rideId: number) => {
    setIsLoading(true);
    try {
      const driverId = session?.user.id;

      const response = await fetch(`/api/rides/accept/${rideId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driverId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const updatedRides = rides.filter((ride) => ride.id !== rideId);
      setRides(updatedRides);
      router.push(`/ride/${rideId}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchRideDetails = async () => {
      if (!rideId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/rides/${rideId}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const rideData = await response.json();

        if (rideData.isAccepted) {
          alert("This ride has already been accepted by another driver.");
          setSelectedRide(null);
          router.push("/dashboard");
        } else {
          setSelectedRide(rideData);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId]);

  useEffect(() => {
    const fetchUnacceptedRides = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/rides/unaccepted");
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data: Ride[] = await response.json();
        setRides(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnacceptedRides();
  }, []);

  const getCoordinates = async (address: any) => {
    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });
    const data = await response.json();
    return data;
  };

  const isTextualAddress = (location: any) => {
    return isNaN(parseFloat(location));
  };

  useEffect(() => {
    const fetchAddress = async (lat: number, lng: number) => {
      try {
        const response = await fetch(`/api/reversegeo?lat=${lat}&lng=${lng}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch address: ${response.status}`);
        }
        const data = await response.json();
        return data.address;
      } catch (error) {
        console.error("Error fetching address:", error);
        return "Address not found";
      }
    };

    if (selectedRide && selectedRide.pickupLocation) {
      const { lat, lng } = selectedRide.pickupLocation;
      fetchAddress(lat, lng)
        .then((address) => {
          setPickupAddress(shortenAddress(address));
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }

    if (selectedRide && selectedRide.dropoffLocation) {
      setDropoffAddress(shortenAddress(selectedRide.dropoffLocation));
    }
  }, [selectedRide]);

  function removePlusCode(fullAddress: string): string {
    return fullAddress.trim();
  }

  function shortenAddress(fullAddress: string): string {
    const cleanedAddress = removePlusCode(fullAddress);
    const parts = cleanedAddress.split(",");
    if (parts.length > 3) {
      return `${parts[0].trim()}, ${parts[1].trim()}`;
    }
    return cleanedAddress;
  }

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await fetch("/api/rides/unaccepted");
        if (!response.ok) {
          throw new Error("Failed to fetch rides");
        }
        let ridesData = await response.json();

        for (let ride of ridesData) {
          if (isTextualAddress(ride.pickupLocation)) {
            const coordinates = await getCoordinates(ride.pickupLocation);
            ride.pickupLocation = coordinates;
          } else {
            const [lat, lng] = ride.pickupLocation.split(",").map(Number);
            ride.pickupLocation = { lat, lng };
          }
        }

        setRides(ridesData);
      } catch (error) {
        console.error("Error fetching rides:", error);
      }
    };

    fetchRides();
  }, []);

  const mapOptions = {
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    zoomControl: false,
  };

  return (
    <LoadScript googleMapsApiKey={process.env.API_KEY || ""}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={13}
        options={mapOptions}
      >
        {rides.map((ride) => (
          <Marker
            key={ride.id}
            position={ride.pickupLocation}
            onClick={() => onMarkerClick(ride)}
          />
        ))}
        {selectedRide && (
          <div className="absolute bottom-0 bg-white w-full h-[50vh] pt-4 rounded-t-[16px] overflow-y-scroll">
            <div className="text-center">
              <button
                onClick={() => acceptRide(selectedRide.id)}
                className="rounded-full bg-black text-white py-3 pl-10 pr-10 text-center flashing-border"
              >
                {selectedRide.user.name}
              </button>

              <div className="font-bold text-[24px]">${selectedRide.fare}</div>
            </div>

            <div className="px-2 mt-2">
              <li>{pickupAddress}</li>
              <div className="border-l-2 h-5 border-black"></div>
              <li>{dropoffAddress}</li>
            </div>
          </div>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default Dashboard;

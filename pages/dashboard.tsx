import { Spinner } from "@/components/Spinner";
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
  paymentMethod: string;
  //@ts-ignore
  stops: Stop[];
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
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [scheduledPickupTime, setScheduledPickupTime] = useState("");

  const { data: session, status } = useSession();
  const router = useRouter();
  const { rideId } = router.query;

  const onMarkerClick = (ride: Ride) => {
    setSelectedRide(ride);
  };

  useEffect(() => {
    if (status !== "loading" && !session) {
      alert("You must be logged in to view this page");
      router.push("/");
    }
  }, [session, status, router]);
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

  const [loadingRideId, setLoadingRideId] = useState<number | null>(null);

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
    setLoadingRideId(rideId);
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
      setLoadingRideId(null);
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

  const handleScheduleRide = async (rideId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rides/schedule/${rideId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scheduledPickupTime }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      setShowSchedulePopup(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  async function reverseGeocode(lat: number, lng: number) {
    const apiKey = process.env.API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.error_message && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.error("Geocoding error:", data.error_message);
        return "Address not found";
      }
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return "Address not found";
    }
  }

  function isCoordinateFormat(location: string) {
    return (
      location &&
      typeof location === "object" &&
      "lat" in location &&
      "lng" in location
    );
  }

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
    const fetchAndSetAddress = async () => {
      if (selectedRide && selectedRide.pickupLocation) {
        let address;

        if (isCoordinateFormat(selectedRide.pickupLocation)) {
          address = await reverseGeocode(
            selectedRide.pickupLocation.lat,
            selectedRide.pickupLocation.lng
          );
        } else {
          address = selectedRide.pickupLocation;
        }

        setPickupAddress(address);
      }
    };

    fetchAndSetAddress();
  }, [selectedRide]);

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

    if (selectedRide && selectedRide.dropoffLocation) {
      const dropoffAddressString =
        typeof selectedRide.dropoffLocation === "string"
          ? selectedRide.dropoffLocation
          : JSON.stringify(selectedRide.dropoffLocation);
      setDropoffAddress(shortenAddress(dropoffAddressString));
    }
  }, [selectedRide]);

  function removePlusCode(fullAddress: string): string {
    if (typeof fullAddress === "string") {
      return fullAddress.trim();
    }
    return "";
  }

  function shortenAddress(fullAddress: string): string {
    if (typeof fullAddress === "string") {
      const cleanedAddress = removePlusCode(fullAddress);
      const parts = cleanedAddress.split(",");
      if (parts.length > 3) {
        return `${parts[0].trim()}, ${parts[1].trim()}`;
      }
      return cleanedAddress;
    }
    return "";
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

  const renderSchedulePopup = () => {
    if (!selectedRide) return null;

    return (
      <div className="schedule-popup">
        <h2>Schedule Ride</h2>
        <input
          type="datetime-local"
          value={scheduledPickupTime}
          onChange={(e) => setScheduledPickupTime(e.target.value)}
        />
        <button onClick={() => handleScheduleRide(selectedRide.id)}>
          Schedule
        </button>
        <button onClick={() => setShowSchedulePopup(false)}>Cancel</button>
      </div>
    );
  };

  return session ? (
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
          <div className="absolute bottom-0 bg-white w-full h-[30vh] pt-4 pb-2 rounded-t-[16px] overflow-y-scroll">
            {(() => {
              let stops;
              if (typeof selectedRide.stops === "string") {
                try {
                  stops = JSON.parse(selectedRide.stops);
                } catch (e) {
                  console.error("Error parsing stops data:", e);
                  stops = [];
                }
              } else {
                stops = selectedRide.stops;
              }

              return (
                <>
                  {Array.isArray(stops) && stops.length > 0 && (
                    <div className="text-center">
                      Ride has {stops.length} stop{stops.length > 1 ? "s" : ""}
                    </div>
                  )}
                </>
              );
            })()}

{showSchedulePopup && renderSchedulePopup()}
            <div className="text-center">
              <button
                onClick={() => acceptRide(selectedRide.id)}
                className="rounded-full bg-black text-white py-3 pl-10 pr-10 text-center flashing-border"
              >
                {loadingRideId === selectedRide.id ? (
                  <Spinner />
                ) : (
                  selectedRide.user.name
                )}
              </button>

              <div className="flex items-center justify-center gap-2">
                <div className="font-bold text-[24px]">
                  ${selectedRide.fare}
                </div>
                {selectedRide.paymentMethod === "Card" && (
                  <span className="text-[20px] rounded-full border-2 border-black  pl-3 pr-3">
                    💳 Paid
                  </span>
                )}
              </div>
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
  ) : (
    <div>Loading...</div>
  );
};

export default Dashboard;

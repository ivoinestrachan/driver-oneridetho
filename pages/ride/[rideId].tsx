import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import useSWR from "swr";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import Image from "next/image";
import { useSession } from "next-auth/react";

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
  photoUrl: string;
  phone: number;
}

interface Ride {
  id: number;
  pickupLocation: string;
  dropoffLocation: any;
  fare: number;
  user: User;
  status: string;
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
  const [eta, setEta] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [rideCancelled, setRideCancelled] = useState(false);
  const fetcher = (url: string) => axios.get(url).then((res) => res.data);
  const { data: session } = useSession();
  const { data: swrRideDetails, error: rideError } = useSWR(
    rideId ? `/api/rides/${rideId}` : null,
    fetcher
  );

  useEffect(() => {
    if (swrRideDetails?.status === "Cancelled") {
      alert("Ride has been cancelled");
      router.push("/dashboard");
    }
  }, [swrRideDetails, router]);
  const mapRef = useRef();

  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map;
  }, []);

  const [timer, setTimer] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  const [extraCharges, setExtraCharges] = useState(0);
  const [initialPeriodPassed, setInitialPeriodPassed] = useState(false);


  useEffect(() => {
    let interval: number | undefined;
  
    if (timerActive) {
      if (!initialPeriodPassed) {
        interval = window.setInterval(() => {
          setTimer(prevTimer => {
            if (prevTimer - 1 <= 0) {
              setInitialPeriodPassed(true);
              notifyUser(); 
            }
            return Math.max(prevTimer - 1, 0); 
          });
        }, 1000);
      } else {
        interval = window.setInterval(() => {
          setExtraCharges(prevCharges => prevCharges + 1);
        }, 60000);
      }
    } else {
      clearInterval(interval);
    }
  
    return () => clearInterval(interval);
  }, [timerActive, timer, initialPeriodPassed]);
  
  
  const handleStartStopTimer = () => {
    if (timerActive) {
      setTimerActive(false);
    } else {
      if (!initialPeriodPassed && timer <= 0) {
        setTimer(600);
        setInitialPeriodPassed(false);
      }
      setTimerActive(true);
    }
  };
  

  const formatTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const notifyUser = async () => {
    try {
      await axios.post("/api/sendNotification", { rideId: rideDetails?.id });
      console.log("Notification sent to user");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const updateDriverLocation = useCallback(
    async (lat: number, lng: number) => {
      try {
        const driverId = session?.user.id;
        await axios.patch("/api/drivers/location", {
          driverId,
          location: { lat, lng },
        });
        setDriverLocation({ lat, lng });
      } catch (error) {
        console.error("Error updating driver location:", error);
      }
    },
    [session?.user.id]
  );

  useEffect(() => {
    let watchId: number | undefined;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateDriverLocation(latitude, longitude);
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        { enableHighAccuracy: true }
      );
    }

    // Clean up
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [updateDriverLocation]);

  const fetchCoordinates = async (address: any) => {
    try {
      const response = await axios.post("/api/geocode", { address });
      return response.data;
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  };

  const handlePickedUp = async () => {
    if (rideDetails) {
      try {
        await axios.patch(`/api/rides/${rideId}`, {
          status: "InProgress",
          pickupTime: new Date(),
        });

        const dropoffCoordinates = await fetchCoordinates(
          rideDetails.dropoffLocation
        );
        if (dropoffCoordinates) {
          setDropoffLocation(dropoffCoordinates);
        }
      } catch (error) {
        console.error("Error updating ride status:", error);
      }
    }
    setIsPickedUp(true);
  };

  const handleRideComplete = async () => {
    if (rideDetails) {
      try {
        await axios.patch(`/api/rides/${rideId}`, {
          status: "Completed",
          dropoffTime: new Date(),
        });
        alert("Ride completed successfully!");

        router.push("/dashboard");
      } catch (error) {
        console.error("Error completing the ride:", error);
        alert("Failed to complete the ride.");
      }
    }
  };

  useEffect(() => {
    const fetchRideDetails = async () => {
      if (typeof rideId === "string") {
        setIsLoading(true);
        try {
          const response = await axios.get(`/api/rides/${rideId}`);
          const fetchedRideDetails = response.data;

          setRideDetails(fetchedRideDetails);

          const coordinates = await fetchCoordinates(
            fetchedRideDetails.pickupLocation
          );
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
  }, [rideId, router]);

  useEffect(() => {
    const updateDirections = () => {
      if (
        !mapRef.current ||
        !driverLocation ||
        !(pickupLocation || dropoffLocation)
      )
        return;

      const destination = isPickedUp ? dropoffLocation : pickupLocation;
      if (!destination) return;

      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: driverLocation,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            //@ts-ignore
            setDirections(result);
            //@ts-ignore
            const duration = result.routes[0].legs[0].duration.text;
            setEta(duration);
          } else {
            console.error(`Error fetching directions: ${status}`);
          }
        }
      );
    };

    const intervalId = setInterval(updateDirections, 0);
    return () => clearInterval(intervalId);
  }, [driverLocation, pickupLocation, dropoffLocation, isPickedUp]);

  const openInMaps = (locationType: any) => {
    let location;
    if (locationType === "pickup" && pickupLocation) {
      location = pickupLocation;
    } else if (locationType === "dropoff" && dropoffLocation) {
      location = dropoffLocation;
    }

    if (location) {
      //@ts-ignore
      const destination = `${location.lat},${location.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(url, "_blank");
    }
  };

  const [manualDriverLat, setManualDriverLat] = useState("");
  const [manualDriverLng, setManualDriverLng] = useState("");

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setManualDriverLat(lat.toString());
          setManualDriverLng(lng.toString());
          setDriverLocation({ lat, lng });

          await updateDriverLocation(lat, lng);
        },
        (error) => {
          console.error("Error getting current location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const [showOverlay, setShowOverlay] = useState(false);

  const handlePhotoClick = () => {
    setShowOverlay(true);
  };

  const handleOverlayClick = () => {
    setShowOverlay(false);
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {rideDetails && (
        <>
          <LoadScript googleMapsApiKey={process.env.API_KEY || ""}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={
                isPickedUp
                  ? dropoffLocation || { lat: 0, lng: 0 }
                  : pickupLocation || { lat: 0, lng: 0 }
              }
              zoom={12}
              onLoad={onMapLoad}
              options={mapOptions}
            >
              <Marker position={driverLocation} label="Driver" />
              {isPickedUp
                ? dropoffLocation && (
                    <Marker position={dropoffLocation} label="Dropoff" />
                  )
                : pickupLocation && (
                    <Marker position={pickupLocation} label="Pickup" />
                  )}
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </LoadScript>
          <div className="absolute sm:bg-transparent bg-white h-[20vh] z-10  bottom-0 px-5 space-y-2 pt-4  rounded-[8px] w-full">
            {rideDetails.user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div>
                    <Image
                      src={rideDetails.user.photoUrl}
                      alt="pfp"
                      width={50}
                      height={50}
                      className="rounded-full"
                      onClick={handlePhotoClick}
                    />
                  </div>
                  {showOverlay && (
                    <div className="overlay" onClick={handleOverlayClick}>
                      <div className="overlay-content">
                        <Image
                          src={rideDetails.user.photoUrl}
                          alt="Profile Picture"
                          layout="fill"
                          className="rounded-full"
                        />
                      </div>
                    </div>
                  )}
                  <div>{rideDetails.user.name}</div>
                </div>
                <div>
                  <button  onClick={handleStartStopTimer}>
                    {timerActive ? `${formatTime()}` : "Stops Timer"}
                  </button>
                  {initialPeriodPassed && (
            <p>Extra Charges: ${extraCharges}</p>
          )}

                  <p>{eta}</p>
                </div>
              </div>
            ) : (
              <p>Loading user details...</p>
            )}
            <div className="flex items-center justify-between">
              <div>
                {!isPickedUp ? (
                  <button
                    onClick={handlePickedUp}
                    className="py-2 pl-4 pr-4 bg-black text-white rounded-md"
                  >
                    Picked Up
                  </button>
                ) : (
                  <button
                    onClick={handleRideComplete}
                    className="py-2 pl-4 pr-4 bg-black text-white rounded-md"
                  >
                    Complete Ride
                  </button>
                )}
              </div>
              <div>
                <button
                  className="py-2 pl-4 pr-4 bg-black text-white rounded-md"
                  onClick={() =>
                    isPickedUp ? openInMaps("dropoff") : openInMaps("pickup")
                  }
                >
                  {isPickedUp ? "Open in Maps" : "Open in Maps"}
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

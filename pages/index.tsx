import { useLoadScript } from "@react-google-maps/api";
import Map from "../components/map";

export default function Home() {
  // googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places"]
  });
  
  if (!isLoaded) return <div> Loading... </div>;
  return (
    <Map />
  );
}


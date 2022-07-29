import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useMemo } from "react";

type PlacesProps = {
  setAddr: (position: google.maps.LatLngLiteral) => void;
  setWatchID: (ID: number | null) => void
};

export default function Places({ setAddr, setWatchID }: PlacesProps) {
  const {
    ready, 
    value, 
    setValue, 
    suggestions : {status, data}, 
    clearSuggestions
  } = usePlacesAutocomplete();

  const handleSelect = async (val: string) => {
    setValue(val, false);
    clearSuggestions();
    clearWatch();       // stop geolocation tracker

    const results = await getGeocode({address: val});
    const {lat, lng} = await getLatLng(results[0]);
    setAddr({lat, lng});
  }

  const updateLocation = () => {
    if (localStorage.getItem("watchID")) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAddr({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => null,
      );
    }
    else {
      setWatchID(navigator.geolocation.watchPosition(
        (position) => {
          console.log(position);
          const { latitude, longitude } = position.coords;
          setAddr({lat: latitude, lng: longitude});
        }, 
        () => null
      ));
      toast.info("Realtime location active!");
    }
    console.log(localStorage.getItem("watchID"));
  }

  const clearWatch = () => {
    console.log(localStorage.getItem("watchID"));
    let id = localStorage.getItem("watchID");
    setWatchID(null);
    if (id) navigator.geolocation.clearWatch(parseInt(id));

    toast.info("Stopped keeping track of realtime location")
  }
  
  return (
    <>
      <button
        className="stop-geolocation"
        onClick={clearWatch}
      >
        Stop Updating Location
      </button>
      <button
        className="geolocate"
        onClick={() => {
          updateLocation();
        }}
      >
        Update Current Location
      </button>
      <Combobox onSelect={handleSelect}>
        <ComboboxInput
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          disabled={!ready}
          className="combobox-input" 
          placeholder="Give your address"
        />  
        <ComboboxPopover>
          <ComboboxList>
            {status === "OK" && data.map(({ place_id, description }) => (
              <ComboboxOption key={place_id} value={description} />
            ))}  
          </ComboboxList>
        </ComboboxPopover>
        <ToastContainer />
      </Combobox>
    </>
  )
}

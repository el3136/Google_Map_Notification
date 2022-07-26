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

  import { ToastContainer } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';

  type PlacesProps = {
    setAddr: (position: google.maps.LatLngLiteral) => void;
  };

export default function Places({ setAddr }: PlacesProps) {
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

    const results = await getGeocode({address: val});
    const {lat, lng} = await getLatLng(results[0]);
    setAddr({lat, lng});
  }

  return (
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
  )
}

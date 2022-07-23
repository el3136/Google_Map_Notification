import { useState, useMemo, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Circle,
  MarkerClusterer,
} from "@react-google-maps/api";
import Places from "./places";
import Distance from "./distance";


type LatLngLiteral = google.maps.LatLngLiteral;
type DirectionsResult = google.maps.DirectionsResult;
type MapOptions = google.maps.MapOptions;

export default function Map() {
  const [addr, setAddr] = useState<LatLngLiteral>();
  const [directions, setDirections] = useState<DirectionsResult>();
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 43, lng: -80 }), []);
  const options = useMemo<MapOptions>(() => ({
    disableDefaultUI: true,
    clickableIcons: false
  }), []);

  const onLoad = useCallback((map) => (mapRef.current = map), []);
  const houses = useMemo(() => {
    // if (addr) generateHouses(addr);  // does not work without return
    if (addr) return generateHouses(addr);
  }, [addr]);

  const fetchDirections = (house: LatLngLiteral) => {
    if (!addr) return;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: house,
        destination: addr,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        }
      }
    );
  };
  
  const countWithinRange = (distance: Array<Number>, radius: Number) => {
    return distance.filter((val) => {
      if (val <= radius) return val;
    }).length;
  }
  

  return (
    <div className="container">
      <div className="controls">
        <h1>Commute?</h1>
        <Places setAddr={(position)=> {
          setAddr(position);  
          mapRef.current?.panTo(position);
        }} />
        {!addr && <p>Enter the address of your location</p>}
        {directions && <Distance leg={directions.routes[0].legs[0]} />}
        {/* filter houses so that it displays all the houses within a certain range */}
        {/* Add a field to the houses that will store the distance of each position from the address */}
        {houses && (
          <div>
            The number of locations within a 15000m radius of the address is {countWithinRange(houses?._distance, 15000)}.
          </div>
        )}
      </div>
      <div className="map">
        <GoogleMap 
          zoom={10} 
          center={center} 
          mapContainerClassName='map-container'
          options={options}
          onLoad={onLoad}
        >
          {directions && <DirectionsRenderer directions={directions} options={{
            polylineOptions: {
              zIndex: 50,
              strokeColor: "#1976D2",
              strokeWeight: 5,
            },
          }} />}  

          {addr && (
            <>
              <Marker
                position={addr}
                icon="https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png"
              />

              <MarkerClusterer>
                {(clusterer) =>
                  houses?._houses.map((house) => (
                    <Marker
                      key={house.lat} 
                      position={house}
                      clusterer={clusterer}
                      onClick={() => {
                        fetchDirections(house)
                      }}
                    />
                  ))
                }
              </MarkerClusterer>

              <Circle center={addr} radius={15000} options={closeOptions} />
              <Circle center={addr} radius={30000} options={middleOptions} />
              <Circle center={addr} radius={45000} options={farOptions} />
            </>
          )}
        </GoogleMap>
      </div>
    </div>
  )
}


const defaultOptions = {
  strokeOpacity: 0.5,
  strokeWeight: 2,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
};
const closeOptions = {
  ...defaultOptions,
  zIndex: 3,
  fillOpacity: 0.05,
  strokeColor: "#8BC34A",
  fillColor: "#8BC34A",
};
const middleOptions = {
  ...defaultOptions,
  zIndex: 2,
  fillOpacity: 0.05,
  strokeColor: "#FBC02D",
  fillColor: "#FBC02D",
};
const farOptions = {
  ...defaultOptions,
  zIndex: 1,
  fillOpacity: 0.05,
  strokeColor: "#FF5252",
  fillColor: "#FF5252",
};

const haversine_distance = (lat1: Number, lat2: Number, lon1: Number, lon2: Number) => {
    var R = 6378.137; // Radius of earth in KM
    var dLat = +lat2 * Math.PI / 180 - +lat1 * Math.PI / 180;
    var dLon = +lon2 * Math.PI / 180 - +lon1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(+lat1 * Math.PI / 180) * Math.cos(+lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}
  
const generateHouses = (position: LatLngLiteral) => {
  const _houses: Array<LatLngLiteral> = [];
  const _distance: Array<Number> = [];
  for (let i = 0; i < 100; i++) {
    const direction = Math.random() < 0.5 ? -2 : 2;
    const latRand = Math.random();
    const lngRand = Math.random();
    _houses.push({
      lat: position.lat + latRand / direction,
      lng: position.lng + lngRand / direction,
    });
    _distance.push(haversine_distance(
      position.lat, 
      position.lat + latRand / direction, 
      position.lng, 
      position.lng + lngRand / direction
    ))
  }
  return {_houses, _distance};
};
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Circle,
  MarkerClusterer,
} from "@react-google-maps/api";
import Places from "./places";
import Distance from "./distance";

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


type LatLngLiteral = google.maps.LatLngLiteral;
type DirectionsResult = google.maps.DirectionsResult;
type MapOptions = google.maps.MapOptions;

const decidedRadius = 15000;  // meters

export default function Map() {
  const [addr, setAddr] = useState<LatLngLiteral>();
  const [directions, setDirections] = useState<DirectionsResult>();
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(() => ({ lat: 40, lng: -80 }), []);
  const options = useMemo<MapOptions>(() => ({
    disableDefaultUI: true,
    clickableIcons: false
  }), []);

  const onLoad = useCallback((map) => (mapRef.current = map), []);

  const [closeMark, setCloseMark] = useState(0);
  const notify = () => {
    toast(closeMark.toString() + " locations close by");
  }
  const countWithinRange = (distance: Array<Number>, radius: Number) => {
    setCloseMark(distance.filter((val) => {
      if (val <= radius) return val;
    }).length);
    // notify();      // also 1 step late here
  }
  const houses = useMemo(() => {
    if (addr) {
      let temp = generateHouses(addr);
      countWithinRange(temp._distance, decidedRadius);
      // notify();    // 1 step old closeMark if called here
      return temp;
    }
  }, [addr]);
  useEffect(() => {
    notify();
  }, [houses])
  

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

  // const [watchID, setWatchID] = useState<number | null>(() => {
  //   if (localStorage.getItem("watchID")) return parseInt(localStorage.getItem("watchID"));
  //   else return null;
  // });
  

  return (
    <div className="container">
      <div className="controls">
        <h1>Current Address</h1>
        <Places setAddr={(position)=> {
          setAddr(position);  
          mapRef.current?.panTo(position);
          // <ToastContainer /> is returned by Places
          // toast(closeMark);  // this returns the previous closeMark
        }}
        setWatchID={(ID: number | null) => {
          if (ID) localStorage.setItem("watchID", ID.toString());
          else localStorage.clear();
        }} />
        <br />
        {!addr && <p>Enter the address of your location</p>}
        {directions && <Distance leg={directions.routes[0].legs[0]} />}
        {/* filter houses so that it displays all the houses within a certain range */}
        {/* Add a field to the houses that will store the distance of each position from the address */}
        {houses && (
          <div>
            <p>
              The number of locations within a {decidedRadius}m radius of the address is <span 
              className="highlight">{closeMark}</span>.
            </p>
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
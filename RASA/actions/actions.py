from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import googlemaps
import firebase_admin
from firebase_admin import credentials, firestore
import os
from typing import Any, List, Dict, Text
import time
from functools import lru_cache
import math

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("C:/Users/tagle/OneDrive/Desktop/Thesis/ExpoProject/LegazPin/firebase-adminsdk.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize Google Maps client
gmaps = googlemaps.Client(key="AIzaSyAy2J-28fvMFNZ7JOUYVAAENpXWcv-lHLQ")

# Preload fare data into memory
FARE_CACHE = {}
def preload_fares():
    try:
        fares_ref = db.collection("fares")
        docs = fares_ref.stream()
        for doc in docs:
            fare_data = doc.to_dict()
            FARE_CACHE[fare_data["distance"]] = {
                "regular": fare_data["regular"],
                "discounted": fare_data["discounted"]
            }
    except Exception as e:
        pass

# Load fares at startup
preload_fares()

LOCATIONS_CACHE = {}
def preload_locations():
    try:
        count = 0
        locations_ref = db.collection("locations")
        docs = locations_ref.stream()
        for doc in docs:
            location_data = doc.to_dict()
            LOCATIONS_CACHE[count] = {
                "name": location_data["name"],
                "description": location_data["description"],
                "tags": location_data["tags"],
                "coords": location_data["coords"],
            }
            count = count + 1
    except Exception as e:
        pass

preload_locations()

def get_nearest_poi(lat: float, lng: float, poi_type: str, max_results: int = 1) -> str:
    try:
        places_result = gmaps.places_nearby(
            location=(lat, lng),
            type=poi_type,
            rank_by="distance"
        )
        if places_result.get("results") and len(places_result["results"]) > 0:
            nearest_places = places_result["results"][:max_results]
            place_names = [place["name"] for place in nearest_places]
            return ", ".join(place_names) if place_names else f"No {poi_type} found nearby"
        else:
            return f"No {poi_type} found nearby"
    except Exception as e:
        return f"No {poi_type} found nearby"

def get_user_current_location(lat: float, lng: float) -> str:
    try:
        places_result = gmaps.places_nearby(
            location=(lat, lng),
            type="point_of_interest",
            rank_by="distance"
        )
        if places_result.get("results") and len(places_result["results"]) > 0:
            nearest_place = places_result["results"][0]
            return nearest_place["name"]
        return "Unknown Location"
    except Exception as e:
        return "Unknown Location"

def set_location_slots(tracker: Tracker) -> List[Dict[Text, Any]]:
    latest_message = tracker.latest_message.get("metadata", {})
    latitude = latest_message.get("latitude")
    longitude = latest_message.get("longitude")

    try:
        latitude = float(latitude) if latitude is not None else None
        longitude = float(longitude) if longitude is not None else None
    except (ValueError, TypeError):
        latitude = None
        longitude = None

    slots = []
    if latitude is not None and latitude != 0:
        slots.append({"name": "latitude", "value": latitude})
    if longitude is not None and longitude != 0:
        slots.append({"name": "longitude", "value": longitude})

    return slots

def handle_location_input(
    origin: str,
    destination: str,
    tracker: Tracker,
    dispatcher: CollectingDispatcher
) -> tuple[str, str, bool]:
    if not origin or not destination:
        dispatcher.utter_message(text="Please specify both origin and destination.")
        return origin, destination, False

    if origin.lower() == destination.lower():
        dispatcher.utter_message(text="Origin and destination cannot be the same. Please clarify.")
        return origin, destination, False

    if origin.lower() in ["my location", "here", "where i am", "my place"]:
        loc_slots = set_location_slots(tracker)
        user_lat = next((slot["value"] for slot in loc_slots if slot["name"] == "latitude"), None)
        user_lng = next((slot["value"] for slot in loc_slots if slot["name"] == "longitude"), None)
        if user_lat and user_lng and user_lat != 0 and user_lng != 0:
            origin = get_user_current_location(user_lat, user_lng)
            if origin == "Unknown Location":
                dispatcher.utter_message(text="Could not determine your current location. Please specify a nearby landmark.")
                return origin, destination, False
        else:
            origin = "Legazpi City Hall"

    return origin, destination, True

def get_fare_data(distance: float) -> Dict[str, float]:
    rounded_distance = round(distance)
    fare_data = FARE_CACHE.get(rounded_distance)
    if not fare_data:
        min_diff = float("inf")
        for dist, data in FARE_CACHE.items():
            diff = abs(dist - rounded_distance)
            if diff < min_diff and diff <= 1:
                min_diff = diff
                fare_data = data
    return fare_data

class ActionHandleFareInquiry(Action):
    def name(self) -> Text:
        return "action_handle_fare_inquiry"

    @lru_cache(maxsize=1000)
    def get_cached_distance(self, origin: str, destination: str, region: str = "ph") -> tuple:
        try:
            distance_matrix = gmaps.distance_matrix(
                origins=origin,
                destinations=destination,
                mode="driving",
                units="metric",
                region=region
            )
            element = distance_matrix["rows"][0]["elements"][0]
            status = element["status"]
            distance_km = element["distance"]["value"] / 1000.0 if status == "OK" else None
            return distance_km, status
        except Exception as e:
            return None, "ERROR"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        origin = tracker.get_slot("origin")
        destination = tracker.get_slot("destination")
        route = tracker.get_slot("route")
        discount = tracker.get_slot("discount")

        origin, destination, is_valid = handle_location_input(origin, destination, tracker, dispatcher)
        if not is_valid:
            return []

        region = "ph"

        try:
            distance_km, status = self.get_cached_distance(origin, destination, region)

            if status == "NOT_FOUND":
                dispatcher.utter_message(text=f"One of the locations ({origin} or {destination}) was not found. Please provide more specific names.")
                return [SlotSet("origin", None), SlotSet("destination", None)]
            elif status == "ZERO_RESULTS":
                dispatcher.utter_message(text=f"No driving route exists between {origin} and {destination}.")
                return [SlotSet("origin", None), SlotSet("destination", None)]
            elif status == "ERROR" or distance_km is None:
                dispatcher.utter_message(text="Failed to calculate distance. Please try again.")
                return [SlotSet("origin", None), SlotSet("destination", None)]

            fare_data = get_fare_data(distance_km)
            if not fare_data:
                dispatcher.utter_message(text=f"No fare found for a distance of {round(distance_km)} km. Please try different locations.")
                return [SlotSet("origin", None), SlotSet("destination", None)]

            regular_fare = round(fare_data["regular"])
            discounted_fare = round(fare_data["discounted"])

            if not discount:
                discount = "regular"

            is_discounted = discount in ["student", "senior", "PWD", "students", "seniors", "PWDs"]

            response_parts = []
            if origin.lower() in ["my location", "here", "where i am", "my place"] or origin == "Legazpi City Hall":
                response_parts.append(f"Assuming your starting location as {origin}.")

            if is_discounted and route:
                response_parts.append(
                    f"For a {discount} discount, the fare from {origin} via {route} to {destination} is ₱{discounted_fare:.2f}."
                )
            elif is_discounted:
                response_parts.append(
                    f"For a {discount} discount, the fare from {origin} to {destination} is ₱{discounted_fare:.2f}."
                )
            elif route:
                response_parts.append(
                    f"The regular fare from {origin} via {route} to {destination} is ₱{regular_fare:.2f}. For a discount, it's ₱{discounted_fare:.2f}."
                )
            else:
                response_parts.append(
                    f"The regular fare from {origin} to {destination} is ₱{regular_fare:.2f}. For a discount, it's ₱{discounted_fare:.2f}."
                )

            dispatcher.utter_message(text=" ".join(response_parts))
            return []

        except Exception as e:
            dispatcher.utter_message(text="An error occurred while calculating the fare. Please try again.")
            return []

class ActionHandleFindNearest(Action):
    def name(self) -> Text:
        return "action_handle_find_nearest"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        poi_type = tracker.get_slot("poi")
        
        if not poi_type:
            dispatcher.utter_message(text="Sorry, I didn't understand what place you're looking for. Could you specify, like 'hospital' or 'cafe'?")
            return []

        loc_slots = set_location_slots(tracker)
        user_lat = next((slot["value"] for slot in loc_slots if slot["name"] == "latitude"), None)
        user_lng = next((slot["value"] for slot in loc_slots if slot["name"] == "longitude"), None)

        if not user_lat or not user_lng or user_lat == 0 or user_lng == 0:
            dispatcher.utter_message(text="Could not determine your current location. Please share your location or specify a nearby landmark.")
            return []

        poi_mapping = {
            "pool": "swimming_pool",
            "pools": "swimming_pool",
            "hospital": "hospital",
            "hospitals": "hospital",
            "school": "school",
            "schools": "school",
            "university": "university",
            "universities": "university",
            "cafe": "cafe",
            "cafes": "cafe",
            "park": "park",
            "parks": "park",
            "point of interest": "point_of_interest",
            "bank": "bank",
            "banks": "bank",
            "church": "church",
            "churches": "church",
            "restaurant": "restaurant",
            "restaurants": "restaurant",
            "pharmacy": "pharmacy",
            "pharmacies": "pharmacy",
            "mall": "shopping_mall",
            "malls": "shopping_mall",
            "jeepney terminal": "bus_station",
            "jeepney terminals": "bus_station",
            "fire station": "fire_station",
            "fire stations": "fire_station",
            "gas station": "gas_station",
            "gas stations": "gas_station",
            "atm": "atm",
            "atms": "atm",
            "tourist spot": "tourist_attraction",
            "tourist spots": "tourist_attraction",
            "hotel": "hotel",
            "hotels": "hotel",
            "bar": "bar",
            "bars": "bar",
            "clinic": "hospital",
            "clinics": "hospital",
            "public market": "market",
            "public markets": "market",
            "viewpoint": "point_of_interest",
            "viewpoints": "point_of_interest",
            "transport terminal": "bus_station",
            "transport terminals": "bus_station",
            "museum": "museum",
            "museums": "museum",
            "playground": "park",
            "playgrounds": "park",
            "bridge": "point_of_interest",
            "bridges": "point_of_interest",
            "library": "library",
            "libraries": "library",
            "police station": "police",
            "police stations": "police",
            "gym": "gym",
            "gyms": "gym",
            "coffee shop": "cafe",
            "coffee shops": "cafe",
            "fast food restaurant": "restaurant",
            "fast food restaurants": "restaurant",
            "health center": "hospital",
            "health centers": "hospital",
            "barbershop": "hair_care",
            "barbershops": "hair_care",
            "bus terminal": "bus_station",
            "bus terminals": "bus_station",
            "convenience store": "convenience_store",
            "convenience stores": "convenience_store",
            "bakery": "bakery",
            "bakeries": "bakery",
            "water refilling station": "store",
            "water refilling stations": "store",
            "hardware store": "hardware_store",
            "hardware stores": "hardware_store",
            "tourist attraction": "tourist_attraction",
            "tourist attractions": "tourist_attraction",
            "beach": "point_of_interest",
            "beaches": "point_of_interest",
            "bike rental": "bicycle_store",
            "bike rentals": "bicycle_store",
            "internet cafe": "cafe",
            "internet cafes": "cafe",
            "barangay hall": "local_government_office",
            "barangay halls": "local_government_office",
            "embarcadero": "point_of_interest",
            "dormitory": "lodging",
            "dormitories": "lodging",
            "tourist info center": "tourist_attraction",
            "tourist info centers": "tourist_attraction"
        }

        plural_poi = {
            "schools", 
            "universities", 
            "cafes", 
            "restaurants", 
            "hospitals", 
            "malls", 
            "banks", 
            "churches", 
            "pharmacies", 
            "parks", 
            "gas stations",
            "ATMs",
            "tourist attractions",
            "hotels",
            "bars",
            "clinics",
            "public markets",
            "museums",
            "playgrounds",
            "libraries",
            "police stations",
            "gyms",
            "coffee shops",
            "convenience stores",
            "bakeries"
        }

        google_poi_type = poi_mapping.get(poi_type.lower(), "point_of_interest")
        user_input = tracker.latest_message.get("text", "").lower()
        is_list_request = "list" in user_input or poi_type.lower() in plural_poi

        max_results = 5 if is_list_request else 1
        location = get_nearest_poi(user_lat, user_lng, google_poi_type, max_results)

        if is_list_request and ", " in location:
            locations = location.split(", ")
            response = f"The nearest {poi_type}s from your location are: {', '.join(locations)}."
        else:
            response = f"The nearest {poi_type} from your location is {location}."

        dispatcher.utter_message(text=response)
        return [SlotSet("location", location)]

class ActionHandleRouteFinder(Action):
    def name(self) -> Text:
        return "action_handle_route_finder"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        origin = tracker.get_slot("origin")
        destination = tracker.get_slot("destination")

        origin, destination, is_valid = handle_location_input(origin, destination, tracker, dispatcher)
        if not is_valid:
            return []

        try:
            list_of_routes = []
            routes_ref = db.collection("routes")
            routes_docs = routes_ref.stream()

            for doc in routes_docs:
                route_data = doc.to_dict()
                landmarks = route_data.get("landmarks", [])
                route_distance = route_data.get("distance", 0)

                has_origin = any(
                    landmark.lower() == origin.lower() for landmark in landmarks
                )
                has_destination = any(
                    landmark.lower() == destination.lower() for landmark in landmarks
                )

                if has_origin and has_destination:
                    list_of_routes.append(route_data["name"])

            if not list_of_routes:
                dispatcher.utter_message(
                    text=f"No routes found from {origin} to {destination}. Please try different locations."
                )
                return []

            routes_docs = routes_ref.stream()
            route_distance = 0
            for doc in routes_docs:
                if doc.to_dict()["name"] in list_of_routes:
                    route_distance = doc.to_dict().get("distance", 0)
                    break

            fare_data = get_fare_data(route_distance)
            if not fare_data:
                dispatcher.utter_message(
                    text=f"No fare found for a distance of {round(route_distance)} km. Please try different locations."
                )
                return []

            regular_fare = round(fare_data["regular"])
            discounted_fare = round(fare_data["discounted"])

            routes_string = ", ".join(list_of_routes)
            response = (
                f"From {origin} to {destination}, route/s like {routes_string} "
                f"should take you there. The regular fare is ₱{regular_fare:.2f} "
                f"and discounted fare is ₱{discounted_fare:.2f}"
            )

            dispatcher.utter_message(text=response)
            return []

        except Exception as e:
            dispatcher.utter_message(text="An error occurred while finding routes. Please try again.")
            return []

    # pag nag ask ng two locations, ang gagawin nya ay titingnan sa firebase kung yung two locations 
    # na yun ay nasa firebase and if both yung location nasa firebase ilalagay sya sa array
    # making it a list tapos yun ang irereturn na response ng bot
    # and then based from the distance irerturn din yung fare

class ActionHandleRecommendPlace(Action):
    def name(self) -> Text:
        return "action_handle_recommend_place"
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0  # Earth's radius in kilometers
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        return distance

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        activity = tracker.get_slot("activity")
        activity = activity.lower() if activity else None

        if not activity:
            dispatcher.utter_message(text="Sorry, I didn't understand what activity you're looking for. Could you specify, like 'hiking' or 'eat'?")
            return []

        loc_slots = set_location_slots(tracker)
        user_lat = next((slot["value"] for slot in loc_slots if slot["name"] == "latitude"), None)
        user_lng = next((slot["value"] for slot in loc_slots if slot["name"] == "longitude"), None)

        if not user_lat or not user_lng or user_lat == 0 or user_lng == 0:
            dispatcher.utter_message(text="Could not determine your current location. Please share your location or specify a nearby landmark.")
            return []

        activity_mapping = {
            "hiking": ["hiking", "outdoor", "adventure"],
            "hike": ["hiking", "outdoor", "adventure"],
            "relax": ["park", "nature", "beach"],
            "relaxation": ["park", "nature"],
            "relaxing": ["park", "nature"],
            "swim": ["outdoor", "recreation", "adventure"],
            "swimming": ["outdoor", "recreation", "adventure"],
            "sightseeing": ["sightseeing", "photography", "scenic"],
            "sunset": ["photography", "scenic", "outdoor"],
            "sunrise": ["photography", "scenic", "outdoor"],
            "pray": ["religious"],
            "meditate": ["park", "religious", "quiet"],
            "worship": ["religious"],
            "study": ["education", "school", "college", "university"],
            "recreate": ["recreation", "park"],
            "dine": ["dining", "restaurant"],
            "eat": ["dining", "restaurant", "fast food"],
            "food": ["dining", "restaurant", "fast food"],
            "date": ["restaurant", "park", "scenic"],
            "casual talk": ["public space", "park", "dining"],
            "shop": ["shopping", "commercial", "market"],
            "movies": ["entertainment", "leisure"],
            "play": ["recreation", "outdoor"],
            "games": ["entertainment", "leisure"],
            "exercise": ["sports", "fitness"],
            "jog": ["sports", "fitness", "outdoor"],
            "photography": ["photography", "scenic", "nature"],
            "learn history": ["historic", "cultural", "education"],
            "cultural exploration": ["cultural", "historic", "education"],
            "banking": ["banking", "utility"],
            "stay overnight": ["accommodation", "hotel"],
            "commute": ["transportation", "logistics"],
            "view scenery": ["scenic", "sightseeing", "outdoor"],
            "seek medical care": ["healthcare", "hospital"],
            "see a doctor": ["healthcare", "hospital"],
            "visit government services": ["government", "administrative"],
            "attend events": ["events", "cultural", "entertainment"],
            "sports": ["sports", "recreation"],
            "bird watch": ["wildlife", "nature", "outdoor"],
            "picnic": ["park", "nature", "recreation"],
            "cultural shows": ["cultural", "entertainment", "events"],
            "cycle": ["sports", "outdoor", "adventure"],
            "explore nature": ["nature", "outdoor", "adventure"],
            "family bonding": ["recreation", "park", "public space"],
            "workshops": ["education", "events"],
            "souvenirs": ["shopping", "market", "cultural"],
            "nightlife": ["entertainment", "dining", "nightlife"],
            "festivals": ["cultural", "events", "entertainment"],
            "volunteer": ["community", "events"],
            "walk": ["outdoor", "park", "recreation"],
            "leisure": ["leisure", "recreation", "public space"],
            "meet": ["public space", "dining", "community"],
            "quiet": ["park", "religious", "public space"],
            "lectures": ["education", "school", "university"],
            "yoga": ["fitness", "recreation", "quiet"],
            "performances": ["entertainment", "events", "cultural"],
            "art": ["cultural", "education", "entertainment"],
            "camp": ["adventure", "outdoor", "nature"],
            "markets": ["shopping", "market"],
            "fish": ["nature", "recreation", "agri-tourism"]
        }

        tags = activity_mapping.get(activity, [activity])

        try:
            locations_with_distance = []
            for _, location_data in LOCATIONS_CACHE.items():
                coords = location_data.get("coords", {})
                place_lat = coords.get("lat")
                place_lng = coords.get("lon")
                
                if place_lat is None or place_lng is None:
                    continue

                distance = self.haversine_distance(user_lat, user_lng, place_lat, place_lng)
                locations_with_distance.append({
                    "name": location_data["name"],
                    "description": location_data["description"],
                    "tags": [tag.lower() for tag in location_data["tags"]],
                    "distance": distance
                })

            locations_with_distance.sort(key=lambda x: x["distance"])

            recommended_places = []
            description_places = []
            for location in locations_with_distance:
                location_tags = location["tags"]
                if any(tag.lower() in location_tags for tag in tags):
                    recommended_places.append(location["name"])
                    description_places.append(location["description"])
                    if len(recommended_places) >= 3:
                        break

            if recommended_places:
                places_list = "\n".join([f"{recommended_places[i]} - {description_places[i]}" for i in range(len(recommended_places))])
                dispatcher.utter_message(text=f"I would recommend these places for {activity}:\n{places_list}")
                return [SlotSet("location", recommended_places[0])]
            else:
                alternative_activities = ["eat", "hiking", "relax"]
                dispatcher.utter_message(
                    text=f"Sorry, I couldn't find any places for {activity} near your location. "
                         f"Would you like to try another activity like {', '.join(alternative_activities)}?"
                )
                return []

        except Exception as e:
            dispatcher.utter_message(text=f"An error occurred while finding places for {activity}. Please try again.")
            return []

class ActionHandleTravelTimeEstimate(Action):
    def name(self) -> Text:
        return "action_handle_travel_time_estimate"

    @lru_cache(maxsize=1000)
    def get_cached_directions(self, origin: str, destination: str, region: str = "ph") -> tuple:
        try:
            directions_result = gmaps.directions(
                origin=origin,
                destination=destination,
                mode="driving",
                region=region
            )
            if directions_result and len(directions_result) > 0:
                leg = directions_result[0]["legs"][0]
                duration = leg["duration"]["value"]
                duration_text = leg["duration"]["text"]
                return duration, duration_text, "OK"
            else:
                return None, None, "ZERO_RESULTS"
        except Exception as e:
            return None, None, "ERROR"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        destination = tracker.get_slot("destination")
        origin = tracker.get_slot("origin")

        if not destination:
            dispatcher.utter_message(text="Please specify a destination.")
            return []

        origin, destination, is_valid = handle_location_input(origin, destination, tracker, dispatcher)
        if not is_valid:
            return []

        region = "ph"

        try:
            duration_seconds, duration_text, status = self.get_cached_directions(origin, destination, region)

            if status == "NOT_FOUND":
                self.get_cached_directions.cache_clear()
                dispatcher.utter_message(text=f"One of the locations ({origin} or {destination}) was not found. Please provide more specific names.")
                return [SlotSet("origin", None), SlotSet("destination", None)]
            elif status == "ZERO_RESULTS":
                dispatcher.utter_message(text=f"No driving route exists between {origin} and {destination}.")
                return [SlotSet("origin", None), SlotSet("destination", None)]
            elif status == "ERROR" or duration_seconds is None:
                dispatcher.utter_message(text="Failed to calculate travel time. Please try again.")
                return [SlotSet("origin", None), SlotSet("destination", None)]

            response_parts = []
            if origin.lower() in ["my location", "here", "where i am", "my place"] or origin == "Legazpi City Hall":
                response_parts.append(f"Assuming your starting location as {origin}.")

            response_parts.append(
                f"The estimated travel time from {origin} to {destination} is {duration_text}."
            )

            dispatcher.utter_message(text=" ".join(response_parts))
            eta_minutes = duration_seconds / 60.0
            return [SlotSet("eta", eta_minutes)]

        except Exception as e:
            dispatcher.utter_message(text="An error occurred while calculating the travel time. Please try again.")
            return []
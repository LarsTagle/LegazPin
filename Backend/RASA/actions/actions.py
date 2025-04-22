# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


# This is a simple example for a custom action which utters "Hello World!"

# from typing import Any, Text, Dict, List
#
# from rasa_sdk import Action, Tracker
# from rasa_sdk.executor import CollectingDispatcher
#
#
# class ActionHelloWorld(Action):
#
#     def name(self) -> Text:
#         return "action_hello_world"
#
#     def run(self, dispatcher: CollectingDispatcher,
#             tracker: Tracker,
#             domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
#
#         dispatcher.utter_message(text="Hello World!")
#
#         return []

from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import firebase_admin
from firebase_admin import credentials, firestore
import googlemaps
from datetime import datetime

# Initialize Firebase
cred = credentials.Certificate("C:/Users/tagle/OneDrive/Desktop/Thesis/ExpoProject/Backend/firebase-adminsdk.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize Google Maps (add your API key)
gmaps = googlemaps.Client(key="AIzaSyB0_pol6DtwDT00ruh5th3F1Nb6eoaT3Q4")

class ActionFetchFare(Action):
    def name(self) -> Text:
        return "action_fetch_fare"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        origin = tracker.get_slot("ORIGIN")
        destination = tracker.get_slot("DESTINATION")
        transport = tracker.get_slot("TRANSPORT") or "jeepney"
        route_name = tracker.get_slot("ROUTE")
        discount = tracker.get_slot("DISCOUNT")

        # Map landmarks to broader areas if needed
        landmark_to_area = {
            "SM City Legazpi": "Legazpi",
            "Ayala Malls Legazpi": "Legazpi",
            "LCC Daraga": "Daraga",
            "Yashano Mall": "Legazpi",
            "Bicol University": "Legazpi"
        }
        origin_area = landmark_to_area.get(origin, origin)
        destination_area = landmark_to_area.get(destination, destination)

        if not all([origin_area, destination_area]):
            dispatcher.utter_message(text="Please provide both origin and destination.")
            return [SlotSet("FARE", None)]

        # Query routes collection
        route_query = db.collection("routes").where("start", "==", origin_area).where("end", "==", destination_area)
        if route_name:
            route_query = route_query.where("name", "==", route_name)
        routes = route_query.stream()

        route = None
        for doc in routes:
            route = doc.to_dict()
            if origin in route.get("landmarks", []) and destination in route.get("landmarks", []):
                break  # Prefer route containing both landmarks

        if not route:
            dispatcher.utter_message(text=f"Sorry, I couldn't find a route from {origin} to {destination}.")
            return [SlotSet("FARE", None)]

        distance = route.get("distance")
        fare_ref = db.collection("fares").where("distance", "==", distance)
        fares = fare_ref.stream()

        fare = None
        for doc in fares:
            fare = doc.to_dict()
            break

        if fare:
            fare_amount = fare.get("discounted" if discount else "regular", "unknown")
            route_name = route.get("name", "jeepney route")
            dispatcher.utter_message(text=f"The fare from {origin} to {destination} via {route_name} is ₱{fare_amount}.")
            return [SlotSet("FARE", str(fare_amount)), SlotSet("ROUTE", route_name), SlotSet("TRANSPORT", "jeepney")]
        else:
            dispatcher.utter_message(text=f"Sorry, I couldn't find fare information for a {distance}km route.")
            return [SlotSet("FARE", None)]

class ActionFetchRouteByLandmarks(Action):
    def name(self) -> str:
        return "action_fetch_route_by_landmarks"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict) -> list:
        origin = tracker.get_slot("ORIGIN") or "LCC Daraga"
        destination = tracker.get_slot("DESTINATION") or "Yashano Mall"
        if not origin or not destination:
            dispatcher.utter_message(text="Please provide both origin and destination landmarks.")
            return []

        # Query Firebase routes
        routes_ref = db.collection("routes")
        routes = routes_ref.stream()
        route = None
        for doc in routes:
            data = doc.to_dict()
            landmarks = data.get("landmarks", [])
            if origin in landmarks and destination in landmarks:
                route = data
                break

        if not route:
            dispatcher.utter_message(text=f"Sorry, I couldn't find a jeepney route from {origin} to {destination}.")
            return []

        fare_ref = db.collection("fares").where("distance", "==", round(distance))
        fares = fare_ref.stream()
        fare = next((doc.to_dict() for doc in fares), None)
        if fare:
            fare_amount = fare.get("discounted" if tracker.get_slot("DISCOUNT") else "regular")
            dispatcher.utter_message(text=f"Fare: ₱{fare_amount}.")

        route_name = route.get("name", "unnamed route")
        distance = route.get("distance", 0)
        landmarks = route.get("landmarks", [])
        key_landmarks = [l for l in landmarks if l in [origin, destination] or landmarks.index(l) < 2]
        landmarks_text = ", ".join(key_landmarks) if key_landmarks else "a few local spots"

        # Get precise distance and travel time via Google Maps
        try:
            directions = gmaps.directions(
                f"{origin}, Daraga, Albay, Philippines",
                f"{destination}, Legazpi, Albay, Philippines",
                mode="transit",  # Use "transit" for public transport (approximates jeepney)
                transit_mode="bus",
                departure_time=datetime.now()
            )
            if directions:
                distance = directions[0]["legs"][0]["distance"]["value"] / 1000  # Convert meters to km
                travel_time = directions[0]["legs"][0]["duration"]["text"]  # E.g., "45 minutes"
            else:
                travel_time = f"about {round((distance / 12) * 60)} minutes"
        except Exception as e:
            print(f"Google Maps error: {e}")
            travel_time = f"about {round((distance / 12) * 60)} minutes"  # Fallback

        dispatcher.utter_message(
            text=f"To get from {origin} to {destination}, hop on a jeepney via {route_name}. "
                 f"You'll pass by {landmarks_text}. Distance: {distance}km. Estimated travel time: {travel_time}."
        )
        return [SlotSet("ROUTE", route_name), SlotSet("LANDMARKS", landmarks_text), SlotSet("TRANSPORT", "jeepney")]
        
class ActionFetchRoute(Action):
    def name(self) -> Text:
        return "action_fetch_route"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        origin = tracker.get_slot("ORIGIN")
        destination = tracker.get_slot("DESTINATION")
        transport = tracker.get_slot("TRANSPORT") or "jeepney"
        route_name = tracker.get_slot("ROUTE")

        if not all([origin, destination]):
            dispatcher.utter_message(text="Please provide both origin and destination.")
            return []

        # Query routes collection
        route_query = db.collection("routes").where("start", "==", origin).where("end", "==", destination).where("isPrimary", "==", True)
        if route_name:
            route_query = db.collection("routes").where("name", "==", route_name)
        routes = route_query.stream()

        route = None
        for doc in routes:
            route = doc.to_dict()
            break

        if route:
            route_name = route.get("name", "unnamed route")
            landmarks = ", ".join(route.get("landmarks", [])) if route.get("landmarks") else "no landmarks specified"
            dispatcher.utter_message(text=f"To get from {origin} to {destination} via {route_name}, take a jeepney. Landmarks: {landmarks}.")
            return [SlotSet("ROUTE", route_name)]
        else:
            dispatcher.utter_message(text=f"Sorry, I couldn't find a route from {origin} to {destination}.")
            return []

class ActionFetchTravelTime(Action):
    def name(self) -> Text:
        return "action_fetch_travel_time"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        origin = tracker.get_slot("ORIGIN")
        destination = tracker.get_slot("DESTINATION")
        transport = tracker.get_slot("TRANSPORT") or "jeepney"
        route_name = tracker.get_slot("ROUTE")

        if not all([origin, destination]):
            dispatcher.utter_message(text="Please provide both origin and destination.")
            return []

        # Query routes collection
        route_query = db.collection("routes").where("start", "==", origin).where("end", "==", destination)
        if route_name:
            route_query = route_query.where("name", "==", route_name)
        routes = route_query.stream()

        route = None
        for doc in routes:
            route = doc.to_dict()
            break

        if route:
            distance = route.get("distance", 0)
            speed = 12  # km/h for jeepney
            travel_time = round((distance / speed) * 60)  # minutes
            route_name = route.get("name", "jeepney route")
            dispatcher.utter_message(text=f"Traveling from {origin} to {destination} via {route_name} takes about {travel_time} minutes.")
            return [SlotSet("TIME", str(travel_time))]
        else:
            dispatcher.utter_message(text=f"Sorry, I couldn't find a route from {origin} to {destination}.")
            return []

class ActionRecommendPlace(Action):
    def name(self) -> Text:
        return "action_recommend_place"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        activity = tracker.get_slot("ACTIVITY")
        purpose = tracker.get_slot("PURPOSE")

        recommendations = {
            "sightseeing": "Cagsawa Ruins",
            "hiking": "Lignon Hill",
            "family-friendly": "Embarcadero de Legazpi"
        }
        recommendation = recommendations.get(activity or purpose, "Mayon Volcano")
        dispatcher.utter_message(text=f"For {activity or purpose or 'visiting'}, I recommend {recommendation}.")
        return [SlotSet("ATTRACTION", recommendation)]

class ActionFetchAlternateTranspo(Action):
    def name(self) -> Text:
        return "action_fetch_alternate_transpo"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        destination = tracker.get_slot("DESTINATION")
        dispatcher.utter_message(text=f"For {destination}, only jeepneys are available. Try specifying a different route.")
        return []

class ActionFetchRouteAlternative(Action):
    def name(self) -> Text:
        return "action_fetch_route_alternative"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        origin = tracker.get_slot("ORIGIN")
        destination = tracker.get_slot("DESTINATION")

        if not all([origin, destination]):
            dispatcher.utter_message(text="Please provide both origin and destination.")
            return []

        # Query non-primary route
        route_query = db.collection("routes").where("start", "==", origin).where("end", "==", destination).where("isPrimary", "==", False)
        routes = route_query.stream()

        route = None
        for doc in routes:
            route = doc.to_dict()
            break

        if route:
            route_name = route.get("name", "unnamed route")
            via = ", ".join(route.get("via", [])) if route.get("via") else "no via points specified"
            dispatcher.utter_message(text=f"An alternative route from {origin} to {destination} is {route_name}, via {via}.")
            return [SlotSet("ALTERNATIVE", route_name)]
        else:
            dispatcher.utter_message(text=f"Sorry, I couldn't find an alternative route from {origin} to {destination}.")
            return []

class ActionFetchFareDiscount(Action):
    def name(self) -> Text:
        return "action_fetch_fare_discount"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        origin = tracker.get_slot("ORIGIN")
        destination = tracker.get_slot("DESTINATION")
        transport = tracker.get_slot("TRANSPORT") or "jeepney"
        route_name = tracker.get_slot("ROUTE")

        if not all([origin, destination]):
            dispatcher.utter_message(text="Please provide both origin and destination.")
            return []

        # Query routes collection
        route_query = db.collection("routes").where("start", "==", origin).where("end", "==", destination)
        if route_name:
            route_query = route_query.where("name", "==", route_name)
        routes = route_query.stream()

        route = None
        for doc in routes:
            route = doc.to_dict()
            break

        if not route:
            dispatcher.utter_message(text=f"Sorry, I couldn't find a route from {origin} to {destination}.")
            return []

        distance = route.get("distance")
        if not distance:
            dispatcher.utter_message(text="Route found, but distance information is missing.")
            return []

        # Query fares collection
        fare_ref = db.collection("fares").where("distance", "==", distance)
        fares = fare_ref.stream()

        fare = None
        for doc in fares:
            fare = doc.to_dict()
            break

        if fare:
            regular_fare = fare.get("regular", "unknown")
            discounted_fare = fare.get("discounted", "unknown")
            route_name = route.get("name", "jeepney route")
            dispatcher.utter_message(text=f"For {route_name} from {origin} to {destination}, the regular fare is ₱{regular_fare}, and the discounted fare is ₱{discounted_fare}.")
            return [SlotSet("FARE", str(discounted_fare))]
        else:
            dispatcher.utter_message(text=f"Sorry, I couldn't find fare information for a {distance}km route.")
            return []

class ActionFetchRouteToLocation(Action):
    def name(self) -> Text:
        return "action_fetch_route_to_location"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        origin = tracker.get_slot("ORIGIN") or "Legazpi Grand Central Terminal"
        location = tracker.get_slot("LOCATION")
        transport = tracker.get_slot("TRANSPORT") or "jeepney"
        route_name = tracker.get_slot("ROUTE")

        if not location:
            dispatcher.utter_message(text="Please specify a location.")
            return []

        # Query routes collection
        route_query = db.collection("routes").where("end", "==", location).where("isPrimary", "==", True)
        if route_name:
            route_query = db.collection("routes").where("name", "==", route_name)
        routes = route_query.stream()

        route = None
        for doc in routes:
            route = doc.to_dict()
            break

        if route:
            route_name = route.get("name", "unnamed route")
            landmarks = ", ".join(route.get("landmarks", [])) if route.get("landmarks") else "no landmarks specified"
            dispatcher.utter_message(text=f"To get to {location} from {origin} via {route_name}, take a jeepney. Landmarks: {landmarks}.")
            return [SlotSet("ROUTE", route_name)]
        else:
            dispatcher.utter_message(text=f"Sorry, I couldn't find a route to {location}.")
            return []
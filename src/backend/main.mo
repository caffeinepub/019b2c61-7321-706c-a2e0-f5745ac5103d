import Text "mo:core/Text";
import List "mo:core/List";
import Option "mo:core/Option";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Random "mo:core/Random";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import CalendarEvents "email-calendar-events/calendarEvents";
import EmailClient "email/emailClient";
import Uuid "email-calendar-events/uuid";

actor {
  // Type for user profile
  public type UserProfile = {
    name : Text;
    email : Text;
  };

  module UserProfile {
    public func compare(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      switch (Text.compare(profile1.name, profile2.name)) {
        case (#equal) { Text.compare(profile1.email, profile2.email) };
        case (order) { order };
      };
    };
  };

  // Type for event with owner information
  public type EventWithOwner = {
    event : CalendarEvents.CalendarEvent;
    owner : Principal;
  };

  // Authorization system state
  let accessControlState = AccessControl.initState();

  // Store user profiles
  var userProfiles = Map.empty<Principal, UserProfile>();

  // Store email addresses for uniqueness check
  var emails = Set.empty<Text>();

  // Store calendar events
  let calendarEvents = CalendarEvents.new();

  // Store event ownership mapping (event UID -> owner Principal)
  var eventOwners = Map.empty<Text, Principal>();

  // Initialize authorization (first caller becomes admin)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  // Get user role
  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  // Assign user role (admin only)
  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  // Check if caller is admin
  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // Get caller's user profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  // Get specific user's profile (admin or self only)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Save caller's user profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Register a new user (requires at least user permission)
  public shared ({ caller }) func registerUser(name : Text, email : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };

    // Check if user already exists
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User already registered");
    };

    // Check if email is already used
    if (emails.contains(email)) {
      Runtime.trap("Email already taken");
    };

    // Add user profile
    userProfiles.add(
      caller,
      {
        name;
        email;
      },
    );
    emails.add(email);
  };

  // Add a new calendar event (authenticated users only)
  public shared ({ caller }) func addCalendarEvent(summary : Text, description : Text, location : Text, startTimeMs : Nat64, endTimeMs : Nat64) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can add calendar events");
    };

    // Get organizer profile
    let organizer = switch (userProfiles.get(caller)) {
      case (?o) { o };
      case (null) { Runtime.trap("User profile not found. Please register first.") };
    };

    // Generate unique ID using random blob
    let seed = await Random.blob();
    let uid = Uuid.generateV4(seed);

    // Add calendar event
    if (
      calendarEvents.add(
        uid,
        summary,
        description,
        location,
        startTimeMs,
        endTimeMs,
        {
          name = ?organizer.name;
          email = organizer.email;
        },
        userProfiles.values().map(
          func({ name; email }) {
            {
              who = { name = ?name; email };
              role = #required;
            };
          }
        ).toArray(),
      ).isNull()
    ) {
      Runtime.trap("Failed to add calendar event");
    };

    // Store event ownership
    eventOwners.add(uid, caller);
  };

  // Update event details (owner or admin only)
  public shared ({ caller }) func updateEventDetails(uid : Text, summary : ?Text, description : ?Text, location : ?Text, startTimeMs : ?Nat64, endTimeMs : ?Nat64) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update calendar events");
    };

    // Check ownership
    let owner = switch (eventOwners.get(uid)) {
      case (?o) { o };
      case (null) { Runtime.trap("Event not found") };
    };

    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the event owner or admin can update this event");
    };

    if (
      calendarEvents.update(
        uid,
        summary,
        description,
        location,
        startTimeMs,
        endTimeMs,
        null,
        null,
      ).isNull()
    ) {
      Runtime.trap("Failed to update calendar event");
    };
  };

  // Add attendees to an event (owner or admin only)
  public shared ({ caller }) func addEventAttendees(uid : Text, attendees : [EmailClient.Attendee]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can add calendar event attendees");
    };

    // Check ownership
    let owner = switch (eventOwners.get(uid)) {
      case (?o) { o };
      case (null) { Runtime.trap("Event not found") };
    };

    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the event owner or admin can add attendees");
    };

    if (calendarEvents.addAttendees(uid, attendees).isNull()) {
      Runtime.trap("Failed to add attendees to calendar event");
    };
  };

  // Remove attendees from an event (owner or admin only)
  public shared ({ caller }) func removeEventAttendees(uid : Text, attendees : [Text]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can remove calendar event attendees");
    };

    // Check ownership
    let owner = switch (eventOwners.get(uid)) {
      case (?o) { o };
      case (null) { Runtime.trap("Event not found") };
    };

    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the event owner or admin can remove attendees");
    };

    if (calendarEvents.removeAttendees(uid, attendees).isNull()) {
      Runtime.trap("Failed to remove attendees from calendar event");
    };
  };

  // Cancel an event (owner or admin only)
  public shared ({ caller }) func cancelEvent(uid : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can cancel calendar events");
    };

    // Check ownership
    let owner = switch (eventOwners.get(uid)) {
      case (?o) { o };
      case (null) { Runtime.trap("Event not found") };
    };

    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the event owner or admin can cancel this event");
    };

    if (calendarEvents.cancel(uid).isNull()) {
      Runtime.trap("Failed to cancel calendar event");
    };
  };

  // List all events for the caller (users see their own, admins see all)
  public shared query ({ caller }) func listEvents() : async [CalendarEvents.CalendarEvent] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can list calendar events");
    };

    // Admins can see all events
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return calendarEvents.iter().toArray();
    };

    // Regular users see only their own events
    calendarEvents.iter().filter(
      func(event : CalendarEvents.CalendarEvent) : Bool {
        switch (eventOwners.get(event.uid)) {
          case (?owner) { owner == caller };
          case (null) { false };
        };
      }
    ).toArray();
  };

  // Delete an event (owner or admin only)
  public shared ({ caller }) func deleteEvent(uid : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can delete calendar events");
    };

    // Check ownership
    let owner = switch (eventOwners.get(uid)) {
      case (?o) { o };
      case (null) { Runtime.trap("Event not found") };
    };

    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the event owner or admin can delete this event");
    };

    calendarEvents.delete(uid);
    eventOwners.remove(uid);
  };

  // Send event invitation (owner or admin only)
  public shared ({ caller }) func sendEventInvitation(uid : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can send calendar event invitations");
    };

    // Check ownership
    let owner = switch (eventOwners.get(uid)) {
      case (?o) { o };
      case (null) { Runtime.trap("Event not found") };
    };

    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the event owner or admin can send invitations for this event");
    };

    // Get event details
    let event = switch (calendarEvents.get(uid)) {
      case (?e) { e };
      case (null) { Runtime.trap("Calendar event not found") };
    };

    // Send invitation email
    let result = await EmailClient.sendCalendarEvent(
      "no-reply",
      event,
    );
  };
};

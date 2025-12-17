import Map "mo:core/Map";
import Set "mo:core/Set";
import AccessControl "authorization/access-control";
import CalendarEvents "email-calendar-events/calendarEvents";

module {
  // Old system before migration without getIntegrationsCanisterId function
  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, { name : Text; email : Text }>;
    emails : Set.Set<Text>;
    calendarEvents : CalendarEvents.State;
    eventOwners : Map.Map<Text, Principal>;
  };

  // New actor with getIntegrationsCanisterId function
  type NewActor = OldActor;

  // Migration function to transform old system to new system
  public func run(old : OldActor) : NewActor {
    old;
  };
};

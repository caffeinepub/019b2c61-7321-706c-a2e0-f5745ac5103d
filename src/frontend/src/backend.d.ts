import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Attendee {
    who: Mailbox;
    role: CalendarEventRole;
}
export interface CalendarEvent {
    uid: string;
    startTime: bigint;
    method: CalendarEventMethod;
    organizer: Mailbox;
    endTime: bigint;
    description: string;
    summary: string;
    attendees: Array<Attendee>;
    location: string;
    sequence: number;
}
export interface Mailbox {
    name?: string;
    email: string;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum CalendarEventMethod {
    request = "request",
    publish = "publish",
    cancel = "cancel"
}
export enum CalendarEventRole {
    optional = "optional",
    notParticipating = "notParticipating",
    chair = "chair",
    required = "required"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCalendarEvent(summary: string, description: string, location: string, startTimeMs: bigint, endTimeMs: bigint): Promise<void>;
    addEventAttendees(uid: string, attendees: Array<Attendee>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelEvent(uid: string): Promise<void>;
    deleteEvent(uid: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listEvents(): Promise<Array<CalendarEvent>>;
    registerUser(name: string, email: string): Promise<void>;
    removeEventAttendees(uid: string, attendees: Array<string>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendEventInvitation(uid: string): Promise<void>;
    updateEventDetails(uid: string, summary: string | null, description: string | null, location: string | null, startTimeMs: bigint | null, endTimeMs: bigint | null): Promise<void>;
}

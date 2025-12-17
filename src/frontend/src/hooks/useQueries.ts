import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, CalendarEvent, Attendee } from '../backend';
import { toast } from 'sonner';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });
}

export function useListEvents() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CalendarEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listEvents();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddCalendarEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      summary: string;
      description: string;
      location: string;
      startTimeMs: bigint;
      endTimeMs: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCalendarEvent(
        params.summary,
        params.description,
        params.location,
        params.startTimeMs,
        params.endTimeMs
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create event');
    },
  });
}

export function useUpdateEventDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      uid: string;
      summary: string | null;
      description: string | null;
      location: string | null;
      startTimeMs: bigint | null;
      endTimeMs: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateEventDetails(
        params.uid,
        params.summary,
        params.description,
        params.location,
        params.startTimeMs,
        params.endTimeMs
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update event');
    },
  });
}

export function useDeleteEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uid: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteEvent(uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete event');
    },
  });
}

export function useAddEventAttendees() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { uid: string; attendees: Attendee[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addEventAttendees(params.uid, params.attendees);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Attendees added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add attendees');
    },
  });
}

export function useRemoveEventAttendees() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { uid: string; attendees: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeEventAttendees(params.uid, params.attendees);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Attendees removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove attendees');
    },
  });
}

export function useSendEventInvitation() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (uid: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendEventInvitation(uid);
    },
    onSuccess: () => {
      toast.success('Invitations sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitations');
    },
  });
}

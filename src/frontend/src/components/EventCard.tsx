import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Mail, Trash2, Edit, Users } from 'lucide-react';
import type { CalendarEvent } from '../backend';
import { useDeleteEvent, useSendEventInvitation } from '../hooks/useQueries';
import EditEventDialog from './EditEventDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EventCardProps {
  event: CalendarEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteEvent = useDeleteEvent();
  const sendInvitation = useSendEventInvitation();

  const startDate = new Date(Number(event.startTime));
  const endDate = new Date(Number(event.endTime));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleDelete = () => {
    deleteEvent.mutate(event.uid);
    setIsDeleteDialogOpen(false);
  };

  const handleSendInvitation = () => {
    sendInvitation.mutate(event.uid);
  };

  return (
    <>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{event.summary}</CardTitle>
            <Badge variant={event.method === 'cancel' ? 'destructive' : 'default'}>
              {event.method}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(startDate)} - {formatTime(endDate)}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendInvitation}
              disabled={sendInvitation.isPending}
            >
              <Mail className="mr-1 h-4 w-4" />
              {sendInvitation.isPending ? 'Sending...' : 'Send'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditEventDialog
        event={event}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.summary}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

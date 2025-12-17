import { useState, useEffect } from 'react';
import { useUpdateEventDetails, useAddEventAttendees, useRemoveEventAttendees } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { CalendarEvent, Attendee } from '../backend';
import { CalendarEventRole } from '../backend';

interface EditEventDialogProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newAttendeeName, setNewAttendeeName] = useState('');

  const updateEvent = useUpdateEventDetails();
  const addAttendees = useAddEventAttendees();
  const removeAttendees = useRemoveEventAttendees();

  useEffect(() => {
    if (event) {
      setTitle(event.summary);
      setDescription(event.description);
      setLocation(event.location);

      const startDate = new Date(Number(event.startTime));
      const endDate = new Date(Number(event.endTime));

      setDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toTimeString().slice(0, 5));
      setEndTime(endDate.toTimeString().slice(0, 5));
    }
  }, [event]);

  const handleUpdateDetails = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date || !startTime || !endTime) {
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    updateEvent.mutate(
      {
        uid: event.uid,
        summary: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startTimeMs: BigInt(startDateTime.getTime()),
        endTimeMs: BigInt(endDateTime.getTime()),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleAddAttendee = () => {
    if (!newAttendeeEmail.trim()) return;

    const newAttendee: Attendee = {
      who: {
        email: newAttendeeEmail.trim(),
        name: newAttendeeName.trim() || undefined,
      },
      role: CalendarEventRole.required,
    };

    addAttendees.mutate(
      { uid: event.uid, attendees: [newAttendee] },
      {
        onSuccess: () => {
          setNewAttendeeEmail('');
          setNewAttendeeName('');
        },
      }
    );
  };

  const handleRemoveAttendee = (email: string) => {
    removeAttendees.mutate({ uid: event.uid, attendees: [email] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event details or manage attendees.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Event Details</TabsTrigger>
            <TabsTrigger value="attendees">Attendees ({event.attendees.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleUpdateDetails} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="Team Meeting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Discuss project updates and next steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  placeholder="Conference Room A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time *</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time *</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateEvent.isPending || !title.trim() || !date || !startTime || !endTime}
                >
                  {updateEvent.isPending ? 'Updating...' : 'Update Event'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="attendees" className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold">Add Attendee</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="attendee-email">Email *</Label>
                    <Input
                      id="attendee-email"
                      type="email"
                      placeholder="attendee@example.com"
                      value={newAttendeeEmail}
                      onChange={(e) => setNewAttendeeEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendee-name">Name (optional)</Label>
                    <Input
                      id="attendee-name"
                      placeholder="John Doe"
                      value={newAttendeeName}
                      onChange={(e) => setNewAttendeeName(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddAttendee}
                    disabled={addAttendees.isPending || !newAttendeeEmail.trim()}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {addAttendees.isPending ? 'Adding...' : 'Add Attendee'}
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold">Current Attendees</h4>
                <div className="space-y-2">
                  {event.attendees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attendees yet.</p>
                  ) : (
                    event.attendees.map((attendee, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{attendee.who.name || attendee.who.email}</p>
                          {attendee.who.name && (
                            <p className="text-sm text-muted-foreground">{attendee.who.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{attendee.role}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAttendee(attendee.who.email)}
                            disabled={removeAttendees.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

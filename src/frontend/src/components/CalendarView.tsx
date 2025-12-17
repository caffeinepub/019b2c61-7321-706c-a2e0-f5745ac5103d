import { useState, useMemo } from 'react';
import { useListEvents } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import EventCard from './EventCard';
import CreateEventDialog from './CreateEventDialog';
import type { CalendarEvent } from '../backend';

export default function CalendarView() {
  const { data: events = [], isLoading } = useListEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const calendarDays: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const eventsMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const eventDate = new Date(Number(event.startTime));
      const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return eventsMap.get(dateKey) || [];
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-foreground">{monthName}</h2>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Create Event
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-sm font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isTodayDate = isToday(date);
              const isCurrentMonthDate = isCurrentMonth(date);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] rounded-lg border p-2 transition-colors ${
                    isTodayDate
                      ? 'border-primary bg-primary/5'
                      : isCurrentMonthDate
                      ? 'border-border bg-card hover:bg-accent/50'
                      : 'border-border/50 bg-muted/20'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isTodayDate
                          ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'
                          : isCurrentMonthDate
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.uid}
                        className="cursor-pointer truncate rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                        onClick={() => setSelectedDate(date)}
                      >
                        {event.summary}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <div className="mt-8">
          <h3 className="mb-4 text-2xl font-bold text-foreground">
            Events for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getEventsForDate(selectedDate).map((event) => (
              <EventCard key={event.uid} event={event} />
            ))}
          </div>
        </div>
      )}

      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

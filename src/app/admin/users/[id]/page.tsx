
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar as BigCalendar, Views, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getUserProfileAction } from "@/lib/actions/getUserProfileAction";
import { UserProfile } from "@/lib/actions/getUserProfileAction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { UserExamStatus } from "@/models/examStatus";
import { MatchStatus } from "@/models/match";

const localizer = momentLocalizer(moment);

const UserProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfileAction(id as string);
        setProfile(data);
        
        // Convert schedule to calendar events if available
        if (data?.schedule) {
          const events = convertScheduleToEvents(data.schedule);
          setCalendarEvents(events);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  // Convert schedule to events for react-big-calendar
  const convertScheduleToEvents = (schedule: any) => {
    const events: any[] = [];
    
    // Create a base date for the week (using Sunday as reference)
    const baseDate = new Date();
    // Set to the beginning of the current week (Sunday)
    baseDate.setDate(baseDate.getDate() - baseDate.getDay());
    baseDate.setHours(0, 0, 0, 0);

    // Day mapping
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    // Add availability events
    Object.entries(schedule).forEach(([dayName, daySchedule]: [string, any]) => {
      // Get the day number for this day name
      const dayNumber = dayMap[dayName];
      
      daySchedule.intervals.forEach((interval: any, intervalIndex: number) => {
        // Create a new date for this specific day of the week
        const eventDate = new Date(baseDate);
        // Set to the correct day of the week
        eventDate.setDate(baseDate.getDate() + dayNumber);

        const [startHour, startMinute] = interval.start.split(":").map(Number);
        const [endHour, endMinute] = interval.end.split(":").map(Number);

        // Create start and end dates
        const start = new Date(eventDate);
        start.setHours(startHour, startMinute, 0, 0);

        const end = new Date(eventDate);
        end.setHours(endHour, endMinute, 0, 0);

        events.push({
          id: `${dayName}-${intervalIndex}`,
          title: "Available",
          start,
          end,
          allDay: false,
        });
      });
    });

    return events;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading user profile...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="flex justify-center items-center min-h-screen">User not found</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case UserExamStatus.NOT_STARTED:
        return <Badge variant="outline">Not Started</Badge>;
      case UserExamStatus.IN_PROGRESS:
        return <Badge variant="secondary">In Progress</Badge>;
      case UserExamStatus.FINISHED:
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPairingStatusBadge = (status: string) => {
    switch (status) {
      case MatchStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>;
      case MatchStatus.ACCEPTED:
        return <Badge variant="secondary">Accepted</Badge>;
      case MatchStatus.ONGOING:
        return <Badge variant="default">Ongoing</Badge>;
      case MatchStatus.COMPLETED:
        return <Badge variant="default">Completed</Badge>;
      case MatchStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case MatchStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* User Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{profile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{profile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{profile.type.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Onboarded:</span>
                    <span className="font-medium">{profile.onboarded ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="schedule">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="pairings">Pairings</TabsTrigger>
          </TabsList>
          
          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {calendarEvents.length > 0 ? (
                  <div className="h-[600px]">
                    <BigCalendar
                      localizer={localizer}
                      events={calendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                      defaultView={Views.WEEK}
                      views={[Views.WEEK]}
                      step={60}
                      showMultiDayTimes
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No schedule available for this user.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Exams Tab */}
          <TabsContent value="exams" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Exam History</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.exams && profile.exams.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profile.exams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.name}</TableCell>
                          <TableCell>{exam.type}</TableCell>
                          <TableCell>{getStatusBadge(exam.status)}</TableCell>
                          <TableCell>
                            {exam.score !== undefined && exam.maxScore !== undefined
                              ? `${exam.score}/${exam.maxScore}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {exam.completedAt
                              ? new Date(exam.completedAt).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No exam history available for this user.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Pairings Tab */}
          <TabsContent value="pairings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pairings</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.pairings && profile.pairings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profile.pairings.map((pairing) => (
                        <TableRow key={pairing.id}>
                          <TableCell className="font-medium">{pairing.partnerName}</TableCell>
                          <TableCell>{pairing.partnerEmail}</TableCell>
                          <TableCell>{pairing.subject}</TableCell>
                          <TableCell>{getPairingStatusBadge(pairing.status)}</TableCell>
                          <TableCell>
                            {new Date(pairing.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pairings available for this user.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfilePage;
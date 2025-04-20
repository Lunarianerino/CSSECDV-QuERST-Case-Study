export interface TimeInterval {
  start: string;
  end: string;
  assignment?: string | {
    _id: string;
    name: string;
    email: string;
    type: string;
  }; // ObjectId reference to Account model that gets populated, optional (null/undefined means available)
}

export interface DaySchedule {
  intervals: TimeInterval[];
}

export interface WeeklySchedule {
  sunday: DaySchedule;
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
}

export interface Appointment {
  id: string;
  title: string;
  start: string;
  end: string;
}
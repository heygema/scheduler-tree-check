import createIntervalTree from 'npm:interval-tree-1d';

let existingSchedule = {
  id: 'cmbg4c64x0002xeppp6yobcl8',
  startDate: '2025-06-02 17:00:00',
  endDate: '2026-06-02 16:59:59.999',
  startHour: '00:00',
  endHour: '04:30',
  repeatFrequency: 'NONE',
  monday: false,
  tuesday: false,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
  notes: '',
  color: '#4C31A3',
  deletedDates: [
    // '2025-06-05T00:00:00.000Z',
    '2025-07-01T00:00:00.000Z',
    '2025-07-22T00:00:00.000Z',
    '2025-08-19T00:00:00.000Z',
    '2025-09-16T00:00:00.000Z',
  ],
  deleted: false,
  createdAt: '2025-06-03 06:09:20.913',
  updatedAt: '2025-06-03 06:09:20.913',
};

let newSchedule = {
  id: 'cmbg9wjd1000010o2qhu8lrgt',
  startDate: '2025-06-05 17:00:00',
  endDate: '2025-06-06 16:59:59.999',
  startHour: '01:00',
  endHour: '03:00',
  repeatFrequency: 'NONE',
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: true,
  saturday: false,
  sunday: false,
  notes: '',
  color: 'blue',
  deletedDates: [],
  deleted: false,
  createdAt: '2025-06-03 08:45:09.253',
  updatedAt: '2025-06-03 08:45:09.253',
};

function parseTimeToMinutes(timeStr: string) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
const dayMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function scheduleToTimeRanges(schedule: typeof existingSchedule) {
  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
  const startHourMinutes = parseTimeToMinutes(schedule.startHour);
  const endHourMinutes = parseTimeToMinutes(schedule.endHour);

  // Use the global dayMap

  // Get active days
  const activeDays = Object.keys(dayMap).filter(
    (day) => schedule[day as keyof typeof schedule]
  );

  const activeDayNumbers = activeDays.map((day) => dayMap[day]);

  // Set of deleted dates (in ISO format for easy comparison)
  const deletedDates = new Set(
    (schedule.deletedDates || []).map(
      (date) => new Date(date).toISOString().split('T')[0]
    )
  );

  // Generate all time ranges
  const timeRanges: Array<Array<number>> = [];

  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    // bcs utc
    const dayOfWeek = date.getDay() + 1;

    // Skip if not an active day
    if (!activeDayNumbers.includes(dayOfWeek)) {
      continue;
    }

    // Skip if this date is deleted
    const dateIso = date.toISOString().split('T')[0];
    if (deletedDates.has(dateIso)) {
      continue;
    }

    // Create time range for this day
    const dayStart = new Date(date);
    dayStart.setHours(
      Math.floor(startHourMinutes / 60),
      startHourMinutes % 60,
      0,
      0
    );

    const dayEnd = new Date(date);
    dayEnd.setHours(Math.floor(endHourMinutes / 60), endHourMinutes % 60, 0, 0);

    // Add as unix timestamps
    timeRanges.push([dayStart.getTime(), dayEnd.getTime()]);
  }

  return timeRanges;
}

async function checker() {
  // const start = process.hrtime.bigint();
  const timeRanges = scheduleToTimeRanges(existingSchedule);
  const newTimeRanges = scheduleToTimeRanges(newSchedule);
  const tree = createIntervalTree(timeRanges);

  console.log('Schedule 3 time ranges:', newTimeRanges);
  if (newTimeRanges.length > 0) {
    for (let [start, end] of newTimeRanges) {
      let overlapStart = false;
      let overlapEnd = false;
      console.log(
        `Time range: ${new Date(start).toLocaleString()} to ${new Date(
          end
        ).toLocaleString()}`
      );

      tree.queryPoint(start, function (interval) {
        console.log('overlapped start ?', interval);
        overlapStart = true;
      });

      tree.queryPoint(end, function (interval) {
        console.log('overlapped end ?', interval);
        overlapEnd = true;
      });

      if (overlapStart || overlapEnd) {
        console.log('Overlap found!', { overlapStart, overlapEnd });
      }
    }
  } else {
    console.log('No time ranges generated for schedule3');
    console.log('Schedule3 details:', {
      startDate: newSchedule.startDate,
      endDate: newSchedule.endDate,
      startHour: newSchedule.startHour,
      endHour: newSchedule.endHour,
      activeDays: Object.keys(dayMap).filter(
        (day) => newSchedule[day as keyof typeof newSchedule]
      ),
    });
  }

  // const end = process.hrtime.bigint();
  // console.log(`Took ${(end - start) / 1000n}ms`);
}

async function main() {
  const start = process.hrtime.bigint();
  checker();
  const end = process.hrtime.bigint();
  console.log(`Took ${(end - start) / 1000n}ms`);
}

main().catch(console.error);

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { date } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Schedule from Indianapolis to West Lafayette
    // 7am, 9am, 11am, 1pm, 3pm, 5pm, 7pm, 9:30pm
    const indyToWLTimes = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:30'];

    // Schedule from West Lafayette to Indianapolis
    // 6:40am, 9am, 11am, 1pm, 3pm, 5:10pm, 7:10pm, 9:40pm
    const wlToIndyTimes = ['06:40', '09:00', '11:00', '13:00', '15:00', '17:10', '19:10', '21:40'];

    const rides = [];

    // Indianapolis coordinates: (39.773038, -86.169873)
    const indyCoords = '(39.773038,-86.169873)';

    // West Lafayette coordinates: (40.4240615, -86.912087)
    const wlCoords = '(40.4240615,-86.912087)';

    // Create rides from Indianapolis to West Lafayette
    for (const time of indyToWLTimes) {
      rides.push({
        departure_time: `${date}T${time}:00-05:00`, // EST timezone
        origin: 'Indianapolis',
        destination: 'West Lafayette',
        origin_coords: indyCoords,
        destination_coords: wlCoords,
        capacity: 48,
        booked_seats: 0,
        status: 'scheduled'
      });
    }

    // Create rides from West Lafayette to Indianapolis
    for (const time of wlToIndyTimes) {
      rides.push({
        departure_time: `${date}T${time}:00-05:00`, // EST timezone
        origin: 'West Lafayette',
        destination: 'Indianapolis',
        origin_coords: wlCoords,
        destination_coords: indyCoords,
        capacity: 48,
        booked_seats: 0,
        status: 'scheduled'
      });
    }

    // Insert all rides
    const { data, error } = await supabase
      .from('shuttle_rides')
      .insert(rides)
      .select();

    if (error) {
      console.error('Error seeding rides:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      rides: data
    });

  } catch (error: any) {
    console.error('Error in seed route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed rides' },
      { status: 500 }
    );
  }
}

// GET endpoint to seed rides for today and next 7 days
export async function GET() {
  try {
    const supabase = await createClient();
    const today = new Date();
    const results = [];

    // Coordinates
    const indyCoords = '(39.773038,-86.169873)';
    const wlCoords = '(40.4240615,-86.912087)';

    // Schedules
    const indyToWLTimes = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:30'];
    const wlToIndyTimes = ['06:40', '09:00', '11:00', '13:00', '15:00', '17:10', '19:10', '21:40'];

    // Seed for next 7 days
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateString = targetDate.toISOString().split('T')[0];

      // Check if rides already exist for this date
      const { data: existing } = await supabase
        .from('shuttle_rides')
        .select('id')
        .gte('departure_time', `${dateString}T00:00:00`)
        .lte('departure_time', `${dateString}T23:59:59`)
        .limit(1);

      if (existing && existing.length > 0) {
        results.push({ date: dateString, status: 'already exists' });
        continue;
      }

      // Create rides for this date
      const rides = [];

      // Indianapolis to West Lafayette
      for (const time of indyToWLTimes) {
        rides.push({
          departure_time: `${dateString}T${time}:00-05:00`,
          origin: 'Indianapolis',
          destination: 'West Lafayette',
          origin_coords: indyCoords,
          destination_coords: wlCoords,
          capacity: 48,
          booked_seats: 0,
          status: 'scheduled'
        });
      }

      // West Lafayette to Indianapolis
      for (const time of wlToIndyTimes) {
        rides.push({
          departure_time: `${dateString}T${time}:00-05:00`,
          origin: 'West Lafayette',
          destination: 'Indianapolis',
          origin_coords: wlCoords,
          destination_coords: indyCoords,
          capacity: 48,
          booked_seats: 0,
          status: 'scheduled'
        });
      }

      // Insert rides
      const { data, error } = await supabase
        .from('shuttle_rides')
        .insert(rides)
        .select();

      if (error) {
        results.push({ date: dateString, status: 'error', error: error.message });
      } else {
        results.push({ date: dateString, status: 'created', count: data.length });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('Error in seed GET route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed rides' },
      { status: 500 }
    );
  }
}

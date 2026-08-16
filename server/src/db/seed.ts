import bcrypt from 'bcryptjs';
import { query } from './index';
import { runMigrations } from './migrate';
import { UserRole } from '../types/index';

export async function seedDatabase() {
  console.log('🌱 Seeding database with initial accounts, AICTE categories, events, and sample points...');
  await runMigrations();

  // Reset dynamic membership, registration, attendance, and dynamic activities for clean state
  await query(`DELETE FROM event_attendance;`);
  await query(`DELETE FROM event_registrations;`);
  await query(`DELETE FROM club_memberships;`);
  await query(`DELETE FROM student_activities WHERE id NOT IN ('act_001', 'act_002', 'act_003', 'act_004', 'act_005');`);
  await query(`UPDATE club_events SET attendance_confirmed = FALSE;`);

  const saltRounds = 10;


  // Seed Users
  const defaultUsers = [
    {
      id: 'usr_super_admin_001',
      email: 'admin@college.edu',
      password: 'AdminPassword123!',
      full_name: 'System Administrator',
      role: UserRole.SUPER_ADMIN,
      department: 'IT & Administration',
    },
    {
      id: 'usr_club_lead_001',
      email: 'club.robotics@college.edu',
      password: 'ClubPassword123!',
      full_name: 'Robotics Club Lead',
      role: UserRole.CLUB,
      department: 'Student Activities',
    },
    {
      id: 'usr_tnp_head_001',
      email: 'tnp.head@college.edu',
      password: 'TnpPassword123!',
      full_name: 'Training & Placement Officer',
      role: UserRole.TNP,
      department: 'Career Services',
    },
    {
      id: 'usr_student_001',
      email: 'student.alex@college.edu',
      password: 'StudentPassword123!',
      full_name: 'Alex Morgan',
      role: UserRole.STUDENT,
      department: 'Computer Science',
    },
  ];

  for (const u of defaultUsers) {
    const hash = await bcrypt.hash(u.password, saltRounds);

    await query(
      `
      INSERT INTO users (id, email, password_hash, full_name, role, department)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department;
    `,
      [u.id, u.email, hash, u.full_name, u.role, u.department]
    );

    console.log(`👤 Seeded user: ${u.email} [Role: ${u.role}]`);
  }

  // Seed AICTE Categories
  const categories = [
    {
      id: 'cat_tech',
      name: 'Technical & Innovation Activities',
      max_points: 40,
      min_points: 10,
      description: 'Hackathons, coding contests, paper presentations, and technical workshops.',
    },
    {
      id: 'cat_sports',
      name: 'Sports & Games',
      max_points: 30,
      min_points: 10,
      description: 'Inter-college tournaments, athletics, yoga, and physical fitness meets.',
    },
    {
      id: 'cat_community',
      name: 'Community Service & NSS',
      max_points: 30,
      min_points: 10,
      description: 'Blood donation camps, environmental drives, and social service initiatives.',
    },
    {
      id: 'cat_leadership',
      name: 'Leadership & Management',
      max_points: 20,
      min_points: 5,
      description: 'Club executive roles, fest coordinators, and student council activities.',
    },
    {
      id: 'cat_internship',
      name: 'Industrial Internships & Training',
      max_points: 40,
      min_points: 20,
      description: 'Verified corporate internships, industrial visits, and placement training.',
    },
    {
      id: 'cat_club_event',
      name: 'Club Events',
      max_points: 40,
      min_points: 10,
      description: 'Attendance and participation in verified club events.',
    },
  ];

  for (const c of categories) {
    await query(
      `
      INSERT INTO categories (id, name, max_points, min_points, description)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        max_points = EXCLUDED.max_points,
        min_points = EXCLUDED.min_points,
        description = EXCLUDED.description;
    `,
      [c.id, c.name, c.max_points, c.min_points, c.description]
    );
  }
  console.log('🏷️ Seeded AICTE Point Categories');

  // Seed Events
  const sampleEvents = [
    {
      id: 'evt_hackathon_2026',
      title: 'National College Tech Hackathon 2026',
      description: '24-hour hackathon creating innovative solutions for real-world problems.',
      category_id: 'cat_tech',
      points: 20,
      event_date: '2026-09-15',
      location: 'Main Auditorium & Innovation Lab',
      organizer_id: 'usr_club_lead_001',
      organizer_name: 'Robotics Club Lead',
      status: 'ACTIVE',
    },
    {
      id: 'evt_robotics_ws',
      title: 'Autonomous Robotics & IoT Workshop',
      description: 'Hands-on training session building autonomous micro-rover robots.',
      category_id: 'cat_tech',
      points: 15,
      event_date: '2026-08-20',
      location: 'Electronics Lab 3',
      organizer_id: 'usr_club_lead_001',
      organizer_name: 'Robotics Club Lead',
      status: 'ACTIVE',
    },
    {
      id: 'evt_blood_drive',
      title: 'Annual NSS Campus Blood Donation Drive',
      description: 'Community health initiative in collaboration with Red Cross Society.',
      category_id: 'cat_community',
      points: 15,
      event_date: '2026-07-10',
      location: 'College Health Centre',
      organizer_id: 'usr_super_admin_001',
      organizer_name: 'System Administrator',
      status: 'COMPLETED',
    },
  ];

  for (const e of sampleEvents) {
    await query(
      `
      INSERT INTO events (id, title, description, category_id, points, event_date, location, organizer_id, organizer_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        points = EXCLUDED.points,
        status = EXCLUDED.status;
    `,
      [e.id, e.title, e.description, e.category_id, e.points, e.event_date, e.location, e.organizer_id, e.organizer_name, e.status]
    );
  }
  console.log('📅 Seeded Sample College Events');

  // Seed Sample Student Activity Claims for Alex Morgan
  const sampleActivities = [
    {
      id: 'act_001',
      student_id: 'usr_student_001',
      student_name: 'Alex Morgan',
      event_id: 'evt_hackathon_2026',
      category_id: 'cat_tech',
      title: 'National College Tech Hackathon 2026 - 1st Runner Up',
      points_requested: 20,
      points_awarded: 20,
      proof_details: 'Certificate of merit issued by Robotics Club & Hackathon Committee.',
      status: 'APPROVED',
      reviewed_by: 'usr_club_lead_001',
      reviewer_role: 'CLUB',
      target_type: 'CLUB',
      target_club_id: 'club_robotics_001',
    },
    {
      id: 'act_002',
      student_id: 'usr_student_001',
      student_name: 'Alex Morgan',
      event_id: 'evt_robotics_ws',
      category_id: 'cat_tech',
      title: 'Autonomous Robotics Workshop Participant',
      points_requested: 15,
      points_awarded: 15,
      proof_details: 'Attendance verified by workshop lead.',
      status: 'APPROVED',
      reviewed_by: 'usr_club_lead_001',
      reviewer_role: 'CLUB',
      target_type: 'CLUB',
      target_club_id: 'club_robotics_001',
    },
    {
      id: 'act_003',
      student_id: 'usr_student_001',
      student_name: 'Alex Morgan',
      event_id: null,
      category_id: 'cat_internship',
      title: 'Summer Software Engineering Internship (8 Weeks)',
      points_requested: 40,
      points_awarded: 40,
      proof_details: 'Offer letter, completion certificate, and TNP appraisal report from TechCorp.',
      status: 'APPROVED',
      reviewed_by: 'usr_tnp_head_001',
      reviewer_role: 'TNP',
      target_type: 'TNP',
      target_club_id: null,
    },
    {
      id: 'act_004',
      student_id: 'usr_student_001',
      student_name: 'Alex Morgan',
      event_id: 'evt_blood_drive',
      category_id: 'cat_community',
      title: 'NSS Blood Donation Camp Volunteer',
      points_requested: 15,
      points_awarded: 15,
      proof_details: 'Red Cross Donor Card #RC-2026-8819.',
      status: 'APPROVED',
      reviewed_by: 'usr_super_admin_001',
      reviewer_role: 'SUPER_ADMIN',
      target_type: 'TNP',
      target_club_id: null,
    },
    {
      id: 'act_005',
      student_id: 'usr_student_001',
      student_name: 'Alex Morgan',
      event_id: null,
      category_id: 'cat_sports',
      title: 'Inter-College Chess Tournament Participation',
      points_requested: 10,
      points_awarded: 0,
      proof_details: 'Tournament registration receipt attached.',
      status: 'PENDING',
      reviewed_by: null,
      reviewer_role: null,
      target_type: 'CLUB',
      target_club_id: 'club_robotics_001',
    },
  ];

  for (const a of sampleActivities) {
    await query(
      `
      INSERT INTO student_activities (id, student_id, student_name, event_id, category_id, title, points_requested, points_awarded, proof_details, status, reviewed_by, reviewer_role, target_type, target_club_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        points_awarded = EXCLUDED.points_awarded,
        status = EXCLUDED.status,
        target_type = EXCLUDED.target_type,
        target_club_id = EXCLUDED.target_club_id;
    `,
      [a.id, a.student_id, a.student_name, a.event_id, a.category_id, a.title, a.points_requested, a.points_awarded, a.proof_details, a.status, a.reviewed_by, a.reviewer_role, a.target_type, a.target_club_id]
    );
  }
  console.log('🏆 Seeded Sample Student Activity Points (Alex Morgan: 90/100 points accumulated)');

  // Seed Approved Club for Alex's college
  await query(
    `
    INSERT INTO clubs (id, name, description, administrator_user_id, status)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      status = EXCLUDED.status;
  `,
    [
      'club_robotics_001',
      'Robotics & Automation Club',
      'Official robotics, IoT, and embedded systems engineering club.',
      'usr_club_lead_001',
      'APPROVED',
    ]
  );
  console.log('🏛️ Seeded Approved Club: Robotics & Automation Club');

  // Seed Sample Club Events (Fixed-point system)
  const sampleClubEvents = [
    {
      id: 'cevt_001',
      club_id: 'club_robotics_001',
      title: 'Autonomous Rover Challenge 2026',
      description: 'Design and race obstacle-avoiding autonomous mini-rovers. Hardware components provided on spot.',
      event_date: '2026-09-10',
      start_time: '10:00 AM',
      end_time: '04:00 PM',
      venue: 'Robotics Innovation Arena (Lab 4)',
      points: 20,
      status: 'UPCOMING',
    },
    {
      id: 'cevt_002',
      club_id: 'club_robotics_001',
      title: 'Hands-on Drone Aerodynamics Bootcamp',
      description: 'Comprehensive quadcopter assembly, calibration, and PID controller tuning workshop.',
      event_date: '2026-09-24',
      start_time: '02:00 PM',
      end_time: '06:00 PM',
      venue: 'Main College Ground & Tinkering Shed',
      points: 15,
      status: 'UPCOMING',
    },
  ];

  for (const ce of sampleClubEvents) {
    await query(
      `
      INSERT INTO club_events (id, club_id, title, description, event_date, start_time, end_time, venue, points, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        event_date = EXCLUDED.event_date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        venue = EXCLUDED.venue,
        points = EXCLUDED.points,
        status = EXCLUDED.status;
    `,
      [ce.id, ce.club_id, ce.title, ce.description, ce.event_date, ce.start_time, ce.end_time, ce.venue, ce.points, ce.status]
    );
  }
  console.log('🎯 Seeded Sample Fixed-Point Club Events');

  console.log('✅ Database seeding complete.');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

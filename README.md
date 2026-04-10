# HealthSync (React Admin)

Simple admin panel layout with a fixed sidebar menu:

- Dashboard
- Doctors
- Patients
- Appointments
- Billing
- Reports
- Settings

## Run

```bash
npm install
npm run dev
```

## Backend API

```bash
cd backend-medical
npm install
npm run dev
```

- `GET /api/dashboard/stats` → `{ status: "success", data: { totalDoctors, totalPatients, totalAppointmentsToday, totalRevenue } }`



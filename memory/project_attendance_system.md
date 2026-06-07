---
name: attendance-system-project
description: Full MERN attendance system built for user - location-based attendance, admin panel, employee dashboard
metadata:
  type: project
---

User ne ek complete attendance management system banwaya hai MERN stack pe.

**Why:** Business requirement - office attendance track karna with GPS location verification

**How to apply:** Agar user is project me koi changes manga to remember karna ye complete system hai

## Project Location
`c:\Users\abC\Desktop\claude  attandance`

## Structure
- `backend/` - Node.js + Express + MongoDB API (port 5000)
- `frontend/` - React + Tailwind CSS (port 3000)

## Key Features Built
1. Location-based punch in/out (50m radius, Haversine formula)
2. Admin panel: Employees CRUD, Locations, Attendance edit, Salary calculation, Leave approval
3. Employee dashboard: Calendar (Red=absent, Yellow=half-day, Green=present, Gray=weekoff, Blue=leave), Punch in/out
4. Half-day logic: Late >15min from shift start = half day; early punch out = half day
5. 5 hour minimum before punch out
6. Multiple punch in/out per day allowed
7. 4 paid leaves per month, beyond = unpaid
8. Week offs are paid days
9. Salary = (present + half*0.5 + weekoffs + paid_leaves) * daily_rate

## Default Admin Login
Email: admin@company.com
Password: Admin@123
(Created via `npm run seed` in backend folder)

## Setup Commands
```
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm start
```

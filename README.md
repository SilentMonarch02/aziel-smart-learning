# AZIEL SMART LEARNING – school website

Static website (GitHub Pages) + Supabase backend (logins, roles, database, file storage). No demo data.

## Roles
| Role | Can do |
|---|---|
| **Web administrator** (you) | Everything: add/remove school admins and other web administrators, add teachers, post announcements/timetables, **turn the website OFF/ON**. Cannot be removed by the school admin. |
| **School admin** | Post announcements, events, timetables; add/remove **teachers only**; manage all notes, videos, classes. |
| **Teacher** | Upload notes and videos, schedule/host online classes, remove their own items. |

The system always keeps at least one web administrator.

## Setup (about 20 minutes)
1. **Supabase**: create a free project at supabase.com. Open *SQL Editor*, paste all of `supabase/schema.sql`, Run.
2. **Config**: copy *Project URL* and *anon public key* (Project Settings > API) into `config.js`.
3. **First web administrator**: in the SQL Editor run
   `insert into public.staff_invites(email, role) values ('YOUR-EMAIL', 'web_admin');`
   then open the site > **Staff** > *Create account* with that email. (If Supabase asks to confirm email, confirm it, then sign in. Or turn off *Confirm email* in Authentication > Providers > Email.)
4. **GitHub**: create a repository, upload all files in this folder (keep `index.html` at the top level), then *Settings > Pages > Deploy from branch > main / root*. Your site appears at `https://USERNAME.github.io/REPO/`.
5. In Supabase *Authentication > URL Configuration*, set *Site URL* to your GitHub Pages address.

## Update 2: payments, student records, 14-day lock
Run `supabase/migration-2-payments.sql` once in the Supabase SQL Editor (after `schema.sql`), then re-upload `index.html` and `app.js` to GitHub.
- **Students** are added by the school admin or web administrator (Sign in page > Student records > Add a student) with an email. The student then opens **Sign in** and uses *Create account* with that email.
- **Payments** are recorded by admins. Each payment starts a 14-day access period (a new student gets 14 days from the joining date).
- **Lock:** live class links, notes and videos are only served to staff and to students who are paid up. This is enforced in the database, not just on the page. Public visitors still see announcements and timetables.
- **Attendance** (present/missed) is marked by teachers or admins.
- **Spreadsheet:** admins click *Download spreadsheet* for an Excel file with Students, Payments and Attendance sheets.
- **Web administrators are hidden:** only web administrators can see other web administrators. Students, teachers and the school admin cannot see them or their invitations, and cannot remove them.
- Teachers can see the student list (needed for attendance), including each student's last payment date.

## Update 3: public registration (Ksh 200)
Run `supabase/migration-3-registrations.sql` once, then re-upload `index.html` and `app.js`.
- Anyone can register on the **Register** page: name, phone, services (High school students, Adult learning, Reproductive health, Mental health care and substance abuse, Goal setting, Self awareness and skills, Academic motivation, Professional short courses) and the Ksh 200 registration fee (Paybill 400200, account 40722).
- Admins see all registrations on the Sign in page (Student records > Registrations), can mark the Ksh 200 as paid, and the downloadable spreadsheet has a Registrations sheet.
- Registrations may reveal sensitive interests (for example mental health or reproductive health). Only admins can read them, and teachers and students cannot. Keep the spreadsheet private.

## Update 4: automatic M-Pesa payment (STK push)
1. Run `supabase/migration-4-mpesa.sql`.
2. Deploy the two functions in `supabase/functions/` (`mpesa-stk` with Verify JWT ON, `mpesa-callback` with Verify JWT OFF).
3. Add these secrets (Edge Functions > Secrets): `MPESA_ENV` (sandbox or production), `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_ACCOUNT` (40722), `MPESA_CALLBACK_KEY` (any long random text).
4. Re-upload `index.html` and `app.js`.
Test in sandbox first (shortcode 174379 and the sandbox passkey from the Daraja portal), then go live.

## Adding people
Web administrator or school admin: **Staff area > Staff > Add staff** (email + role). That person opens the Staff page and uses *Create account* with the same email.

## Turning the website off (web administrator only)
**Staff area > Website status > Turn site OFF.** Visitors see your message; announcements, timetables, notes and videos stop being served to the public. Only you can still sign in, from the same screen, to turn it back ON. For a complete hard stop, also disable GitHub Pages (repo Settings > Pages).

## File sizes
`schema.sql` allows files up to 1 GB, but Supabase's own project limit applies: **50 MB on the free plan**. For 1 GB uploads, use the Pro plan and raise *Storage > Settings > Global file size limit*. Large videos are more reliable as YouTube/Drive links (paste the link instead of uploading).

## Not included yet
Student/parent portal, results and report cards, online fee payment (M-Pesa Daraja). The demo versions were removed; these need extra tables and a payment service. Fees are still paid by Paybill 400200, account 40722.

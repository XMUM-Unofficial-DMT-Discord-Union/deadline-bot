# TODO

 - Use Prisma to handle database integration
 - Upon setting up PostgreSQL on VM, set time zone to 'Asia/Kuala_Lumpur'.
 - Use `Paranoid` tables for tracking messages.
 - One-to-One Relationship between a Student and a Verification form
 - Many-to-Many Relationship between Student and Course
 - To move whole database to another server, do [pg_dumpall](https://www.postgresql.org/docs/12/app-pg-dumpall.html)
 - Modify server to follow these [rules](https://www.prisma.io/docs/concepts/components/prisma-migrate#production-and-testing-environments)

/admin (subcommand)
 * mod
   * add
   * remove
 * nick (name)

/mod (subcommand)
 * deadline (subcommand)
   * add (name) (reminder -> default: 1 week) ()
   * delete (name)
   * edit (name) (reminder)
   * extend
 * kick (player) (reason)
 * ban (player) (reason)
 * verify
 * course
   * add (name)
   * remove (name)
 * semester
   * start // Prompt everyone to select course roles
   * end // Clear everyone's course roles
 * apply
   * admin

/ (command)
 * course
   * enroll (name)
   * leave (name)
 * bot
   * aboutme
   * status
 * ping
 * bonk
 * serverinfo
 * suggest
 * deadline
   * list (optional: verbose) // Lists all deadlines
   * info (choice: name)
 * report
   * mod (name) (reason) (optional: attachment/link to a text message)
 * apply
   * mod
   * dev

Future Commands
=========
* Allow members to suggest changing incorrect deadlines
* Dynamic role permissions upon new channel
* Display channel info on invocated channel
* Mod/Admin Meetings reminder
* Event Notifications

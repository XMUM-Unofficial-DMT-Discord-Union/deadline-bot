# TODO

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
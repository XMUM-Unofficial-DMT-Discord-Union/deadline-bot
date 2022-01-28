import { Client, TextChannel } from 'discord.js';
import scheduler from 'node-schedule';

import { Deadline } from './models/course.js';
import { Guild } from './models/guild.js';
import { Student } from './models/student.js';
import { GUILD } from './utilities.js';

/**
 * Starts up node-schedule and scours into the database, reading any deadlines and initializes them as schedules
 */
export async function initializeScheduler(client: Client) {
    console.log('\nInitializing scheduler...');

    // Get all courses
    const courses = GUILD.getAllCourses();

    console.log('Courses fetched');

    let toBeReplacedDeadlines: { [courseName: string]: number[] } = {};

    for (let course of Object.values(courses)) {

        for (let index = 0; index < course.deadlines.length; index++) {
            let deadline = course.deadlines[index];

            console.log(`On ${course.name}: ${deadline.name} with deadline of ${deadline.datetime}`);

            // First we schedule the original deadline
            let result = scheduleDeadline(client, course.name, deadline);

            if (result === null) {
                console.warn(`${course.name}: ${deadline.name}, Scheduling failed. This is due to the deadline is either in the past or invalid.`);

                if (!(course.name in toBeReplacedDeadlines))
                    toBeReplacedDeadlines[course.name] = [];

                toBeReplacedDeadlines[course.name].push(index);
                continue;
            }

            // In one course, there could be 0 to many students
            for (let studentId of course.students) {

                // Check whether this student is present in the docs
                const student = await Student.get(studentId);

                if (student === undefined)
                    continue;

                // Check whether this student has already disabled deadline reminders
                if (course.deadlines[index].excluded.includes(studentId))
                    continue;

                // This student still has reminders on: create reminders
                // Here we don't check for invalid reminders as it won't exist in database
                scheduleReminders(client, course.name, deadline, student);
            }
        }
    }

    let hasInvalidDeadlines = false;
    for (let [courseName, excludedDeadlineIndices] of Object.entries(toBeReplacedDeadlines)) {
        hasInvalidDeadlines = true;
        let course = courses[courseName];

        console.log('Removing invalid deadlines...');
        // Remove these deadlines
        course.deadlines = course.deadlines.filter((_, index) => !excludedDeadlineIndices.includes(index));

        GUILD.updateCourse(course);
    }

    if (hasInvalidDeadlines) {
        await GUILD.save();
        console.log('Deadlines successfully removed!');
    }

    console.log('Finished scheduling.');
}

export function scheduleDeadline(client: Client, courseName: string, deadline: Deadline) {
    // This is the default deadline
    return scheduler.scheduleJob(`${courseName}: ${deadline.name}`, deadline.datetime, async () => {
        // For in production, bot will auto send to "deadlines-and-alerts"
        if (process.env.ENVIRONMENT === 'production') {
            await client.channels.fetch('923137246914310154').then(async channel => {
                if (channel !== null) {
                    await (channel as TextChannel).send({
                        embeds: [{
                            title: 'Deadline Reached!',
                            description: `${courseName} - ` + deadline.url === '' ? `${deadline.name}` : `[${deadline.name}](${deadline.url})`,
                            color: '#ff0000',
                            thumbnail: {
                                url: client.user?.displayAvatarURL()
                            },
                            footer: {
                                text: `Sent on ${new Date().toLocaleString()} with ❤️`
                            }
                        }]
                    })
                }
            })
        }

        if (!scheduler.cancelJob(`${courseName}: ${deadline.name}`)) {
            console.warn(`Warning: job named '${courseName}: ${deadline.name}' cannot be cancelled.`);
        } else {
            // Safely remove the deadline off from firestore
            // Get the corresponding course
            const course = GUILD.getCourse(courseName);

            if (course === undefined) {
                // For some reason, the given course does not exist in database
                console.warn(`Warning: Course named '${courseName}' does not exist in database.`);
            }
            else {
                // Filter out the deadline
                course.deadlines = course.deadlines.filter(value => value.name !== deadline.name);

                // Write to guild
                GUILD.updateCourse(course);

                // Write to database
                await GUILD.save();
            }
        }
    });
}

export function scheduleReminders(client: Client, courseName: string, deadline: Deadline, student: Student) {

    const studentReminderTime = new Date(deadline.datetime.valueOf() - student._remindTime);
    scheduler.scheduleJob(`${courseName}: ${deadline.name} - User-Defined Reminder of ${student._id}`, studentReminderTime, async () => {

        // Reminders are sent to user's DMs
        await client.users.fetch(student._id).then(async user => {
            await user.send({
                embeds: [{
                    title: 'Your very own deadline reminder!',
                    description: `${courseName} - ` + deadline.url === '' ? `${deadline.name}` : `[${deadline.name}](${deadline.url})`,
                    color: '#ff0000',
                    fields: [{
                        name: 'Time of Deadline',
                        value: deadline.datetime.toLocaleString(),
                        inline: true
                    }],
                    thumbnail: {
                        url: client.user?.displayAvatarURL()
                    },
                    footer: {
                        text: `Sent on ${new Date().toLocaleString()} with ❤️`
                    }
                }]
            })
        })

        if (!scheduler.cancelJob(`${courseName}: ${deadline.name} - User-Defined Reminder of ${student._id}`)) {
            console.warn(`Warning: job named '${courseName}: ${deadline.name} - User-Defined Reminder of ${student._id}' cannot be cancelled.`);
        }
    });

    // System Reminder
    const systemReminderTime = deadline.datetime;
    systemReminderTime.setHours(deadline.datetime.getHours() - 1);
    scheduler.scheduleJob(`${courseName}: ${deadline.name} - System Reminder to ${student._id}`, systemReminderTime, async () => {

        // Reminders are sent to user's DMs
        await client.users.fetch(student._discordId).then(async user => {
            await user.send({
                embeds: [{
                    title: 'Deadline is in a few inches away!',
                    description: `${courseName} - ` + deadline.url === '' ? `${deadline.name}` : `[${deadline.name}](${deadline.url})`,
                    color: '#ff0000',
                    fields: [{
                        name: 'Time of Deadline',
                        value: deadline.datetime.toLocaleString(),
                        inline: true
                    }],
                    thumbnail: {
                        url: client.user?.displayAvatarURL()
                    },
                    footer: {
                        text: `Sent on ${new Date().toLocaleString()} with ❤️`
                    }
                }]
            })
        })

        if (!scheduler.cancelJob(`${courseName}: ${deadline.name} - System Reminder to ${student._id}`)) {
            console.warn(`Warning: job named '${courseName}: ${deadline.name} - System Reminder to ${student._id}' cannot be cancelled.`);
        }
    });
}

export function cancelDeadline(courseName: string, deadlineName: string) {
    scheduler.cancelJob(`${courseName}: ${deadlineName}`);
}

export function cancelReminders(courseName: string, deadlineName: string, studentId: string) {
    let jobStrings = [`${courseName}: ${deadlineName}`];

    jobStrings.push(jobStrings[0] + ` - User-Defined Reminder of ${studentId}`);
    jobStrings.push(jobStrings[0] + ` - System Reminder to ${studentId}`);
    jobStrings.pop();

    jobStrings.forEach(job => scheduler.cancelJob(job));
}

export function rescheduleDeadline(client: Client, courseName: string, deadline: Deadline) {
    // This is the default deadline
    return scheduler.rescheduleJob(`${courseName}: ${deadline.name}`, deadline.datetime);
}

export function rescheduleReminders(client: Client, courseName: string, deadline: Deadline, student: Student) {

    const studentReminderTime = new Date(deadline.datetime.valueOf() - student._remindTime);
    scheduler.rescheduleJob(`${courseName}: ${deadline.name} - User-Defined Reminder of ${student._id}`, studentReminderTime);

    // System Reminder
    const systemReminderTime = deadline.datetime;
    systemReminderTime.setHours(deadline.datetime.getHours() - 1);
    scheduler.rescheduleJob(`${courseName}: ${deadline.name} - System Reminder to ${student._id}`, systemReminderTime);
}
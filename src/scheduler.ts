import { Deadline, Student } from '@prisma/client';
import dayjs from 'dayjs';
import { Client, TextChannel } from 'discord.js';
import ms from 'ms';
import { StringValue } from 'ms';
import scheduler, { Job } from 'node-schedule';

import { GUILD, prisma } from './utilities.js';

const JOBS: {
    [jobName: string]: Job;
} = {};

/**
 * Starts up node-schedule and scours into the database, reading any deadlines and initializes them as schedules
 */
export async function initializeScheduler(client: Client) {
    console.log('\nInitializing scheduler...');

    console.log('Checking and removing any past deadlines...');

    // Delete deadlines that were passed while offline
    await prisma.deadline.deleteMany({
        where: {
            datetime: {
                lte: dayjs().toISOString()
            }
        }
    });

    console.log('Deadlines successfully removed!');

    // Retrieve all courses that have deadlines
    const deadlines = (await prisma.deadline.findMany({
        include: {
            course: {
                include: {
                    students: true
                }
            },
            excludedStudents: true
        }
    })).sort((left, right) => left.datetime.getTime() - right.datetime.getTime());

    for (let deadline of deadlines) {

        let course = deadline.course;

        console.log(`On ${course.name}: ${deadline.name} with deadline of ${deadline.datetime}`);

        // First we schedule the original deadline
        scheduleDeadline(client, course.name, deadline);

        // Iterate through students in the course for personalized reminders
        for (let student of course.students) {

            // Check whether this student has already disabled deadline reminders
            if (deadline.excludedStudents.includes(student))
                continue;

            // This student still has reminders on: create reminders
            // Here we don't check for invalid reminders as it won't exist in database
            scheduleReminders(client, course.name, deadline, student);
        }
    }

    console.log('Finished scheduling.');
}

export function scheduleDeadline(client: Client, courseName: string, deadline: Deadline) {
    // This is the default deadline
    let result = scheduler.scheduleJob(`${courseName}: ${deadline.name}`, deadline.datetime, async () => {
        // For in production, bot will auto send to "deadlines-and-alerts"
        // TODO: Make this dynamic and configurable
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
                    });
                }
            });
        }

        if (cancelDeadline(courseName, deadline.name)) {
            // Safely remove the deadline off from database 
            await prisma.deadline.delete({
                where: {
                    id: deadline.id
                },
            });
        }
    });

    if (result !== null)
        JOBS[result.name] = result;

    return result;
}

export function scheduleReminders(client: Client, courseName: string, deadline: Deadline, student: Student) {

    const studentReminderTime = new Date(deadline.datetime.valueOf() - ms(student.remindTime as StringValue));
    let result = scheduler.scheduleJob(`${courseName}: ${deadline.name} - User-Defined Reminder of ${student.id}`, studentReminderTime, async () => {

        // Reminders are sent to user's DMs
        await client.users.fetch(student.id).then(async user => {
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
            });
        });

        if (!scheduler.cancelJob(`${courseName}: ${deadline.name} - User-Defined Reminder of ${student.id}`)) {
            console.warn(`Warning: job named '${courseName}: ${deadline.name} - User-Defined Reminder of ${student.id}' cannot be cancelled.`);
        }
    });

    JOBS[result.name] = result;

    // System Reminder
    const systemReminderTime = deadline.datetime;
    systemReminderTime.setHours(deadline.datetime.getHours() - 1);
    result = scheduler.scheduleJob(`${courseName}: ${deadline.name} - System Reminder to ${student.id}`, systemReminderTime, async () => {

        // Reminders are sent to user's DMs
        await client.users.fetch(student.discordId).then(async user => {
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
            });
        });

        if (!scheduler.cancelJob(`${courseName}: ${deadline.name} - System Reminder to ${student.id}`)) {
            console.warn(`Warning: job named '${courseName}: ${deadline.name} - System Reminder to ${student.id}' cannot be cancelled.`);
        }
    });

    JOBS[result.name] = result;
}

export function cancelDeadline(courseName: string, deadlineName: string) {
    let result = scheduler.cancelJob(JOBS[`${courseName}: ${deadlineName}`]);

    if (result) {
        delete JOBS[`${courseName}: ${deadlineName}`];
        return true;
    }
    console.warn(`Warning: job named '${courseName}: ${deadlineName}' cannot be cancelled.`);
    return false;
}

export function cancelReminders(courseName: string, deadlineName: string, studentId: string) {
    let jobStrings = [`${courseName}: ${deadlineName}`];

    jobStrings.push(jobStrings[0] + ` - User-Defined Reminder of ${studentId}`);
    jobStrings.push(jobStrings[0] + ` - System Reminder to ${studentId}`);
    jobStrings.pop();

    jobStrings.forEach(job => {
        let result = scheduler.cancelJob(JOBS[job]);

        if (result)
            delete JOBS[job];
    });
}

export function rescheduleDeadline(courseName: string, deadline: Deadline) {
    let result = scheduler.rescheduleJob(JOBS[`${courseName}: ${deadline.name}`], deadline.datetime);

    if (result !== null)
        JOBS[result.name] = result;

    return result;
}

export function rescheduleReminders(courseName: string, deadline: Deadline, student: Student) {

    const studentReminderTime = new Date(deadline.datetime.valueOf() - ms(student.remindTime as StringValue));
    let result = scheduler.rescheduleJob(`${courseName}: ${deadline.name} - User-Defined Reminder of ${student.id}`, studentReminderTime);

    JOBS[result.name] = result;

    // System Reminder
    const systemReminderTime = deadline.datetime;
    systemReminderTime.setHours(deadline.datetime.getHours() - 1);
    result = scheduler.rescheduleJob(`${courseName}: ${deadline.name} - System Reminder to ${student.id}`, systemReminderTime);

    JOBS[result.name] = result;
}
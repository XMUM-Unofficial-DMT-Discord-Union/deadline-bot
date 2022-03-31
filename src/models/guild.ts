import { Client } from 'discord.js';
import dayjs from 'dayjs';

import { cancelDeadline, cancelReminders, rescheduleDeadline, rescheduleReminders, scheduleDeadline, scheduleReminders } from '../scheduler.js';
import { Course } from './course.js';

import { prisma } from '../utilities.js';
import { Application, Deadline, Prisma, Report, Role, Student, studentsToRoles, Suggestion } from '@prisma/client';

export type EventSuggestion = Suggestion & {
    location: string;
};

export type ChannelSuggestion = Omit<Suggestion, 'location'>;

type AdminReport = Report & {
    type: 'ADMIN';
};
type ModReport = Report & {
    type: 'MOD';
};
type DevReport = Report & {
    type: 'DEV';
};

type AdminApplication = Application & {
    type: 'ADMIN';
};
type ModApplication = Application & {
    type: 'MOD';
};
type DevApplication = Application & {
    type: 'DEV';
};

type Diff<T, U> = T extends U ? never : T;
type SelectivePartial<T, TOptional extends keyof T> = Partial<T> & Pick<T, Diff<keyof T, TOptional>>;

type StudentFields = Partial<Student & {
    deadlinesExcluded: Deadline[];
    courses: Course[];
    guilds: Guild[];
    studentsToRoles: studentsToRoles[];
}> & Pick<Student, 'discordId'>;

export class Guild {
    static _instance: Guild | undefined;

    static getInstance() {
        if (this._instance === undefined)
            this._instance = new Guild();

        return this._instance;
    }

    /**
     * 
     * @returns false if this guild has not been initialize into database before, true otherwise
     */
    async guildExists(id: string) {
        const guild = await prisma.guild.findUnique({
            where: {
                id: id
            }
        });

        if (guild === null)
            return false;

        return true;
    }

    async createGuild({ id, adminRoleId, modRoleId, verifiedRoleId, devRoleId }:
        {
            id: string;
            adminRoleId: string;
            modRoleId: string;
            verifiedRoleId: string;
            devRoleId: string;
        }) {
        return await prisma.guild.create({
            data: {
                id: id,
                role: {
                    create: [{
                        type: 'ADMIN',
                        id: adminRoleId
                    }, {
                        type: 'MOD',
                        id: modRoleId
                    }, {
                        type: 'VERIFIED',
                        id: verifiedRoleId
                    }, {
                        type: 'DEV',
                        id: devRoleId
                    }]
                }
            }
        });
    }

    async createAdminRole(guildId: string, roleId: string) {
        return await prisma.role.create({
            data: {
                type: 'ADMIN',
                id: roleId,
                guildId: guildId
            }
        });
    }

    async getAdminRole(guildId: string = process.env.GUILD_ID as string) {
        const adminRole = await prisma.role.findUnique({
            where: {
                guildId_type: {
                    guildId: guildId,
                    type: 'ADMIN'
                }
            }
        });

        if (adminRole === null)
            throw 'Admin role is not registered to database.';

        return adminRole;
    }

    async updateAdminRoleId(role: Role, id: string) {
        if (role.type !== 'ADMIN')
            throw 'The given role is not an Admin role.';

        await prisma.role.update({
            where: {
                id: role.id
            },
            data: {
                id: id
            }
        });
    }

    async createModRole(guildId: string, roleId: string) {
        return await prisma.role.create({
            data: {
                type: 'MOD',
                id: roleId,
                guildId: guildId
            }
        });
    }

    async getModRole(guildId: string = process.env.GUILD_ID as string) {
        const modRole = await prisma.role.findFirst({
            where: {
                guildId: guildId,
                type: 'MOD'
            }
        });

        if (modRole === null)
            throw 'Mod role is not registered to database.';

        return modRole;
    }

    async updateModRoleId(role: Role, id: string) {
        if (role.type !== 'MOD')
            throw 'The given role is not a Mod role.';

        await prisma.role.update({
            where: {
                id: role.id
            },
            data: {
                id: id
            }
        });
    }

    async createVerifiedRole(guildId: string, roleId: string) {
        return await prisma.role.create({
            data: {
                type: 'VERIFIED',
                id: roleId,
                guildId: guildId
            }
        });
    }

    async getVerifiedRole(guildId: string = process.env.GUILD_ID as string) {
        const verifiedRole = await prisma.role.findFirst({
            where: {
                guildId: guildId,
                type: 'VERIFIED'
            }
        });

        if (verifiedRole === null)
            throw 'Verified role is not registered to database.';

        return verifiedRole;
    }

    async updateVerifiedRoleId(role: Role, id: string) {
        if (role.type !== 'VERIFIED')
            throw 'The given role is not a Verified role.';

        await prisma.role.update({
            where: {
                id: role.id
            },
            data: {
                id: id
            }
        });
    }

    async createDevRole(guildId: string, roleId: string) {
        return await prisma.role.create({
            data: {
                type: 'DEV',
                id: roleId,
                guildId: guildId
            }
        });
    }

    async getDevRole(guildId: string = process.env.GUILD_ID as string) {
        const verifiedRole = await prisma.role.findFirst({
            where: {
                guildId: guildId,
                type: 'DEV'
            }
        });

        if (verifiedRole === null)
            throw 'Dev role is not registered to database.';

        return verifiedRole;
    }

    async updateDevRoleId(role: Role, id: string) {
        if (role.type !== 'DEV')
            throw 'The given role is not a Dev role.';

        await prisma.role.update({
            where: {
                id: role.id
            },
            data: {
                id: id
            }
        });
    }

    async getAllCourses() {
        return await prisma.course.findMany({
            include: {
                students: true,
                deadlines: true
            }
        });
    }

    async getCourse(name: string, include?: Prisma.CourseInclude) {
        const course = await prisma.course.findUnique({
            where: {
                name: name
            },
            include: include
        });

        if (course === null)
            return undefined;

        return course;
    }

    async removeStudentFromCourse(courseName: string, discordId: string) {
        const course = await prisma.course.findUnique({
            where: {
                name: courseName
            },
            include: {
                students: true,
                deadlines: true
            }
        });

        if (course === null)
            return false;

        await prisma.course.update({
            where: {
                name: courseName
            },
            data: {
                students: {
                    disconnect: {
                        discordId: discordId
                    }
                }
            }
        });

        const student = await prisma.student.findUnique({
            where: {
                discordId: discordId
            },
            include: {
                courses: true
            }
        });

        if (student === null)
            return false;

        course.deadlines.forEach(deadline =>
            cancelReminders(courseName, deadline.name, student.id));

        return true;
    }

    async addStudentToCourse(courseName: string, discordId: string, client: Client) {
        const course = await prisma.course.findUnique({
            where: {
                name: courseName
            },
            include: {
                students: true,
                deadlines: true
            }
        });

        if (course === null)
            return false;

        const student = await prisma.student.findUnique({
            where: {
                discordId: discordId
            }
        });

        if (student === null)
            return false;

        const updatedCourse = await prisma.course.update({
            where: {
                name: courseName
            },
            data: {
                students: {
                    connect: {
                        discordId: discordId
                    }
                }
            },
            include: {
                deadlines: true
            }
        });

        updatedCourse.deadlines.forEach(deadline =>
            scheduleReminders(client, courseName, deadline, student));

        return true;
    }

    async removeDeadlineFromCourse(courseName: string, deadlineName: string) {
        const course = await prisma.course.findUnique({
            where: {
                name: courseName
            },
            include: {
                students: true,
                deadlines: true
            }
        });

        if (course === null)
            return false;

        const deadline = course.deadlines.find(value => value.name !== deadlineName);

        if (deadline === undefined)
            return false;

        await prisma.deadline.delete({
            where: {
                id: deadline.id
            }
        });

        cancelDeadline(courseName, deadlineName);

        course.students.forEach(student =>
            cancelReminders(courseName, deadlineName, student.id)
        );

        return true;
    }

    async addDeadlineToCourse(courseName: string, deadline: Omit<Deadline, 'id' | 'courseId'>, client: Client) {
        const course = await prisma.course.findUnique({
            where: {
                name: courseName
            },
            include: {
                students: true
            }
        });

        if (course === null)
            return false;

        const createdDeadline = await prisma.deadline.create({
            data: {
                ...deadline,
                course: {
                    connect: {
                        name: courseName
                    }
                }
            }
        });

        scheduleDeadline(client, courseName, createdDeadline);

        course.students.forEach(student =>
            scheduleReminders(client, courseName, createdDeadline, student)
        );

        return true;
    }

    async editDeadlineFromCourse(courseName: string, oldDeadline: Omit<Deadline, "id" | "courseId">, newDeadline: Omit<Deadline, "id" | "courseId">) {

        const deadline = await prisma.deadline.findFirst({
            where: {
                name: oldDeadline.name
            },
            include: {
                course: {
                    include: {
                        students: true
                    }
                }
            }
        });

        if (deadline === null)
            return false;

        if (dayjs(deadline.datetime).isSame(dayjs(newDeadline.datetime)) || dayjs(deadline.datetime).isBefore(dayjs()))
            return false;

        // Only add pending reschedule if the date has changed
        rescheduleDeadline(courseName, { ...newDeadline, id: deadline.id, courseId: deadline.courseId });

        deadline.course.students.forEach(student =>
            rescheduleReminders(courseName, {
                ...newDeadline,
                id: deadline.id,
                courseId: deadline.courseId
            }, student)
        );

        await prisma.deadline.update({
            where: {
                id: deadline.id
            },
            data: {
                ...newDeadline
            }
        });

        return true;
    }

    /**
     * Adds a new student into this guild. Note that this assumes that the student is not in the guild
     * @param fields 
     * @returns 
     */
    async addUnverifiedStudent(fields: SelectivePartial<Student, 'remindTime'> & { guildId: string; }) {
        const { guildId, ...studentFields } = fields;

        await prisma.student.create({
            data: {
                ...studentFields,
                guilds: {
                    connect: {
                        id: guildId
                    }
                },
                studentsToRoles: {
                    create: [{
                        guildId: guildId,
                        roleType: 'UNVERIFIED'
                    }]
                }
            }
        });

        return true;
    }

    async removeUnverifiedStudent(fields: SelectivePartial<Student, 'remindTime'> & { guildId: string; }) {
        const { guildId, ...studentFields } = fields;

        await prisma.student.update({
            where: {
                discordId: studentFields.discordId
            },
            data: {
                guilds: {
                    disconnect: [{
                        id: guildId
                    }]
                },
                studentsToRoles: {
                    deleteMany: {
                        guildId: guildId
                    }
                }
            }
        });
    }

    /**
     * Verifies a student of this Guild
     * @param student The associated Student object
     * @returns true if found a matching student to verify, false otherwise
     */
    async verifyStudent(studentFields: Pick<Student, 'discordId'> & { guildId: string; }) {
        const student = await prisma.student.findFirst({
            where: {
                discordId: studentFields.discordId,
                guilds: {
                    some: {
                        id: studentFields.guildId
                    }
                }
            },
            include: {
                studentsToRoles: true
            }
        });

        if (student === null || !student.studentsToRoles.some(role => role.roleType === 'UNVERIFIED'))
            return false;

        await prisma.student.update({
            where: {
                discordId: studentFields.discordId
            },
            data: {
                studentsToRoles: {
                    create: [{
                        guildId: studentFields.guildId,
                        roleType: 'VERIFIED'
                    }],
                    deleteMany: {
                        guildId: studentFields.guildId,
                        roleType: 'UNVERIFIED'
                    }
                }
            }
        });

        return true;
    }

    async changeStudentDeadlineSettings(studentFields: Pick<StudentFields, 'discordId' | 'remindTime'>) {

        const { discordId, ...rest } = studentFields;

        const student = await prisma.student.findUnique({
            where: {
                discordId: discordId
            }
        });

        if (student === null)
            return false;

        const updatedStudent = await prisma.student.update({
            where: {
                discordId: studentFields.discordId
            },
            data: {
                ...rest
            },
            include: {
                courses: {
                    select: {
                        name: true,
                        deadlines: true
                    }
                }
            }
        });

        updatedStudent.courses.forEach(course => {
            course.deadlines.forEach(deadline => {
                rescheduleReminders(course.name, deadline, updatedStudent);
            });
        });

        return true;
    }

    async addRoleToStudent(type: 'ADMIN' | 'MOD' | 'DEV' | 'VERIFIED', discordId: string, guildId: string) {
        // First find the student
        const student = await prisma.student.findFirst({
            where: {
                discordId: discordId,
                guilds: {
                    some: {
                        id: guildId
                    }
                }
            },
            select: {
                studentsToRoles: true
            }
        });

        if (student === null)
            return false;


        if (type === 'VERIFIED') {
            if (!student.studentsToRoles.some(role => role.roleType === 'UNVERIFIED'))
                return false;

            await prisma.student.update({
                where: {
                    discordId: discordId
                },
                data: {
                    studentsToRoles: {
                        create: [{
                            guildId: guildId,
                            roleType: 'VERIFIED'
                        }],
                        deleteMany: {
                            guildId: guildId,
                            roleType: 'UNVERIFIED'
                        }
                    }
                }
            });
        }

        if (type === 'ADMIN') {
            if (!student.studentsToRoles.some(role => role.roleType === 'MOD'))
                return false;

            await prisma.student.update({
                where: {
                    discordId: discordId
                },
                data: {
                    studentsToRoles: {
                        create: [{
                            guildId: guildId,
                            roleType: 'ADMIN'
                        }],
                        deleteMany: {
                            guildId: guildId,
                            roleType: 'MOD'
                        }
                    }
                }
            });
        }

        if (type === 'MOD') {
            if (!student.studentsToRoles.some(role => role.roleType === 'ADMIN'))
                return false;

            await prisma.student.update({
                where: {
                    discordId: discordId
                },
                data: {
                    studentsToRoles: {
                        create: [{
                            guildId: guildId,
                            roleType: 'MOD'
                        }],
                        deleteMany: {
                            guildId: guildId,
                            roleType: 'ADMIN'
                        }
                    }
                }
            });
        }

        if (type === 'DEV') {
            if (student.studentsToRoles.some(role => role.roleType === 'DEV'))
                return false;

            await prisma.student.update({
                where: {
                    discordId: discordId
                },
                data: {
                    studentsToRoles: {
                        create: [{
                            guildId: guildId,
                            roleType: 'DEV'
                        }]
                    }
                }
            });
        }

        return true;
    }

    async removeRoleFromStudent(type: 'ADMIN' | 'MOD' | 'DEV' | 'VERIFIED', discordId: string, guildId: string) {
        // First find the student
        const student = await prisma.student.findFirst({
            where: {
                discordId: discordId,
                guilds: {
                    some: {
                        id: guildId
                    }
                }
            },
            include: {
                studentsToRoles: true
            }
        });

        if (student === null)
            return false;

        if (!student.studentsToRoles.some(role => role.roleType === type))
            return false;

        await prisma.student.update({
            where: {
                discordId: discordId
            },
            data: {
                studentsToRoles: {
                    deleteMany: {
                        guildId: guildId,
                        roleType: type
                    }
                }
            }
        });

        if (type === 'VERIFIED')
            // Put the student back into unverified state
            await prisma.student.update({
                where: {
                    discordId: discordId
                },
                data: {
                    studentsToRoles: {
                        create: [{
                            guildId: guildId,
                            roleType: 'VERIFIED'
                        }]
                    }
                }
            });

        return true;
    }

    async getAllSuggestions(guildId: string) {
        return await prisma.suggestion.findMany({
            where: {
                guildId: guildId
            }
        });
    }

    async getChannelSuggestions(guildId: string) {
        return await prisma.suggestion.findMany({
            where: {
                guildId: guildId,
                type: 'CHANNEL'
            }
        }) as ChannelSuggestion[];
    }

    async getEventSuggestions(guildId: string) {
        return await prisma.suggestion.findMany({
            where: {
                guildId: guildId,
                type: 'EVENT'
            }
        }) as EventSuggestion[];
    }

    async addSuggestion(suggestion: Omit<Suggestion, 'id'>) {

        if (suggestion.type === 'CHANNEL' && suggestion.location !== null)
            throw 'Malformed Channel Suggestion.';

        if (suggestion.type === 'EVENT' && suggestion.location === null)
            throw 'Malformed Event Suggestion.';

        return await prisma.suggestion.create({
            data: {
                ...suggestion
            }
        });
    }

    async deleteSuggestion(suggestionId: number) {
        const suggestion = await prisma.suggestion.findUnique({
            where: {
                id: suggestionId
            }
        });

        if (suggestion === null)
            return false;

        // TODO: Catching wrongful deletions of non-existent records
        await prisma.suggestion.delete({
            where: {
                id: suggestionId
            }
        });

        return true;
    }

    async getAllReports(guildId: string) {
        return await prisma.report.findMany({
            where: {
                guildId: guildId
            }
        });
    }

    async getAdminReports(guildId: string) {
        return await prisma.report.findMany({
            where: {
                guildId: guildId,
                type: 'ADMIN'
            }
        }) as AdminReport[];
    }

    async getModReports(guildId: string) {
        return await prisma.report.findMany({
            where: {
                guildId: guildId,
                type: 'MOD'
            }
        }) as ModReport[];
    }

    async getDevReports(guildId: string) {
        return await prisma.report.findMany({
            where: {
                guildId: guildId,
                type: 'DEV'
            }
        }) as DevReport[];
    }

    async addReport(report: Omit<Report, 'id'>) {
        return await prisma.report.create({
            data: {
                ...report
            }
        });
    }

    async deleteReport(reportId: number) {
        const report = await prisma.report.findUnique({
            where: {
                id: reportId
            }
        });

        if (report === null)
            return false;

        // TODO: Catching wrongful deletions of non-existent records
        await prisma.report.delete({
            where: {
                id: reportId
            }
        });

        return true;
    }

    async getAllApplications(guildId: string) {
        return await prisma.application.findMany({
            where: {
                guildId: guildId
            }
        });
    }

    async getAdminApplications(guildId: string) {
        return await prisma.application.findMany({
            where: {
                guildId: guildId,
                type: 'ADMIN'
            }
        }) as AdminApplication[];
    }

    async getModApplications(guildId: string) {
        return await prisma.application.findMany({
            where: {
                guildId: guildId,
                type: 'MOD'
            }
        }) as ModApplication[];
    }

    async getDevApplications(guildId: string) {
        return await prisma.application.findMany({
            where: {
                guildId: guildId,
                type: 'DEV'
            }
        }) as DevApplication[];
    }

    async addApplication(application: Omit<Application, 'id'>) {
        return await prisma.application.create({
            data: {
                ...application
            }
        });
    }

    async deleteApplication(applicationId: number) {
        const application = await prisma.application.findUnique({
            where: {
                id: applicationId
            }
        });

        if (application === null)
            return false;

        await prisma.application.delete({
            where: {
                id: applicationId
            }
        });

        return true;
    }
}
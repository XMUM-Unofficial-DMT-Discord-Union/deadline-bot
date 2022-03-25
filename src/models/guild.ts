import Big from 'big.js';
import { Client } from 'discord.js';
import dayjs from 'dayjs';
import { collection, CollectionReference, doc, DocumentData, DocumentReference, getDoc, getDocs, writeBatch, WriteBatch } from 'firebase/firestore';

import { firestoreApp } from '../database.js';
import { cancelDeadline, cancelReminders, rescheduleDeadline, rescheduleReminders, scheduleDeadline, scheduleReminders } from '../scheduler.js';
import { Course } from './course.js';

import { GUILD, prisma } from '../utilities.js';
import { Deadline, Role, Student, studentsToRoles } from '@prisma/client';
import { Type } from 'typescript';

type WriteCallback = () => void;

type ChannelSuggestion = {
    type: 'channel',
    name: string;
};
type EventSuggestion = {
    type: 'event',
    name: string,
    datetime: Date,
    location: string;
};
type Suggestion = {
    userDiscordId: string,
    reason: string;
} & (ChannelSuggestion | EventSuggestion);

type AdminReport = {
    type: 'admin';
};
type ModReport = {
    type: 'mod';
};
type DevReport = {
    type: 'dev';
};
type Report = {
    discordId: string,
    datetime: Date,
    reason: string;
} & (AdminReport | ModReport | DevReport);

type AdminApplication = {
    type: 'admin';
};
type ModApplication = {
    type: 'mod';
};
type DevApplication = {
    type: 'dev';
};

type Diff<T, U> = T extends U ? never : T;
type SelectivePartial<T, TOptional extends keyof T> = Partial<T> & Pick<T, Diff<keyof T, TOptional>>;

type StudentFields = Partial<Student & {
    deadlinesExcluded: Deadline[];
    courses: Course[];
    guilds: Guild[];
    studentsToRoles: studentsToRoles[];
}> & Pick<Student, 'discordId'>;

export type Application = {
    discordId: string,
    name: string,
    reason: string;
} & (AdminApplication | ModApplication | DevApplication);

export class Guild {
    _suggestionNextEntryId: Big;
    _reportNextEntryId: Big;
    _applicationNextEntryId: {
        [type: string]: Big;
    };

    _rootDocument: DocumentReference<DocumentData>;
    _rolesCollection: CollectionReference<DocumentData>;
    _coursesCollection: CollectionReference<Course>;
    _suggestionsCollection: CollectionReference<Suggestion>;
    _reportsCollection: CollectionReference<Report>;
    _applicationsCollection: CollectionReference<Application>;

    _courses: { [name: string]: Course; };

    _roles: {
        [role: string]: {
            id: string,
            commands: [
                {
                    id: string;
                }
            ];
        };
    };

    _students: {
        verified: Array<Student>,
        unverified: Array<Student>;
    };

    _suggestions: {
        [index: string]: Suggestion;
    };

    _reports: {
        [index: string]: Report;
    };

    _applications: {
        [type: string]: {
            [index: string]: Application;
        };
    };

    _writeBatch: WriteBatch | undefined;
    _writeCallbacks: Array<WriteCallback>;

    static _instance: Guild | undefined;

    constructor(id: string = '0') {
        this._suggestionNextEntryId = new Big('0');
        this._reportNextEntryId = new Big('0');
        this._applicationNextEntryId = {
            admin: new Big('0'),
            mod: new Big('0'),
            dev: new Big('0')
        };

        this._rootDocument = doc(firestoreApp, `guilds/${id}`);
        this._rolesCollection = collection(this._rootDocument, 'roles');
        this._coursesCollection = collection(this._rootDocument, 'courses').withConverter(Course.converter());

        this._suggestionsCollection = collection(this._rootDocument, 'suggestions').withConverter({
            fromFirestore: (snap) => {
                if (snap.data().type === 'event') {
                    let { datetime, ...rest } = snap.data();
                    return {
                        datetime: new Date(datetime.seconds * 1000),
                        ...rest
                    } as Suggestion & EventSuggestion;
                }
                else
                    return snap.data() as Suggestion & ChannelSuggestion;
            },
            toFirestore: (suggestion) => suggestion
        });

        this._reportsCollection = collection(this._rootDocument, 'reports').withConverter({
            fromFirestore: (snap) => {
                let { datetime, ...rest } = snap.data();
                return {
                    datetime: new Date(snap.data().datetime.seconds * 1000),
                    ...rest
                } as Report;
            },
            toFirestore: (report) => report
        });

        this._applicationsCollection = collection(this._rootDocument, 'applications').withConverter({
            fromFirestore: (snap) => snap.data() as Application,
            toFirestore: (application) => application
        });

        this._courses = {};

        this._roles = {};

        this._students = { unverified: [], verified: [] };

        this._suggestions = {};
        this._reports = {};
        this._applications = { admin: {}, mod: {}, dev: {} };

        this._writeCallbacks = [];
    }

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
                deadline: true
            }
        });
    }

    async getCourse(name: string) {
        const course = await prisma.course.findUnique({
            where: {
                name: name
            },
            include: {
                deadline: true
            }
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
                deadline: true
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

        course.deadline.forEach(deadline =>
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
                deadline: true
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
                deadline: true
            }
        });

        updatedCourse.deadline.forEach(deadline =>
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
                deadline: true
            }
        });

        if (course === null)
            return false;

        const deadline = course.deadline.find(value => value.name !== deadlineName);

        if (deadline === undefined)
            return false;

        await prisma.deadline.delete({
            where: {
                id: deadline.id
            }
        });

        cancelDeadline(courseName, deadlineName);
        this._courses[courseName].students.forEach(id =>
            cancelReminders(courseName, deadlineName, id)
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

    getStudent(discordId: string) {
        for (let students of Object.values(this._students)) {
            for (let student of students) {
                if (student.discordId === discordId)
                    return student;
            }
        }

        return undefined;
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
                        deadline: true
                    }
                }
            }
        });

        updatedStudent.courses.forEach(course => {
            course.deadline.forEach(deadline => {
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

    getAllSuggestions() {
        return this._suggestions;
    }

    getChannelSuggestions() {
        let result: { [index: string]: Suggestion & ChannelSuggestion; } = {};

        for (let suggestion of Object.entries(this._suggestions)) {
            if (suggestion[1].type === 'channel')
                result[suggestion[0]] = suggestion[1];
        }
        return result;
    }

    getEventSuggestions() {
        let result: { [index: string]: Suggestion & EventSuggestion; } = {};

        for (let suggestion of Object.entries(this._suggestions)) {
            if (suggestion[1].type === 'event')
                result[suggestion[0]] = suggestion[1];
        }
        return result;
    }

    addSuggestion(suggestion: Suggestion) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._suggestionsCollection, this._suggestionNextEntryId.toString()), suggestion);
        this._writeBatch.set(this._rootDocument, { suggestionNextEntryId: this._suggestionNextEntryId.plus('1').toString() });

        // Also add pending write to list of suggestions
        this._writeCallbacks.push(() => {
            this._suggestions[this._suggestionNextEntryId.toString()] = suggestion;
        });

        this._suggestionNextEntryId = this._suggestionNextEntryId.plus('1');
    }

    deleteSuggestion(suggestionId: string) {
        this.startWriteBatch();

        this._writeBatch.delete(doc(this._suggestionsCollection, suggestionId));

        // Also add pending delete to list of suggestions
        this._writeCallbacks.push(() => {
            delete this._suggestions[suggestionId];
        });
    }

    getAllReports() {
        return this._reports;
    }

    getModReports() {
        let result: { [index: string]: Report; } = {};

        for (let report of Object.entries(this._reports)) {
            if (report[1].type === 'mod')
                result[report[0]] = report[1];
        }
        return result;
    }

    addReport(report: Report) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._reportsCollection, this._reportNextEntryId.toString()), report);
        this._writeBatch.set(this._rootDocument, { reportNextEntryId: this._reportNextEntryId.plus('1').toString() });

        // Also add pending write to list of reports 
        this._writeCallbacks.push(() => {
            this._reports[this._reportNextEntryId.toString()] = report;

            this._reportNextEntryId.plus('1');
        });

        this._reportNextEntryId = this._reportNextEntryId.plus('1');
    }

    deleteReport(suggestionId: string) {
        this.startWriteBatch();

        this._writeBatch.delete(doc(this._suggestionsCollection, suggestionId));

        // Also add pending delete to list of reports 
        this._writeCallbacks.push(() => {
            delete this._reports[suggestionId];
        });
    }

    getAllApplications() {
        return this._applications;
    }

    getAdminApplications() {
        return this._applications['admin'];
    }

    getModApplications() {
        return this._applications['mod'];
    }

    getDevApplications() {
        return this._applications['dev'];
    }

    addApplication(application: Application) {
        this.startWriteBatch();

        let response: any = {};

        response[`${application.type}ApplicationNextEntryId`] = this._applicationNextEntryId[application.type].plus('1').toString();

        this._writeBatch.set(doc(this._applicationsCollection, `${application.type}: ${this._applicationNextEntryId[application.type].toString()}`), application);
        this._writeBatch.set(this._rootDocument, response);

        // Also add pending write to list of applications 
        this._writeCallbacks.push(() => {
            this._applications[application.type][this._applicationNextEntryId[application.type].toString()] = application;
        });

        this._applicationNextEntryId[application.type] = this._applicationNextEntryId[application.type].plus('1');
    }

    deleteApplication(applicationType: string, applicationId: string) {
        this.startWriteBatch();

        this._writeBatch.delete(doc(this._applicationsCollection, `${applicationType}: ${applicationId}`));

        // Also add pending delete to list of applications 
        this._writeCallbacks.push(() => {
            delete this._applications[applicationType][this._applicationNextEntryId[applicationType].toString()];
        });
    }

    async save() {
        if (!this.writeBatchStarted(this._writeBatch)) {
            Promise.reject('There\'s nothing to write!');
            return;
        }

        console.log('Saving...');
        await this._writeBatch.commit();
        console.log('Saved!');

        // Also save these writes to this instance
        while (this._writeCallbacks.length !== 0)
            (this._writeCallbacks.pop() as WriteCallback)();

        // Remove the instance afterwards
        this._writeBatch = undefined;
    }

    /**
     * Uses an existing write batch if intialized, otherwise creates a new write batch.
     */
    private startWriteBatch(): asserts this is { _writeBatch: WriteBatch; } {
        if (this.writeBatchStarted(this._writeBatch))
            return;

        this._writeBatch = writeBatch(firestoreApp);
    }

    private writeBatchStarted(writeBatch: WriteBatch | undefined): writeBatch is WriteBatch {
        return writeBatch !== undefined;
    }
    /**
     * 
     * @param id The id of the guild
     * @returns A Guild object, modelling the database version of Guild
     */
    static async get(id: string) {
        const result = new Guild(id);
        return result;
    }
}
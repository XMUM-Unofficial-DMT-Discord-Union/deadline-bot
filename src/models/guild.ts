import Big from 'big.js';
import { collection, CollectionReference, doc, DocumentData, DocumentReference, FirestoreDataConverter, getDoc, getDocs, QueryDocumentSnapshot, writeBatch, WriteBatch } from 'firebase/firestore';

import { firestoreApp } from '../database.js';
import { Course } from './course.js';
import { Student } from './student.js';

type WriteCallback = () => void;

type ChannelSuggestion = {
    type: 'channel',
    name: string
}
type EventSuggestion = {
    type: 'event',
    name: string,
    datetime: Date,
    location: string
}
type Suggestion = {
    userDiscordId: string,
    reason: string
} & (ChannelSuggestion | EventSuggestion);

type Report = {
    type: 'mod',
    discordId: string,
    datetime: Date,
    reason: string
};

type ModApplication = void;
type DevApplication = void;


export class Guild {
    _suggestionNextEntryId: Big;
    _reportNextEntryId: Big;

    _rootDocument: DocumentReference<DocumentData>;
    _rolesCollection: CollectionReference<DocumentData>;
    _coursesCollection: CollectionReference<Course>;
    _studentsCollection: CollectionReference<Student>;
    _suggestionsCollection: CollectionReference<Suggestion>;
    _reportsCollection: CollectionReference<Report>;

    _courses: { [name: string]: Course };

    _roles: {
        [role: string]: {
            id: string,
            commands: [
                {
                    id: string
                }
            ]
        }
    };

    _students: {
        verified: Array<Student>,
        unverified: Array<Student>
    }

    _suggestions: {
        [index: string]: Suggestion
    };

    _reports: {
        [index: string]: Report
    };

    _writeBatch: WriteBatch | undefined;
    _writeCallbacks: Array<WriteCallback>;

    constructor(id: string) {
        this._suggestionNextEntryId = new Big('0');
        this._reportNextEntryId = new Big('0');

        this._rootDocument = doc(firestoreApp, `guilds/${id}`);
        this._rolesCollection = collection(this._rootDocument, 'roles');
        this._coursesCollection = collection(this._rootDocument, 'courses').withConverter(Course.converter());
        this._studentsCollection = collection(this._rootDocument, 'students').withConverter(Student.converter());

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
        })

        this._reportsCollection = collection(this._rootDocument, 'reports').withConverter({
            fromFirestore: (snap) => {
                let { datetime, ...rest } = snap.data();
                return {
                    datetime: new Date(snap.data().datetime.seconds * 1000),
                    ...rest
                } as Report;
            },
            toFirestore: (report) => report
        })

        this._courses = {};

        this._roles = {};

        this._students = { unverified: [], verified: [] };

        this._suggestions = {};
        this._reports = {};

        this._writeCallbacks = [];
    }

    /**
     * 
     * @returns false if this guild has not been initialize into database before, true otherwise
     */
    exists() {
        // By definition, a Guild should have admin and mod documents predefined.
        if (!('admin' in this._roles) || this._roles.admin.id === '' || !('mod' in this._roles) || this._roles.mod.id === '')
            return false;

        return true;
    }

    getAdminRoleDetails() {
        return this._roles['admin'];
    }

    updateAdminRoleId(id: string) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._rolesCollection, 'admin'), {
            id: id
        }, { merge: true, mergeFields: ['id'] });

        // Append a pending write to this instance as well
        this._writeCallbacks.push(() => { this._roles['admin'].id = id });
    }

    getModRoleDetails() {
        return this._roles['mod'];
    }

    updateModRoleId(id: string) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._rolesCollection, 'mod'), {
            id: id
        }, { merge: true, mergeFields: ['id'] });

        // Append a pending write to this instance as well
        this._writeCallbacks.push(() => { this._roles['mod'].id = id });
    }

    getVerifiedRoleDetails() {
        return this._roles['verified'];
    }

    updateVerifiedRoleId(id: string) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._rolesCollection, 'verified'), {
            id: id
        }, { merge: true, mergeFields: ['id'] });

        // Append a pending write to this instance as well
        this._writeCallbacks.push(() => { this._roles['verified'].id = id });
    }

    getAllCourses() {
        return this._courses;
    }

    getCourse(name: string): Course | undefined {
        if (name in this._courses)
            return this._courses[name];
        return undefined;
    }

    addCourse(course: Course) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._coursesCollection, course.name), course);

        // Append a pending write to this instance as well
        this._writeCallbacks.push(() => {
            // For safety reasons, we might "add" to an existing course: Overwrite that
            this._courses[course.name] = course;
        });
    }

    /**
     * Adds a delete course job to this Guild
     * @param courseName The course name to be deleted
     * @returns true if found a matching course to delete, false otherwise
     */
    deleteCourse(courseName: string) {
        if (!(courseName in this._courses))
            return false;

        this.startWriteBatch();

        this._writeBatch.delete(doc(this._coursesCollection, courseName));

        // Add a pending delete to callbacks as well
        this._writeCallbacks.push(() => {
            delete this._courses[courseName];
        })

        return true;
    }

    updateCourse(course: Course) {
        this.addCourse(course);
    }

    //addCourseDeadline(courseName: string, )

    getAllStudents() {
        return this._students;
    }

    getStudent(discordId: string) {
        for (let students of Object.values(this._students)) {
            for (let student of students) {
                if (student._discordId === discordId)
                    return student;
            }
        }

        return undefined;
    }

    addUnverifiedStudent(student: Student) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._studentsCollection, student._discordId), student);

        // Also add pending write to this instance
        this._writeCallbacks.push(() => {
            this._students.unverified.push(student);
        })
    }

    /**
     * Verifies a student of this Guild
     * @param student The associated Student object
     * @returns true if found a matching student to verify, false otherwise
     */
    verifyStudent(student: Student) {
        if (this._students.unverified.find(unverified => unverified._discordId === student._discordId) === undefined)
            return false;

        student.setVerified();

        this.startWriteBatch();

        this._writeBatch.set(doc(this._studentsCollection, student._discordId), student);

        // Also add pending write to this instance
        this._writeCallbacks.push(((student: Student) => {
            this._students.unverified = this._students.unverified.filter(unverified => unverified._discordId !== student._discordId);
            this._students.verified.push(student);
        }).bind(this, student));

        return true;
    }

    getAllSuggestions() {
        return this._suggestions;
    }

    getChannelSuggestions() {
        let result: { [index: string]: Suggestion & ChannelSuggestion } = {};

        for (let suggestion of Object.entries(this._suggestions)) {
            if (suggestion[1].type === 'channel')
                result[suggestion[0]] = suggestion[1];
        }
        return result;
    }

    getEventSuggestions() {
        let result: { [index: string]: Suggestion & EventSuggestion } = {};

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
        })

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
        let result: { [index: string]: Report } = {};

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

        // Also add pending write to list of suggestions
        this._writeCallbacks.push(() => {
            this._reports[this._reportNextEntryId.toString()] = report;

            this._reportNextEntryId.plus('1');
        })

        this._reportNextEntryId = this._reportNextEntryId.plus('1');
    }

    deleteReport(suggestionId: string) {
        this.startWriteBatch();

        this._writeBatch.delete(doc(this._suggestionsCollection, suggestionId));

        // Also add pending delete to list of suggestions
        this._writeCallbacks.push(() => {
            delete this._reports[suggestionId];
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

    private async build() {
        const guildFields = (await getDoc(this._rootDocument)).data();

        if (guildFields !== undefined) {
            this._suggestionNextEntryId = new Big(guildFields.suggestionNextEntryId || '0');
            this._reportNextEntryId = new Big(guildFields.reportNextEntryId || '0');
        }

        const rolesResult = await getDocs(this._rolesCollection);
        const coursesResult = await getDocs(this._coursesCollection);

        rolesResult.forEach(document => {
            this._roles[document.id] = document.data() as any;
        })

        coursesResult.forEach(snapshot => {
            this._courses[snapshot.data().name] = snapshot.data();
        });

        this._students = (await getDocs(this._studentsCollection)).docs.reduce(
            (result, document) => {
                if (document.data()._verified)
                    result.verified.push(document.data());
                else
                    result.unverified.push(document.data());

                return result;
            }
            , { unverified: [], verified: [] } as typeof this._students
        )

        this._suggestions = (await getDocs(this._suggestionsCollection)).docs.reduce(
            (result, document) => {
                result[document.id] = document.data();
                return result;
            }, {} as typeof this._suggestions);
        this._reports = (await getDocs(this._reportsCollection)).docs.reduce(
            (result, document) => {
                result[document.id] = document.data();
                return result;
            }, {} as typeof this._reports);
    }

    /**
     * Uses an existing write batch if intialized, otherwise creates a new write batch.
     */
    private startWriteBatch(): asserts this is { _writeBatch: WriteBatch } {
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
        await result.build();
        return result;
    }
}
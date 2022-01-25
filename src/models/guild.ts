import { collection, CollectionReference, doc, DocumentData, DocumentReference, getDoc, getDocs, writeBatch, WriteBatch } from 'firebase/firestore';

import { firestoreApp } from '../database.js';
import { Course } from './course.js';

type WriteCallback = () => void;

export class Guild {
    _rootDocument: DocumentReference<DocumentData>;
    _rolesCollection: CollectionReference<DocumentData>;
    _coursesCollection: CollectionReference<Course>;

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

    _writeBatch: WriteBatch | undefined;
    _writeCallbacks: Array<WriteCallback>;

    constructor(id: string) {
        this._rootDocument = doc(firestoreApp, `guilds/${id}`);
        this._rolesCollection = collection(this._rootDocument, 'roles');
        this._coursesCollection = collection(this._rootDocument, 'courses').withConverter(Course.converter());

        this._courses = {};

        this._roles = {};

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

    updateCourse(course: Course) {
        this.addCourse(course);
    }

    //addCourseDeadline(courseName: string, )

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
        const rolesResult = await getDocs(this._rolesCollection);
        const coursesResult = await getDocs(this._coursesCollection);

        rolesResult.forEach(document => {
            this._roles[document.id] = document.data() as any;
        })

        coursesResult.forEach(snapshot => {
            this._courses[snapshot.data().name] = snapshot.data();
        });
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
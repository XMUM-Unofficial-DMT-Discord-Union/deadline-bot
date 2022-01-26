import 'firebase/firestore';
import { doc, FirestoreDataConverter, getDoc } from 'firebase/firestore';

import { firestoreApp } from '../database.js';

export class Student {
    _name: string;
    _discordName: string;
    _id: string;
    _discordId: string;
    _enrolledBatch: string;
    _remindTime: number;
    _verified: boolean;

    constructor(name: string, discordName: string, id: string, discordId: string, enrolledBatch: string, remindTime: number = 604800000, verified: boolean = false) {
        this._name = name;
        this._discordName = discordName;
        this._id = id;
        this._discordId = discordId;
        this._enrolledBatch = enrolledBatch;
        this._remindTime = remindTime;
        this._verified = verified;
    }

    setVerified() {
        this._verified = true;
    }

    isVerified() {
        return this._verified;
    }

    static async get(id: string): Promise<Student | undefined> {
        return (await getDoc(doc(firestoreApp, id).withConverter(Student.converter()))).data();
    }

    static converter(): FirestoreDataConverter<Student> {
        return {
            fromFirestore: (snapshot) => {
                // By default, the remind time is 1 week before the deadline
                const defaultRemindTime = 604800000;
                return new Student(
                    snapshot.data().name,
                    snapshot.data().discordName,
                    snapshot.data().id,
                    snapshot.id,
                    snapshot.data().enrolledBatch,
                    snapshot.data().remindTime === 0 ? defaultRemindTime : snapshot.data().remindTime,
                    snapshot.data().verified);
            },
            toFirestore: (student: Student) => {
                return {
                    name: student._name,
                    discordName: student._discordName,
                    id: student._id,
                    enrolledBatch: student._enrolledBatch,
                    remindTime: student._remindTime,
                    verified: student._verified
                };
            }
        }
    }
}
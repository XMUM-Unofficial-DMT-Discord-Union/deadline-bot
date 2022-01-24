import 'firebase/firestore';
import { doc, FirestoreDataConverter, getDoc } from 'firebase/firestore';

import '../database';
import { firestoreApp } from '../database';

export class Student {
    _name: string
    _id: string;
    _discordId: string;
    _remindTime: number;

    constructor(name: string, id: string, discordId: string, remindTime: number) {
        this._name = name;
        this._id = id;
        this._discordId = discordId;
        this._remindTime = remindTime;
    }

    static async get(id: string): Promise<Student | undefined> {
        return (await getDoc(doc(firestoreApp, id).withConverter(Student.converter()))).data();
    }

    static converter(): FirestoreDataConverter<Student> {
        return {
            fromFirestore: (snapshot) => {
                // By default, the remind time is 1 week before the deadline
                const defaultRemindTime = 604800000;
                return new Student(snapshot.data().name, snapshot.data().id, snapshot.id,
                    snapshot.data().remindTime === 0 ? defaultRemindTime : snapshot.data().remindTime);
            },
            toFirestore: (student: Student) => {
                return {
                    name: student._name,
                    id: student._discordId,
                    remindTime: student._remindTime
                };
            }
        }
    }
}
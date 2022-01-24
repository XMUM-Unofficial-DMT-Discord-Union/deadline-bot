import 'firebase/firestore';
import { FirestoreDataConverter } from 'firebase/firestore';

type StudentId = string;

export type Deadline = {
    name: string,
    description: string,
    url: string,
    datetime: Date,
    excluded: Array<StudentId>
}

export class Course {
    _name: string;
    _deadlines: Array<Deadline>;
    _students: Array<StudentId>;

    constructor(name: string, deadlines: Array<Deadline> = [], students: Array<StudentId> = []) {
        this._name = name;
        this._deadlines = deadlines;
        this._students = students;
    }

    members() {
        return {
            _name: this._name,
            _deadlines: this._deadlines,
            _students: this._students,
        }
    }

    static converter(): FirestoreDataConverter<Course> {
        return {
            fromFirestore: (snapshot) => {
                return new Course(snapshot.id, snapshot.data().deadlines?.map((deadline: any) => {
                    deadline.datetime = new Date(deadline.datetime.seconds * 1000);
                    return deadline;
                }), snapshot.data().students);
            },
            toFirestore: (course: Course) => {
                return {
                    deadlines: course._deadlines,
                    students: course._students
                };
            }
        }
    }
}
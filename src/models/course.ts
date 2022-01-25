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
    name: string;
    deadlines: Array<Deadline>;
    students: Array<StudentId>;

    constructor(name: string, deadlines: Array<Deadline> = [], students: Array<StudentId> = []) {
        this.name = name;
        this.deadlines = deadlines;
        this.students = students;
    }

    members() {
        return {
            name: this.name,
            deadlines: this.deadlines,
            students: this.students,
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
                    deadlines: course.deadlines,
                    students: course.students
                };
            }
        }
    }
}
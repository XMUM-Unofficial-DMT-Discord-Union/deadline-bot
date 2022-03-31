type StudentId = string;

export type Deadline = {
    name: string,
    description: string,
    url: string,
    datetime: Date,
    excluded: Array<StudentId>;
};

export class Course {
    name: string;
    deadlines: Array<Deadline>;
    students: Array<StudentId>;

    constructor(name: string, deadlines: Array<Deadline> = [], students: Array<StudentId> = []) {
        this.name = name;
        this.deadlines = deadlines;
        this.students = students;
    }
}
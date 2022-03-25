import 'firebase/firestore';
import { FirestoreDataConverter } from 'firebase/firestore';
import ms, { StringValue } from 'ms';

import { prisma } from '../utilities.js';

export class Student {
    name: string;
    id: string;
    discordId: string;
    enrolledBatch: string;
    remindTime: number;
    verified: boolean;
    type: ('admin' | 'mod' | 'dev' | 'verified' | 'unverified')[];

    constructor(name: string,
        id: string,
        discordId: string,
        enrolledBatch: string,
        remindTime: number = 604800000,
        verified: boolean = false,
        type: ('admin' | 'mod' | 'dev' | 'verified' | 'unverified')[] = verified ? ['verified'] : ['unverified']) {

        this.name = name;
        this.id = id;
        this.discordId = discordId;
        this.enrolledBatch = enrolledBatch;
        this.remindTime = remindTime;
        this.verified = verified;

        this.type = type;
    }

    async setVerified() {
        this.verified = true;
        await prisma.student.update({
            where: {
                discordId: this.id
            },
            include: {
                studentsToRoles: true
            },
            data: {
                studentsToRoles: {
                    create: {
                        role: {
                            connect: {
                                guildId_type: {
                                    guildId: process.env.GUILD_ID as string,
                                    type: 'VERIFIED'
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    isVerified() {
        return this.verified;
    }

    static async get(id: string): Promise<Student | undefined> {
        const student = await prisma.student.findUnique({
            where: {
                discordId: id
            },
        });

        const roles = await prisma.studentsToRoles.findMany({
            where: {
                studentDiscordId: id
            }
        });

        // Temporary adaptation to legacy code
        if (student !== null)
            return new Student(
                student.name,
                student.id,
                student.discordId,
                student.enrolledBatch,
                ms(student.remindTime as StringValue),
                roles.find(role => role.roleType === 'VERIFIED') !== undefined,
                roles.map(role => {
                    if (role.roleType === 'ADMIN')
                        return "admin";
                    else if (role.roleType === 'MOD')
                        return "mod";
                    else if (role.roleType === 'DEV')
                        return "dev";
                    else if (role.roleType === 'VERIFIED')
                        return "verified";
                    return "unverified";
                })
            );
        return undefined;

        //return (await getDoc(doc(firestoreApp, `guilds/${process.env.GUILD_ID as string}/students/${id}`).withConverter(Student.converter()))).data();
    }

    static converter(): FirestoreDataConverter<Student> {
        return {
            fromFirestore: (snapshot) => {
                // By default, the remind time is 1 week before the deadline
                const defaultRemindTime = 604800000;
                return new Student(
                    snapshot.data().name,
                    snapshot.data().id,
                    snapshot.id,
                    snapshot.data().enrolledBatch,
                    snapshot.data().remindTime === 0 ? defaultRemindTime : snapshot.data().remindTime,
                    snapshot.data().verified,
                    snapshot.data().type);
            },
            toFirestore: (student: Student) => {
                return {
                    name: student.name,
                    id: student.id,
                    enrolledBatch: student.enrolledBatch,
                    remindTime: student.remindTime,
                    verified: student.verified,
                    type: student.type
                };
            }
        };
    }
}
import { RESTPutAPIApplicationGuildCommandsResult } from 'discord-api-types';
import { collection, CollectionReference, doc, DocumentData, DocumentReference, getDoc, getDocs, getDocsFromServer, query, setDoc, updateDoc, where, writeBatch, WriteBatch } from 'firebase/firestore';

import { firestoreApp } from '../database';

export class Guild {
    _rootDocument: DocumentReference<DocumentData>;
    _rolesCollection: CollectionReference<DocumentData>;

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

    constructor(id: string) {
        this._rootDocument = doc(firestoreApp, `guilds/${id}`);
        this._rolesCollection = collection(this._rootDocument, 'roles');

        this._roles = {};
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

    async getAdminRoleDetails() {
        this._roles['admin'] = (await getDoc(doc(this._rolesCollection, 'admin'))).data() as any;

        return this._roles['admin'];
    }

    updateAdminRoleId(id: string) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._rolesCollection, 'admin'), {
            id: id
        }, { merge: true, mergeFields: ['id'] });
    }

    async getModRoleDetails() {
        this._roles['mod'] = (await getDoc(doc(this._rolesCollection, 'mod'))).data() as any;

        return this._roles['mod'];
    }

    updateModRoleId(id: string) {
        this.startWriteBatch();

        this._writeBatch.set(doc(this._rolesCollection, 'mod'), {
            id: id
        }, { merge: true, mergeFields: ['id'] });
    }

    async save() {
        if (!this.writeBatchStarted(this._writeBatch)) {
            Promise.reject('There\'s nothing to write!');
            return;
        }

        console.log('Saving...');
        await this._writeBatch.commit();
        console.log('Saved!');


        // Remove the instance afterwards
        this._writeBatch = undefined;
    }

    private async build() {
        const result = await getDocs(this._rolesCollection);

        result.forEach(document => {
            this._roles[document.id] = document.data() as any;
        })
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
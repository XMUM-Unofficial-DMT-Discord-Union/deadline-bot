import * as firebase from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import path from 'path/posix';

import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync(path.resolve() + '/.env.database.json').toString());

const firebaseClient = firebase.initializeApp(firebaseConfig);

const firestoreApp = getFirestore(firebaseClient);

const auth = getAuth(firebaseClient);

//if (process.env.ENVIRONMENT as string === 'production') {
// We have to sign in
const authConfig = JSON.parse(fs.readFileSync(path.resolve() + '/.env.database_credentials.json').toString());
await signInWithEmailAndPassword(auth, authConfig.email, authConfig.password)
    .then(_ => console.log('Signed into database.'))
    .catch(error => {
        console.log(error)
    });
//}

export { firestoreApp, auth };
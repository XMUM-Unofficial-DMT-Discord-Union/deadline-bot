import * as firebase from 'firebase/app';
import { clearIndexedDbPersistence, getFirestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import path from 'path/posix';


const firebaseConfig = require(path.resolve() + '/.env.database.json');

const client = firebase.initializeApp(firebaseConfig);

const firestoreApp = getFirestore(client);

(async () => {
    //if (process.env.ENVIRONMENT as string === 'production') {
    // We have to sign in
    const auth = getAuth(client);
    const authConfig = require(path.resolve() + '/.env.database_credentials.json');
    await signInWithEmailAndPassword(auth, authConfig.email, authConfig.password).then(_ => console.log('Signed into database.'));
    //}
})();

export { firestoreApp };
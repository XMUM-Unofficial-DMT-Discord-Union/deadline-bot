import * as firebase from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import path from 'path/posix';


const firebaseConfig = require(path.resolve() + '/.env.database.json');

const firebaseClient = firebase.initializeApp(firebaseConfig);

const firestoreApp = getFirestore(firebaseClient);

const auth = getAuth(firebaseClient);

//if (process.env.ENVIRONMENT as string === 'production') {
// We have to sign in
const authConfig = require(path.resolve() + '/.env.database_credentials.json');
await signInWithEmailAndPassword(auth, authConfig.email, authConfig.password)
    .then(_ => console.log('Signed into database.'))
    .catch(error => {
        console.log(error)
    });
//}

export { firestoreApp, auth };
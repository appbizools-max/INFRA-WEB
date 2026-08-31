import auth from '@react-native-firebase/auth';

// The native Firebase SDK automatically initializes itself using the 
// google-services.json file, so we don't need initializeApp() here!

// Helper function to assert a tenant role (mocked for now, 
// replace with your actual Firestore/Custom Claims logic)
export const assertTenantRole = async () => {
  const currentUser = auth().currentUser;
  
  if (!currentUser) {
    throw new Error('User is not authenticated.');
  }

  // Example: fetch user document from Firestore to verify role
  // const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
  // if (userDoc.data()?.role !== 'tenant') throw new Error('Unauthorized');
  
  return true;
};

// Export auth to use throughout the app
export { auth };

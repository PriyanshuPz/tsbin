const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config();

// --- Configuration ---
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// --- Constants for Database and Collection ---
const DATABASE_ID = 'tsbin';
const DATABASE_NAME = 'tsbin'; // to be pasted on .env file - APPWRITE_DATABASE_ID
const COLLECTION_ID = 'trash'; // APPWRITE_TABLE_ID
const COLLECTION_NAME = 'trash';

/**
 * Helper function to create an attribute and handle 'already exists' errors.
 * @param {Promise} attributePromise - The SDK function call to create an attribute.
 * @param {string} attributeName - The name of the attribute for logging.
 */
const createAttribute = async (attributePromise, attributeName) => {
    try {
        await attributePromise;
        console.log(`✅ Attribute '${attributeName}' created successfully.`);
    } catch (error) {
        // Appwrite throws a 409 conflict error if the attribute already exists.
        if (error.code === 409) {
            console.log(`- Attribute '${attributeName}' already exists. Skipping.`);
        } else {
            console.error(`❌ Error creating attribute '${attributeName}':`, error);
            throw error; // Re-throw other errors
        }
    }
};

/**
 * Main function to set up the Appwrite database and collection.
 */
const setupDatabase = async () => {
    console.log('🚀 Starting Appwrite database setup...');

    try {
        // --- Step 1: Create the Database ---
        try {
            await databases.create(DATABASE_ID, DATABASE_NAME);
            console.log(`✅ Database '${DATABASE_NAME}' created with ID: ${DATABASE_ID}`);
        } catch (error) {
            if (error.code === 409) {
                console.log(`- Database '${DATABASE_NAME}' already exists. Skipping creation.`);
            } else {
                throw error; // Re-throw other errors
            }
        }

        // --- Step 2: Create the Collection ---
        try {
            await databases.createCollection(DATABASE_ID, COLLECTION_ID, COLLECTION_NAME);
            console.log(`✅ Collection '${COLLECTION_NAME}' created with ID: ${COLLECTION_ID}`);
        } catch (error) {
            if (error.code === 409) {
                console.log(`- Collection '${COLLECTION_NAME}' already exists. Skipping creation.`);
            } else {
                throw error;
            }
        }
        
        console.log('\n⚙️  Setting up attributes for the collection...');

        // --- Step 3: Create Attributes ---
        await createAttribute(databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'chat_id', 1024, false), 'chat_id');
        await createAttribute(databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'content', 999999999, false), 'content');
        await createAttribute(databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, 'encrypted', false, false), 'encrypted');
        await createAttribute(databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'encryption_meta', 999999999, true), 'encryption_meta');
        await createAttribute(databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, 'size', true), 'size');
        await createAttribute(databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'slug', 767, true), 'slug');
        await createAttribute(databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'expires_at', false), 'expires_at');
        await createAttribute(databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, 'views', false, 0), 'views');
        await createAttribute(databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'created_ip', 1024, false), 'created_ip');
        await createAttribute(databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'type', 4096, true), 'type');
        await createAttribute(databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'passcode_hash', 1073741824, true), 'passcode_hash');
        
        // ** THE FIX IS HERE: The default value '[]' has been removed (set to null) **
        await createAttribute(databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'message_ids', 1073741824, false, null, true), 'message_ids');

        console.log('\n🎉 Setup complete!');
        console.log('===================================');
        console.log(`Database ID:   ${DATABASE_ID}`);
        console.log(`Collection ID: ${COLLECTION_ID}`);
        console.log('===================================');

    } catch (error) {
        console.error('\n❌ An unexpected error occurred during setup:', error.message);
    }
};

// Run the setup function
setupDatabase();
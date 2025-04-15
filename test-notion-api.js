require('dotenv').config();
const { Client } = require('@notionhq/client');

// Initialize the Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function testNotionConnection() {
  try {
    // List users to test the connection
    const listUsersResponse = await notion.users.list({});
    console.log("Successfully connected to Notion API!");
    console.log("Users:", listUsersResponse.results.map(user => user.name));
    
    // List all databases the integration has access to
    console.log("\nAttempting to list accessible databases...");
    const searchResponse = await notion.search({
      filter: {
        value: 'database',
        property: 'object'
      }
    });
    
    console.log(`Found ${searchResponse.results.length} databases:`);
    searchResponse.results.forEach(db => {
      console.log(`- ${db.title[0]?.plain_text || 'Untitled'} (ID: ${db.id})`);
    });
    
  } catch (error) {
    console.error("Error connecting to Notion API:", error.message);
    console.error("Full error:", error);
  }
}

testNotionConnection();

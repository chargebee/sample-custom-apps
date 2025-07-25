
import axios from "axios";

export const handle = async (/** @type {import('../types.d.ts').EventRecord} */ event) => {
  try {
    // Make a POST request using axios
    await axios.post('https://eoivy770x9bk27f.m.pipedream.net', event, {
      headers: {
        'Content-Type': 'application/json',
        // Add any additional headers you need
      }
    });
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({
        message: "Customer created successfully"
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to create customer",
        // @ts-ignore
        error: error.message
      })
    };
  }
};
const PANTRY_ID = "ba92f581-06fe-4cac-8aa8-8f78678d899b";
const BASKET_NAME = "basket_for_cows_data";
const BASE_URL = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${BASKET_NAME}`;

// 1. Function to Save Data (Creates or Overwrites)
export const saveToPantry = async (data: any) => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // ADD THIS LINE TO SEE THE ACTUAL MESSAGE
      const errorText = await response.text();
      console.error("Pantry Server says:", errorText);

      throw new Error("Failed to save data");
    }

    return true;
  } catch (error) {
    console.error("Pantry Save Error:", error);
    return false;
  }
};
// 2. Function to Get Data
export const getFromPantry = async () => {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error("Basket not found");
    return await response.json();
  } catch (error) {
    console.error("Pantry Fetch Error:", error);
    return null;
  }
};
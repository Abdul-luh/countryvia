const fs = require("fs");
const path = require("path");

async function fetchCountries() {
  console.log("Fetching countries data...");
  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,capital,cca2,flags,region,continents",
    );
    const data = await response.json();

    const processedData = data
      .filter((c) => c.capital && c.capital.length > 0) // Ensure it has a capital
      .map((c) => ({
        name: c.name.common,
        capital: c.capital[0],
        code: c.cca2,
        flag: c.flags.png,
        region: c.region,
        continent: c.continents[0],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const outputPath = path.join(__dirname, "../data/countries.json");
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
    console.log(
      `Successfully saved ${processedData.length} countries to ${outputPath}`,
    );
  } catch (error) {
    console.error("Error fetching countries:", error);
    process.exit(1);
  }
}

fetchCountries();

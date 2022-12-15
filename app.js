const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Db Server : ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//State Table

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    state_Name: dbObject.state_name,
    population: dbObject.population,
  };
};

// District Table

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API - 1 (GET) Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const getStateQuery = `
        SELECT *
            FROM 
             state;`;

  const stateArray = await database.all(getStateQuery);
  response.send(
    stateArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

// API - 2 (GET) Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT *
            FROM
                state
            where 
                state_id = ${stateId};`;

  const state = await database.all(getStateQuery);
  response.send(convertStateDbObjectToResponseObject(state));
});

// API-3 (POST) Create a district in the district table, `district_id` is auto-incremented
// District Table

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO 
        district {state_id,district_name,curved,active,deaths}
    values 
        (${stateId},${district_name},${cured},${active},${deaths})`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

// API-4 (GET) Returns a district based on the district ID
//District Table

app.get("/districts/:districtId/", async (request, response) => {
  const { district_id } = request.params;
  const getDistrictQuery = `
        SELECT * 
            FROM
                district
            where
                district_id = ${districtID}`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});

// API-5 (DELETE) Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
     district  
    where 
        district_id  = ${districtID}`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API -6 (PUT) Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE 
        district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};`;

  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API -7 (GET) Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const states = await database.get(getStateStatsQuery);
  response.send({
    totalCases: states["SUM(cases)"],
    totalCured: states["SUM(cured)"],
    totalActive: states["SUM(active)"],
    totalDeaths: states["SUM(deaths)"],
  });
});

//API-8(GET) Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.resolve('src/localdb', 'teams.json');

const initializeDB = () => {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true }); // Ensure the directory exists
    const initialData = [];
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  }
};

const getTeams = () => {
  initializeDB();
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
};

const addTeam = (teamName) => {
  const teams = getTeams();
  if (teams.some(team => team.name.toLowerCase() === teamName.toLowerCase())) {
    throw new Error('Team name must be unique');
  }
  const newTeam = { id: uuidv4(), name: teamName };
  teams.push(newTeam);
  fs.writeFileSync(dbPath, JSON.stringify(teams, null, 2));
  return newTeam;
};

export async function GET() {
  try {
    const teams = getTeams();
    return new Response(JSON.stringify({ teams }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const teamName = formData.get('teamName');
    const newTeam = addTeam(teamName);
    return new Response(JSON.stringify({ newTeam }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

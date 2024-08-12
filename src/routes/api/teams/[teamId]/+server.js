import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.resolve('src/localdb', 'teams.json');
const teamsSprintsDir = path.resolve('src/localdb/team_sprints');

const getTeams = () => {
  if (!fs.existsSync(dbPath)) {
    return [];
  }
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
};

const getTeamById = (id) => {
  const teams = getTeams();
  console.log(`Looking for team with id: ${id}`);
  console.log(`Available teams: ${JSON.stringify(teams, null, 2)}`);
  return teams.find(team => team.id === id);
};

const ensureDirectoryAndFile = (id) => {
  if (!fs.existsSync(teamsSprintsDir)) {
    fs.mkdirSync(teamsSprintsDir, { recursive: true });
    console.log(`Created directory: ${teamsSprintsDir}`);
  }

  const teamFilePath = path.resolve(teamsSprintsDir, `${id}.json`);
  if (!fs.existsSync(teamFilePath)) {
    fs.writeFileSync(teamFilePath, JSON.stringify([]));
    console.log(`Created file: ${teamFilePath}`);
  }
  return teamFilePath;
};

const getSprints = (id) => {
  const teamFilePath = ensureDirectoryAndFile(id);
  const data = fs.readFileSync(teamFilePath, 'utf-8');
  return JSON.parse(data);
};

const addSprint = (id, sprintName) => {
  const sprints = getSprints(id);
  if (sprints.some(sprint => sprint.name.toLowerCase() === sprintName.toLowerCase())) {
    throw new Error('Sprint name must be unique');
  }
  const newSprint = {
    id: uuidv4(),
    name: sprintName,
    createdTime: new Date().toISOString(),
    endTime: null,
    numberOfBugs: 0,
    resolvedOrVerified: 0,
    bugs: [] // Initialize as an empty array
  };
  sprints.push(newSprint);
  const teamFilePath = ensureDirectoryAndFile(id);
  fs.writeFileSync(teamFilePath, JSON.stringify(sprints, null, 2));
  return newSprint;
};

const getSprintById = (teamId, sprintId) => {
  const sprints = getSprints(teamId);
  return sprints.find(sprint => sprint.id === sprintId);
};

const updateSprintBugs = (teamId, sprintId, bugs) => {
  const sprints = getSprints(teamId);
  const sprintIndex = sprints.findIndex(sprint => sprint.id === sprintId);
  if (sprintIndex === -1) {
    throw new Error('Sprint not found');
  }
  sprints[sprintIndex].bugs = bugs;
  sprints[sprintIndex].numberOfBugs = bugs.length;
  sprints[sprintIndex].resolvedOrVerified = bugs.filter(bug => bug.resolvedOrVerified).length;
  const teamFilePath = ensureDirectoryAndFile(teamId);
  fs.writeFileSync(teamFilePath, JSON.stringify(sprints, null, 2));
  return sprints[sprintIndex];
};

export async function GET({ params, request }) {
  const url = new URL(request.url);
  const isSprintDetails = url.pathname.includes('/sprints/');
  try {
    if (isSprintDetails) {
      const sprintId = url.pathname.split('/').pop();
      const sprint = getSprintById(params.teamId, sprintId);
      if (sprint) {
        return new Response(JSON.stringify({ sprint }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Sprint not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    } else {
      const team = getTeamById(params.teamId);
      if (team) {
        const sprints = getSprints(params.teamId);
        return new Response(JSON.stringify({ team, sprints }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Team not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
  } catch (error) {
    console.error('GET Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function POST({ request, params }) {
  const url = new URL(request.url);
  const isSprintDetails = url.pathname.includes('/sprints/');
  try {
    if (isSprintDetails) {
      const sprintId = url.pathname.split('/').pop();
      const formData = await request.formData();
      const bugs = JSON.parse(formData.get('bugs'));
      const updatedSprint = updateSprintBugs(params.teamId, sprintId, bugs);
      return new Response(JSON.stringify({ updatedSprint }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      const formData = await request.formData();
      const sprintName = formData.get('sprintName');
      const newSprint = addSprint(params.teamId, sprintName);
      return new Response(JSON.stringify({ newSprint }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('POST Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

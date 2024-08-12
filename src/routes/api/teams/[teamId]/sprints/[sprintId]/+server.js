import fs from 'fs';
import path from 'path';

const teamsSprintsDir = path.resolve('src/localdb/team_sprints');

const ensureDirectoryAndFile = (teamId) => {
  if (!fs.existsSync(teamsSprintsDir)) {
    fs.mkdirSync(teamsSprintsDir, { recursive: true });
    console.log(`Created directory: ${teamsSprintsDir}`);
  }

  const teamFilePath = path.resolve(teamsSprintsDir, `${teamId}.json`);
  if (!fs.existsSync(teamFilePath)) {
    fs.writeFileSync(teamFilePath, JSON.stringify([]));
    console.log(`Created file: ${teamFilePath}`);
  }
  return teamFilePath;
};

const getSprints = (teamId) => {
  const teamFilePath = ensureDirectoryAndFile(teamId);
  const data = fs.readFileSync(teamFilePath, 'utf-8');
  return JSON.parse(data);
};

const getSprintById = (teamId, sprintId) => {
  const sprints = getSprints(teamId);
  return sprints.find(sprint => sprint.id === sprintId);
};

const updateSprintDetails = (teamId, sprintId, { bugs, endTime }) => {
  const sprints = getSprints(teamId);
  const sprintIndex = sprints.findIndex(sprint => sprint.id === sprintId);
  if (sprintIndex === -1) {
    throw new Error('Sprint not found');
  }
  if (bugs) {
    sprints[sprintIndex].bugs = bugs;
    sprints[sprintIndex].numberOfBugs = bugs.length;
    sprints[sprintIndex].resolvedOrVerified = bugs.filter(bug => bug.resolvedOrVerified).length;
  }
  if (endTime) {
    sprints[sprintIndex].endTime = endTime;
  }
  const teamFilePath = ensureDirectoryAndFile(teamId);
  fs.writeFileSync(teamFilePath, JSON.stringify(sprints, null, 2));
  return sprints[sprintIndex];
};

export async function GET({ params }) {
  try {
    const { teamId, sprintId } = params;
    console.log(`Fetching sprint with teamId: ${teamId}, sprintId: ${sprintId}`);
    const sprint = getSprintById(teamId, sprintId);
    if (sprint) {
      return new Response(JSON.stringify({ sprint }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.log('Sprint not found.');
      return new Response(JSON.stringify({ error: 'Sprint not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
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
  try {
    const { teamId, sprintId } = params;
    const { bugs, endTime } = await request.json();
    const updatedSprint = updateSprintDetails(teamId, sprintId, { bugs, endTime });
    return new Response(JSON.stringify({ sprint: updatedSprint }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
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

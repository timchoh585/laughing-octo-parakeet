import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db';

// Fetch all teams
export async function GET({ params }) {
    const { teamId } = params;

    if (teamId) {
        // Fetch sprints for a specific team
        try {
            const sprintsSnapshot = await db.collection('teams').doc(teamId).collection('sprints').orderBy('createdAt', 'desc').get();

            if (sprintsSnapshot.empty) {
                return json({ message: 'No sprints found' }, { status: 404 });
            }

            const sprints = [];
            sprintsSnapshot.forEach(doc => {
                sprints.push({ id: doc.id, ...doc.data() });
            });

            return json(sprints);
        } catch (err) {
            console.error('Error fetching sprints:', err);
            throw error(500, 'Failed to fetch sprints');
        }
    } else {
        // Fetch all teams
        try {
            const teamsSnapshot = await db.collection('teams').get();
            
            if (teamsSnapshot.empty) {
                return json({ message: 'No teams found' }, { status: 404 });
            }

            const teams = [];
            teamsSnapshot.forEach(doc => {
                teams.push({ id: doc.id, ...doc.data() });
            });

            return json(teams);
        } catch (err) {
            console.error('Error fetching teams:', err);
            throw error(500, 'Failed to fetch teams');
        }
    }
}

// Add a new team
export async function POST({ request, params }) {
    const { teamId } = params;

    if (teamId) {
        // Add a new sprint to a specific team
        try {
            const { name } = await request.json();

            if (!name) {
                throw error(400, 'Sprint name is required');
            }

            const sprintRef = await db.collection('teams').doc(teamId).collection('sprints').add({
                name,
                createdAt: new Date().toISOString(),
                bugs: []  // Initialize with an empty list of bugs
            });

            return json({ id: sprintRef.id, name }, { status: 201 });
        } catch (err) {
            console.error('Error adding sprint:', err);
            throw error(500, 'Failed to add sprint');
        }
    } else {
        // Add a new team
        try {
            const { name } = await request.json();

            if (!name) {
                throw error(400, 'Team name is required');
            }

            const teamRef = await db.collection('teams').add({
                name,
                createdAt: new Date().toISOString(),
            });

            return json({ id: teamRef.id, name }, { status: 201 });
        } catch (err) {
            console.error('Error adding team:', err);
            throw error(500, 'Failed to add team');
        }
    }
}

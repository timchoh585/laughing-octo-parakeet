import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db';

export async function GET({ params }) {
    const { teamId } = params;

    if (!teamId) {
        throw error(400, 'teamId is required');
    }

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
}

export async function POST({ request, params }) {
    const { teamId } = params;

    if (!teamId) {
        throw error(400, 'teamId is required');
    }

    try {
        const { name } = await request.json();

        if (!name) {
            throw error(400, 'Sprint name is required');
        }

        const sprintRef = await db.collection('teams').doc(teamId).collection('sprints')
            .add({
                name,
                createdAt: new Date().toISOString(),
                bugs: []
            });

        // Return the sprint details including the generated ID
        return json({ id: sprintRef.id, name }, { status: 201 });
    } catch (err) {
        console.error('Error adding sprint:', err);
        throw error(500, 'Failed to add sprint');
    }
}

export async function DELETE({ params }) {
    const { teamId, sprintId } = params;

    if (!teamId || !sprintId) {
        throw error(400, 'teamId and sprintId are required');
    }

    try {
        const sprintRef = db.collection('teams').doc(teamId).collection('sprints').doc(sprintId);
        const sprintDoc = await sprintRef.get();

        if (!sprintDoc.exists) {
            throw error(404, 'Sprint not found');
        }

        await sprintRef.delete();

        return json({ message: 'Sprint deleted successfully' }, { status: 200 });
    } catch (err) {
        console.error('Error deleting sprint:', err);
        throw error(500, 'Failed to delete sprint');
    }
}
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db';

export async function GET({ params }) {
    const { teamId, sprintId } = params;

    console.log(`API hit with teamId: ${teamId}, sprintId: ${sprintId}`);  // Debugging line

    try {
        const sprintDoc = await db.collection('teams').doc(teamId).collection('sprints').doc(sprintId).get();

        if (!sprintDoc.exists) {
            console.log('Sprint document does not exist');  // Debugging line
            throw error(404, 'Sprint not found');
        }

        console.log('Sprint data found:', sprintDoc.data());  // Debugging line
        return json(sprintDoc.data());
    } catch (err) {
        console.error('Error fetching sprint:', err);
        throw error(500, 'Failed to fetch sprint');
    }
}

// Add a bug to a sprint
export async function POST({ request, params }) {
    const { teamId, sprintId } = params;

    if (!sprintId) {
        throw error(400, 'sprintId is required');
    }

    try {
        const { bugId } = await request.json();

        if (!bugId) {
            throw error(400, 'Bug ID is required');
        }

        const sprintRef = db.collection('teams').doc(teamId).collection('sprints').doc(sprintId);
        await sprintRef.update({
            bugs: db.FieldValue.arrayUnion(bugId)
        });

        const updatedSprint = await sprintRef.get();
        return json({ id: updatedSprint.id, ...updatedSprint.data() }, { status: 200 });
    } catch (err) {
        console.error('Error adding bug:', err);
        throw error(500, 'Failed to add bug');
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

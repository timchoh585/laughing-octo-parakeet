import { json } from '@sveltejs/kit';
import { db } from '$lib/db';

export async function DELETE({ params, request }) {
    const { teamId, sprintId } = params;
    const { bugIds } = await request.json();

    if (!teamId || !sprintId || !Array.isArray(bugIds)) {
        return json({ message: 'Invalid request data' }, { status: 400 });
    }

    console.log('Received bug IDs:', bugIds);

    try {
        const sprintRef = db.collection('teams').doc(teamId).collection('sprints').doc(sprintId);
        const bugCollectionRef = sprintRef.collection('bugs');

        const validBugIds = bugIds
            .map(bugId => String(bugId).trim())
            .filter(bugId => {
                const isValid = bugId !== '';
                if (!isValid) {
                    console.warn(`Invalid bugId detected: "${bugId}"`);
                }
                return isValid;
            });

        console.log('Valid bug IDs after filtering and conversion:', validBugIds);

        if (validBugIds.length === 0) {
            return json({ message: 'No valid bug IDs provided' }, { status: 400 });
        }

        const deletePromises = validBugIds.map(async (bugId) => {
            const bugDocRef = bugCollectionRef.doc(bugId);
            await bugDocRef.delete();
            console.log(`Bug with ID ${bugId} deleted successfully`);
        });

        await Promise.all(deletePromises);

        return json({ message: 'Bugs deleted successfully' });
    } catch (err) {
        console.error('Error deleting bugs from sprint:', err);
        return json({ message: 'Failed to delete bugs' }, { status: 500 });
    }
}

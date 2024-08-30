import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db';

export async function PUT({ params, request }) {
    const { teamId, sprintId, bugId } = params;
    const { newCategory } = await request.json();

    if (!teamId || !sprintId || !bugId || !newCategory) {
        console.error('Missing parameters for updating bug category', { teamId, sprintId, bugId, newCategory });
        throw error(400, 'teamId, sprintId, bugId, and newCategory are required');
    }

    try {
        const bugRef = db
            .collection('teams')
            .doc(teamId)
            .collection('sprints')
            .doc(sprintId)
            .collection('bugs')
            .doc(bugId);

        const bugDoc = await bugRef.get();

        if (!bugDoc.exists) {
            console.error('Bug not found:', { bugId });
            throw error(404, 'Bug not found');
        }

        await bugRef.update({ category: newCategory });

        return json({ success: true, message: 'Bug category updated successfully' });
    } catch (err) {
        console.error('Failed to update bug category:', err);
        throw error(500, 'Failed to update bug category');
    }
}

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

export async function POST({ params, request }) {
    const { teamId, sprintId } = params;
    const { bugId, category } = await request.json();

    if (!teamId || !sprintId || !bugId) {
        console.error('Missing parameters for adding a bug', { teamId, sprintId, bugId });
        throw error(400, 'teamId, sprintId, and bugId are required');
    }

    try {
        const sprintRef = db
            .collection('teams')
            .doc(teamId)
            .collection('sprints')
            .doc(sprintId);

        const sprintDoc = await sprintRef.get();

        if (!sprintDoc.exists) {
            console.error('Sprint not found:', { sprintId });
            throw error(404, 'Sprint not found');
        }

        const bugRef = sprintRef.collection('bugs').doc(bugId);

        const bugDoc = await bugRef.get();

        if (bugDoc.exists) {
            console.error('Bug already exists:', { bugId });
            throw error(409, 'Bug already exists in the sprint');
        }

        const newBug = {
            id: bugId,
            category: category || 'To Do',
            // You can add more fields to the new bug document as needed
        };

        await bugRef.set(newBug);

        return json({ success: true, message: 'Bug added successfully', bug: newBug });
    } catch (err) {
        console.error('Failed to add bug to sprint:', err);
        throw error(500, 'Failed to add bug to sprint');
    }
}

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db';

export async function POST({ params, request }) {
    const { teamId, sprintId } = params;
    const { bugIds, sourceSprintId } = await request.json(); // Added `sourceSprintId`

    if (!teamId || !sprintId || !sourceSprintId || !bugIds || !Array.isArray(bugIds)) {
        console.error('Invalid request parameters:', { teamId, sprintId, sourceSprintId, bugIds });
        throw error(400, 'teamId, sprintId, sourceSprintId, and bugIds are required');
    }

    try {
        // Fetch the sprint to which the bugs should be copied
        const targetSprintRef = db.collection('teams').doc(teamId).collection('sprints').doc(sprintId);
        const targetSprintDoc = await targetSprintRef.get();

        if (!targetSprintDoc.exists) {
            console.error('Target sprint not found:', { teamId, sprintId });
            throw error(404, 'Target sprint not found');
        }

        // Copy each bug from the source sprint to the target sprint
        const batch = db.batch();
        let bugsFound = 0;

        for (let bugId of bugIds) {
            if (typeof bugId !== 'string') {
                bugId = bugId.toString(); // Convert bugId to string
            }

            if (!bugId || bugId.trim() === '') {
                console.warn('Invalid bugId after conversion:', bugId);
                continue;
            }

            // Use the sourceSprintId to fetch the bug from the original sprint
            const bugRef = db.collection('teams').doc(teamId).collection('sprints').doc(sourceSprintId).collection('bugs').doc(bugId);
            const bugDoc = await bugRef.get();

            if (bugDoc.exists) {
                const bugData = bugDoc.data();
                const newBugRef = targetSprintRef.collection('bugs').doc(bugId);
                batch.set(newBugRef, bugData);
                bugsFound++;
            } else {
                console.warn(`Bug with ID ${bugId} not found in source sprint ${sourceSprintId}`);
            }
        }

        if (bugsFound === 0) {
            console.error('No valid bugs found for rollover:', { teamId, sprintId, sourceSprintId, bugIds });
            throw error(404, 'No valid bugs found for rollover');
        }

        // Commit the batch operation to copy the bugs
        await batch.commit();

        console.log(`Successfully rolled over ${bugsFound} bugs to sprint ${sprintId}`);
        return json({ message: 'Bugs rolled over successfully' }, { status: 200 });
    } catch (err) {
        console.error('Error during bug rollover operation:', err);
        throw error(500, 'Failed to roll over bugs');
    }
}

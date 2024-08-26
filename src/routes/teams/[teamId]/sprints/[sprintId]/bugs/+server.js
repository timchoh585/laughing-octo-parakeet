import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db';

export async function GET({ params }) {
  const { teamId, sprintId } = params;

  if (!teamId || !sprintId) {
    console.error('teamId or sprintId is missing');
    throw error(400, 'teamId and sprintId are required');
  }

  try {
    const bugsSnapshot = await db
      .collection('teams')
      .doc(teamId)
      .collection('sprints')
      .doc(sprintId)
      .collection('bugs')
      .get();

    // Map the documents to their bug IDs
    const bugIds = bugsSnapshot.docs.map(doc => doc.data().bugId);

    // Join the bug IDs into a comma-separated string
    const bugIdsString = bugIds.join(',');

    console.log('Comma-separated bug IDs:', bugIdsString);

    return json({ bugIds: bugIdsString });
  } catch (err) {
    console.error('Failed to fetch sprint bugs:', err);
    throw error(500, 'Failed to fetch sprint bugs');
  }
}

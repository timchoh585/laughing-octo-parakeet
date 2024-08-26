import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db'; // Assuming FieldValue is not needed anymore

export async function POST({ request, params }) {
  const { teamId, sprintId } = params;

  if (!sprintId) {
    console.error('sprintId is missing');
    throw error(400, 'sprintId is required');
  }

  try {
    const { bugIds } = await request.json();

    if (!bugIds || !Array.isArray(bugIds)) {
      console.error('Invalid bugIds received:', bugIds);
      throw error(400, 'An array of bug IDs is required');
    }

    const sprintRef = db.collection('teams').doc(teamId).collection('sprints').doc(sprintId);
    const bugsCollectionRef = sprintRef.collection('bugs');

    // Retrieve all existing bugs in the collection
    const existingBugsSnapshot = await bugsCollectionRef.get();
    const existingBugIds = new Set(existingBugsSnapshot.docs.map(doc => doc.data().bugId));

    // Filter out any bug IDs that already exist
    const newBugIds = bugIds.filter(bugId => !existingBugIds.has(bugId));

    if (newBugIds.length === 0) {
      console.log('No new bugs to add.');
      return json({ message: 'No new bugs to add.' }, { status: 200 });
    }

    // Create a new document for each unique bug ID in the 'bugs' sub-collection
    const batch = db.batch();
    newBugIds.forEach(bugId => {
      const bugRef = bugsCollectionRef.doc(bugId.toString());
      batch.set(bugRef, { bugId }); // You can add more fields here if needed
    });

    await batch.commit();

    const updatedSprint = await sprintRef.get();
    console.log('Bugs successfully added to the sprint:', newBugIds);
    return json({ id: updatedSprint.id, ...updatedSprint.data() }, { status: 200 });
  } catch (err) {
    console.error('Error adding bugs to the sprint:', err);
    throw error(500, 'Failed to add bugs');
  }
}

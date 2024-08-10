import { getComponent } from '../../../../../api/api';

export async function load({ params }) {
  const { productName, componentName } = params;

  try {
    const componentData = await getComponent(productName, componentName);
    return { props: { componentData, productName, componentName } };
  } catch (error) {
    return { status: 500, error: new Error('Failed to fetch component details') };
  }
}

export const callFulfillmentAPI = async (
  client_id: string,
  order_id: string
): Promise<string> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: client_id,
      title: order_id,
    }),
  });

  if (!response.ok) {
    throw new Error('FULFILLMENT_FAILED');
  }

  const data = await response.json();

  // jsonplaceholder returns { id, title, userId, body }
  // we store the returned id as fulfillment_id
  return String(data.id);
};

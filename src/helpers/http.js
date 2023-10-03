export const resolve = (payload = {}) => ({
    body: JSON.stringify({ data: payload }),
    headers: {
        'Content-Type': ['application/json']
    },
    statusCode: 200,
    statusText: 'OK'
});

export const badRequest = (payload = {}) => ({
    body: JSON.stringify({ data: payload }),
    headers: { "Content-Type": ["application/json"] },
    statusCode: 400,
    statusText: "Bad Request",
});

export const forbidden = (message = "") => ({
    body: JSON.stringify({message}),
    headers: { "Content-Type": ["application/json"] },
    statusCode: 403,
    statusText: "Forbidden",
});
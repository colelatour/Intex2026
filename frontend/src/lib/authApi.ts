import type {AuthSession} from './types/AuthSession';

export async function getAuthSession(): Promise<AuthSession> {
    const response = await fetch(`/api/auth/me`, {
        credentials: 'include'
    }
});

if (!response.ok) {
    throw new Error('unable to load auth session');
}
return response.json();

export async function registerUser (
    email: string,
    password: string,
): Promise<void> {
    const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, password }),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('unable to register user')
    }
}
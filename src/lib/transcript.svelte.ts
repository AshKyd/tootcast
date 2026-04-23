import { writable } from 'svelte/store';
import { db } from './db';

export const transcript = writable('');
db.get<string>('pending_transcript').then((v) => v && transcript.set(v));
transcript.subscribe((v) => db.set('pending_transcript', v));

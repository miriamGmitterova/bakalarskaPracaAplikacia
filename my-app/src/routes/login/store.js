
import { writable } from 'svelte/store';

export const notifications = writable([]); // Store notifications

export const formData = writable({
    role: '',
    meno: '',
    priezvisko: '',
    email: '',
    user_name: '',
    heslo: '',
    telCislo: '',
    ulica: '',
    popisneCislo: '',
    mesto: '',
    rodneCislo: '',
    specializacia: '',
    typLekara: '',

});

export const aktualnyPouzivatel = writable({
    id_pouzivatela : '',
    user_name: '',
    prihlaseny: false,
    meno: '',
    priezvisko: '',
    role: '',
    email: '',
    telCislo: '',
    ulica: '',
    popisneCislo: '',
    mesto: ''

});

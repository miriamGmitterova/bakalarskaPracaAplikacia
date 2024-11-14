
<script>
    import {onDestroy, onMount} from 'svelte';
    import { page } from '$app/stores';
    import {aktualnyPouzivatel} from "../../login/store.js";

    let vysetrenia = [];
    let doctor = {};

    let user = {};
    let userSignedUp = {}; // To store whether the user is signed up for each examination
    let error = null;

    let doctorId;
    let doctorFullName = '';

    let announcement = '';

    let users = {}; // Object to map user IDs to user data


    const unsubscribePage = page.subscribe($page => {
        doctorId = $page.params.doctorId;
    });

    const unsubscribeUser = aktualnyPouzivatel.subscribe(currentUser => {
        user = currentUser || {};
        console.log("Current User:", user); // Debugging
    });

    onDestroy(() => {
        unsubscribePage();
        unsubscribeUser();
    });



    function parseDatumVysetrenia(datumArray) {
        // Convert the array [YYYY, MM, DD, HH, mm] to a JavaScript Date object
        const [year, month, day, hour, minute] = datumArray;
        return new Date(year, month - 1, day, hour, minute); // month - 1 because JavaScript months are 0-based
    }

    function sortByDate(a, b) {
        // Sort by datum_vysetrenia in ascending order
        return a.datum_vysetrenia - b.datum_vysetrenia;
    }



    async function fetchData() {
        try {
            const [vysetreniaResponse, doctorResponse, usersResponse] = await Promise.all([
                fetch(`http://localhost:8080/vysetrenie/zoznam/${doctorId}`),
                fetch(`http://localhost:8080/lekar/${doctorId}`),
                 fetch('http://localhost:8080/pouzivatel/zoznam') // Fetch all users
            ]);

            if (vysetreniaResponse.ok && doctorResponse.ok) {
                vysetrenia = await vysetreniaResponse.json();
                doctor = await doctorResponse.json();
                users = (await usersResponse.json()).reduce((acc, user) => {
                    acc[user.id_pouzivatela] = user;
                    return acc;
                }, {});
                console.log("Fetched doctor:", doctor); // Log the doctor object
                console.log("Fetched vysetrenia:", vysetrenia);
                // console.log("Fetched users:", users);

                doctorFullName = `${doctor.pouzivatel.meno} ${doctor.pouzivatel.priezvisko}`;

                vysetrenia = vysetrenia.map(v => ({
                    ...v,
                    datum_vysetrenia: parseDatumVysetrenia(v.datum_vysetrenia)
                }));


                vysetrenia.sort(sortByDate);



                // Update userSignedUp based on the fetched data
                if (user.id_pouzivatela) {
                    userSignedUp = vysetrenia.reduce((acc, vysetrenie) => {
                        if (vysetrenie.id_pouzivatela === user.id_pouzivatela) {
                            acc[vysetrenie.id_vysetrenia] = true;
                        }
                        return acc;
                    }, {});
                }

                console.log("User Signed Up Status:", userSignedUp);
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (err) {
            error = err.message;
        }
    }

    onMount(() => {
         fetchData();

    });

    async function signUpForExamination(vysetrenieId) {
        // Check if user is logged in
        if (!user.id_pouzivatela) {
            announcement = 'You must be logged in to sign up.';
            return;
        }

        try {

            const response = await fetch(`http://localhost:8080/vysetrenie/${vysetrenieId}/signUp?patientId=${encodeURIComponent(user.id_pouzivatela)}`, {
                method: 'POST'
            });

            if (response.ok) {
                announcement = 'Ste úspešne prihlásený na vyšetrenie!';
                userSignedUp[vysetrenieId] = true;

                vysetrenia = vysetrenia.map(v => v.id_vysetrenia === vysetrenieId ? { ...v, id_pouzivatela: user.id_pouzivatela, pouzivatel: user } : v);
            } else {
                const errorResponse = await response.json();
                throw new Error(errorResponse.message || 'Nepodarilo sa prihlásiť');
            }

            // Clear the announcement after 5 seconds
            setTimeout(() => {
                announcement = '';
            }, 5000);
        } catch (err) {
            error = err.message;
        }
    }
    async function deleteVysetrenie(vysetrenieId) {
        try {
            const response = await fetch(`http://localhost:8080/vysetrenie/${vysetrenieId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                vysetrenia = vysetrenia.filter(v => v.id_vysetrenia !== vysetrenieId);
                announcement = 'Vyšetrenie bolo úspešne zrušené!';
            } else {
                const errorResponse = await response.json();
                throw new Error(errorResponse.message || 'Failed to delete examination.');
            }

            setTimeout(() => {
                announcement = '';
            }, 5000);
        } catch (err) {
            announcement = err.message;
            setTimeout(() => {
                announcement = '';
            }, 5000);
        }
    }

    function isPastOrNear(vysetrenie) {
        const now = new Date();
        const examinationDate = vysetrenie.datum_vysetrenia;
        const timeDiff = examinationDate - now;
        const oneDayInMillis = 24 * 60 * 60 * 1000;
        return examinationDate < now || timeDiff < oneDayInMillis;
    }


    function isOccupied(vysetrenie) {
        return vysetrenie.id_pouzivatela !== null;
    }

    function isOccupiedByUser(vysetrenie) {
        return vysetrenie.id_pouzivatela === user.id_pouzivatela;
    }

</script>

<style>
    /* Add some basic styling for the list of vysetrenia */
    .vysetrenia-list {
        max-width: 800px;
        margin: 100px auto;
        padding: 20px;
        background: whitesmoke;
        border-radius: 8px;
        box-shadow: 0 6px 12px #264653;
    }

    .vysetrenia-list h1 {
        color: #d0874a;
        font-size: 30px;
    }

    .vysetrenia-list ul {
        list-style-type: none;
        padding: 0;
    }

    .vysetrenia-list li {
        padding: 15px;
        border-bottom: 2px solid #264653;
        position: relative;
    }

    .vysetrenia-list button {
        background-color: #4caf50; /* Green background */
        border: none;
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 5px 0;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.3s, transform 0.3s;
    }

    .vysetrenia-list button:hover {
        background-color: #45a049; /* Darker green */
        transform: scale(1.05); /* Slightly increase size on hover */
    }

    .vysetrenia-list button:disabled {
        background-color: #9e9e9e; /* Grey background for disabled */
        cursor: not-allowed;
    }

    /* Announcement styling */
    .announcement {
        margin-top: 20px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        font-size: 1rem;
        width: 80%;
        max-width: 600px;
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        text-align: center;
    }

    /* Success announcement styling */
    .announcement.success {
        border: 2px solid #4caf50;
        background-color: #dff0d8;
        color: #3c763d;
    }

    /* Error announcement styling */
    .announcement.error {
        border: 2px solid #f44336;
        background-color: #fddfdf;
        color: #a94442;
    }

    .vysetrenie-occupied {
        color: #fd1a1a; /* Red color for occupied message */
        font-weight: bold;
    }
    .delete-button {
        position: absolute;
        right: 15px;
        top: 50%;
        /*transform: translateY(-50%);*/
        padding: 10px 15px;
        background-color: #e63946 !important;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .delete-button:hover {
        background-color: #d62828 !important;
    }


    /* Ensure that the container has enough width to accommodate the float */
    .vysetrenia-list li {
        position: relative;
        overflow: hidden; /* Ensure that floated elements don't overflow */
    }
</style>

<div class="vysetrenia-list">
    <h1>Vyšetrenia {doctorFullName}</h1>
    {#if error}
        <p>{error}</p>
    {:else if vysetrenia.length === 0}
        <p>Momentálne nie sú dostupné žiadne vyšetrenia!</p>
    {:else}
        <ul>
            {#each vysetrenia as vysetrenie}
                <li>

                    <h3>{vysetrenie.nazovVysetrenia}</h3>
                    <p><strong>Typ:</strong> {vysetrenie.typVysetrenia}</p>
                    <p><strong>Dátum:</strong> {vysetrenie.datum_vysetrenia.toLocaleString()}</p>
                    {#if user.role === 'PACIENT'}
                        {#if isOccupied(vysetrenie)}
                            {#if isOccupiedByUser(vysetrenie)}
                                <p class="vysetrenie-occupied"><strong>Na toto vyšetrenie ste už prihlásený!</strong></p>
                            {:else}
                                <p class="vysetrenie-occupied"><strong>Vyšetrenie je obsadené!</strong></p>
                            {/if}
                        {:else}
                            {#if !isPastOrNear(vysetrenie)}
                                <button on:click={() => signUpForExamination(vysetrenie.id_vysetrenia)}>Prihlásiť sa na vyšetrenie</button>
                            {/if}
                        {/if}


                    {:else if user.role === 'LEKAR'}
                        {#if vysetrenie.id_pouzivatela}
                            {#if users[vysetrenie.id_pouzivatela]}
                                <p class="patient-info"><strong>Prihlásený:</strong> {users[vysetrenie.id_pouzivatela].meno} {users[vysetrenie.id_pouzivatela].priezvisko}</p>

                                {#if !isPastOrNear(vysetrenie)}
                                    <button class="delete-button" on:click={() => deleteVysetrenie(vysetrenie.id_vysetrenia)}>Zrušiť vyšetrenie</button>
                                {/if}

                                {#if isPastOrNear(vysetrenie)}
                                    <p class="vysetrenie-occupied">Vyšetrenie je už v minulosti alebo sa koná v priebehu nasledujúcich 24 hodín.</p>
                                {/if}
                            {:else}
                                <p class="patient-info"><strong>Prihlásený:</strong> N/A</p>
                            {/if}
                        {:else}
                            <p class="vysetrenie-occupied">Vyšetrenie nie je obsadené.</p>
                        {/if}
                    {/if}

                </li>
            {/each}
        </ul>
    {/if}
</div>




{#if announcement}
    <div class="announcement {announcement.startsWith('Nepodarilo') ? 'error' : 'success'}">{announcement}</div>
{/if}
{#if announcement}
    <div class="announcement {announcement.includes('úspešne') ? 'success' : 'error'}">{announcement}</div>
{/if}

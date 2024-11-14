<script>
    import {onMount} from 'svelte';
    import { aktualnyPouzivatel} from "../login/store.js";

    let user = {};
    let vysetrenia = [];
    let error = null;
    let doctors = {};

    function parseDatumVysetrenia(datumArray) {
        // Convert the array [YYYY, MM, DD, HH, mm] to a JavaScript Date object
        const [year, month, day, hour, minute] = datumArray;
        return new Date(year, month - 1, day, hour, minute); // month - 1 because JavaScript months are 0-based
    }

    function sortByDate(a, b) {
        // Sort by datum_vysetrenia in ascending order
        return a.datum_vysetrenia - b.datum_vysetrenia;
    }

    function isPastOrNear(vysetrenie) {
        const now = new Date();
        const examinationDate = vysetrenie.datum_vysetrenia;
        const timeDiff = examinationDate - now;
        const oneDayInMillis = 24 * 60 * 60 * 1000;
        return examinationDate < now || timeDiff < oneDayInMillis;
    }

    async function fetchDoctors() {
        try {
            const response = await fetch(`http://localhost:8080/lekar/zoznam`);
            if (response.ok) {
                const doctorsList = await response.json();
                console.log('Fetched doctors:', doctorsList);
                doctors = doctorsList.reduce((acc, doctor) => {
                    acc[doctor.id_lekara] = doctor;
                    return acc;
                }, {});
                console.log('Mapped doctors:', doctors);
            } else {
                throw new Error('Failed to fetch doctors');
            }
        } catch (err) {
            error = err.message;
        }
    }

    async function fetchAppointments() {
        try {
            if (user.id_pouzivatela) {
                const response = await fetch(`http://localhost:8080/vysetrenie/zoznam/pacient/${user.id_pouzivatela}`);
                if (response.ok) {
                    vysetrenia = await response.json();
                    console.log('Fetched appointments:', vysetrenia);
                    vysetrenia = vysetrenia.map(v => ({
                        ...v,
                        datum_vysetrenia: parseDatumVysetrenia(v.datum_vysetrenia)
                    }));
                    vysetrenia.sort(sortByDate);
                } else {
                    throw new Error('Failed to fetch appointments');
                }
            }
        } catch (err) {
            error = err.message;
        }
    }

    async function cancelAppointment(id) {
        try {
            const response = await fetch(`http://localhost:8080/vysetrenie/${id}/zrusit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                await fetchAppointments();  // Refresh appointments list
            } else {
                throw new Error('Failed to cancel the appointment');
            }
        } catch (err) {
            error = err.message;
        }
    }

    onMount(async () => {
        const unsubscribeUser = aktualnyPouzivatel.subscribe(currentUser => {
            user = currentUser || {};
        });

        try {
            await fetchDoctors();
            await fetchAppointments();
        } catch (err) {
            error = err.message;
        } finally {
            unsubscribeUser();
        }
    });


</script>


<style>
    /* Add some basic styling */
    .appointments-list {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        background: whitesmoke;
        border-radius: 8px;
        box-shadow: 0 6px 12px #264653;
    }

    .appointments-list h1 {
        color: #d0874a;
        font-size: 30px;
        text-align: center;
    }

    .appointments-list ul {
        list-style-type: none;
        padding: 0;
    }

    .appointments-list li {
        padding: 15px;
        border-bottom: 2px solid #264653;
        position: relative;
    }

    .appointments-list li h3 {
        margin: 0;
    }

    .appointments-list li p {
        margin: 5px 0;
    }

    .appointments-list button {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        padding: 10px 15px;
        background-color: #e63946;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .appointments-list button:hover {
        background-color: #d62828;
    }
</style>


<div class="appointments-list">
    <h1>Vaše prihlásené vyšetrenia</h1>
    {#if error}
        <p>{error}</p>
    {:else if vysetrenia.length === 0}
        <p>Zatiaľ nemáte žiadne prihlásené vyšetrenia..</p>
    {:else}
        <ul>
            {#each vysetrenia as vysetrenie}
                <li>
                    <h3>{vysetrenie.nazovVysetrenia}</h3>
                    <p><strong>Dátum:</strong> {vysetrenie.datum_vysetrenia.toLocaleString()}</p>
                    <p><strong>Lekár:</strong> {doctors[vysetrenie.id_lekara] ? doctors[vysetrenie.id_lekara].pouzivatel.meno + ' ' + doctors[vysetrenie.id_lekara].pouzivatel.priezvisko : 'N/A'}</p>
                    {#if !isPastOrNear(vysetrenie)}
                        <button on:click={() => cancelAppointment(vysetrenie.id_vysetrenia)}>Zrušiť</button>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>

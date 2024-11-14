
<script>
    import {onDestroy, onMount} from 'svelte';
    import { page } from '$app/stores';
    import {getDoctorDetails} from "$lib/api.js";
    import {aktualnyPouzivatel} from "../../login/store.js";

    import {goto} from "$app/navigation";


    let doctor = null;
    let error = null;
    let id;
    let user = null;
    let announcement = '';  // Use writable store for announcement

    let patients = [];

    let showForm = false;
    let nazovVysetrenia = '';
    let typVysetrenia = 'PREVENTIVNA_PREHLIADKA'; // default value

    let datumVysetrenia;


    function getLocalISOString() {
        const localDate = new Date();
        const offset = localDate.getTimezoneOffset() * 60000; // Offset in milliseconds
        const localDateWithOffset = new Date(localDate.getTime() - offset);
        return localDateWithOffset.toISOString().slice(0, 16); // Slice to match `datetime-local` format
    }

    // Initialize with local time
    datumVysetrenia = getLocalISOString();

    const unsubscribeUser = aktualnyPouzivatel.subscribe(value => {
        user = value;
        console.log('Fetched user:', user); // Log user for debugging

    });

    const unsubscribePage = page.subscribe($page => {
        id = $page.params.id;
        console.log('Navigating to doctor with ID:', id); // Log doctor ID for debugging
    });

    onDestroy(() => {
        unsubscribeUser();
        unsubscribePage();
    });



    onMount(async () => {
        try {
            doctor = await getDoctorDetails(id);
            // Check if the logged-in user is a doctor and their details match
            if (user?.role === 'LEKAR' && user.meno === doctor.pouzivatel.meno && user.priezvisko === doctor.pouzivatel.priezvisko) {
                const response = await fetch(`http://localhost:8080/doctors/${id}/patients`);

                if (response.ok) {
                    patients = await response.json();
                    console.log('Fetched patients:', patients); // Log patients for debugging
                } else {
                    throw new Error('Failed to fetch patients');
                }
            }
        } catch (err) {
            error = err.message;
        }
    });

    async function checkIfUserHasGeneralDoctor(patientId) {
        try {
            const response = await fetch(`http://localhost:8080/patients/${patientId}/doctors`);
            if (response.ok) {
                const doctors = await response.json();
                // Check if there is a general doctor among the user's doctors
                return doctors.some(doctor => doctor.typLekara === 'VSEOBECNY_LEKAR');
            } else {
                throw new Error('Failed to fetch doctors for patient.');
            }
        } catch (err) {
            console.error('Error checking general doctor status:', err);
            announcement = 'Error checking if you already have a general doctor.';
            return false;
        }
    }


    async function saveVysetrenie() {
        try {
            const requestBody = {
                nazovVysetrenia,
                typ_vysetrenia: typVysetrenia,
                datum_vysetrenia:formatDate(datumVysetrenia),
                id_lekara: doctor.id_lekara
            };

            console.log('Request Body:', requestBody);

            const response = await fetch('http://localhost:8080/vysetrenie/uloz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            if (response.ok) {
                announcement = 'Vyšetrenie bolo úspešne uložené!';
                showForm = false;// Hide the form after successful save
            } else {
                const errorData = await response.json();
                console.error('Error Response:', errorData); // Log the error response for debugging
                throw new Error('Vyšetrenie sa neuložilo, dátum je v minulosti!');
            }
        } catch (err) {
            announcement = err.message;
        }
        setTimeout(() => { announcement = ''; }, 5000);
    }

    function toggleForm() {
        showForm = !showForm;
    }

    async function deletePatient(patientId) {
        console.log('Attempting to delete patient with ID:', patientId);

        if (!patientId) {
            console.error('Patient ID is undefined');
            announcement = 'Failed to delete patient. ID is missing.';
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/karta/${patientId}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                patients = patients.filter(patient => patient.id_pouzivatela !== patientId);
                announcement = 'Karta bola úspešne odstránená!';
            } else {
                const errorResponse = await response.json();
                throw new Error(errorResponse.message || 'Failed to delete patient.');
            }
        } catch (err) {
            announcement = err.message;
        }

        setTimeout(() => {
            announcement = '';
        }, 5000);
    }

    function formatDate(date) {
        // Convert date to dd/MM/yyyy HH:mm:ss format
        return new Date(date).toLocaleString('en-GB', { timeZone: 'CET' }).replace(',', '');
    }



    async function assignDoctor() {

        const pacientId = user?.id_pouzivatela;
        const lekarId = doctor?.id_lekara;
        const zalozenie = formatDate(new Date());


        if (!pacientId) {
            console.error('Pacient ID is not defined');
            return;
        }

        if (!user?.prihlaseny) {
            alert('You need to be logged in to assign a doctor.');
            return;
        }

        const hasGeneralDoctor = await checkIfUserHasGeneralDoctor(pacientId);
        if (hasGeneralDoctor && doctor.typLekara === 'VSEOBECNY_LEKAR') {
            announcement = 'Kartu sa nepodarilo uložiť. Už ste prihlásený k inému všeobecnému lekárovi.';
            setTimeout(() => {
                announcement = '';
            }, 5000);
            return;
        }


        const requestBody = {
            id_pouzivatela: pacientId,
            id_lekara: lekarId,
            zalozenie: zalozenie,
        };

        console.log('Request Body:', requestBody); // Log request body for debugging



        try {
            const response = await fetch('http://localhost:8080/karta/uloz', { method: 'POST', body: JSON.stringify(requestBody), headers: { 'Content-Type': 'application/json' } });



            if (response.ok) {
                const responseText = await response.text();
                console.log('Response Text:', responseText);

                if (responseText.trim() === '') {
                    announcement = 'Karta bola úspešne založená!';
                } else {
                    try {
                        const result = JSON.parse(responseText);
                        console.log('Server result:', result);
                        announcement = 'Karta bola úspešne uložená!';
                    } catch (jsonError) {
                        console.error('Failed to parse JSON:', jsonError);
                        announcement = 'Karta bola úspešne uložená, ale došlo k chybe pri spracovaní odpovede.';
                    }
                }

            } else {
                announcement = 'Karta už bola uložená!';
            }

            // Automatically clear the announcement after 3 seconds
            setTimeout(() => {
                announcement = '';
            }, 5000);  // Adjust the duration as needed

        } catch (error) {
            console.error('Error during request:', error);
            announcement = 'Chyba pri ukladaní karty.';

            setTimeout(() => {
                announcement = '';
            }, 5000);  // Adjust the duration as needed
        }
    }

    function goToVysetrenia(doctorId) {
        goto(`/vysetrenie/${doctorId}`);
    }
</script>



<style>

    /* General styles for the entire page */
    body {
        font-family: Arial, sans-serif;
        background-color: whitesmoke;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
    }

    /* Container for the doctor details section */
    .doctor-details {
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        border-radius: 8px;
        background: whitesmoke;
        box-shadow: 0 6px 12px #264653;
        text-align: center;
    }

    /* Heading styling */
    h1 {
        color: #d0874a;
        font-size: 2.5rem;
        margin-bottom: 20px;
    }

    /* Paragraph styling */
    p {
        color: #555;
        font-size: 1rem;
        margin: 0.5rem 0;
    }

    /* Button styling */
    button {
        margin-top: 20px;
        background-color: #264653;
        color: #f4a261;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.3s ease;
        font-size: 1rem;
    }

    /* Button hover effect */
    button:hover {
        background-color: #1d3a3a;
        transform: scale(1.05);
    }

    /* Form styling */
    form {
        background:whitesmoke;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 6px 12px #264653;
        margin-top: 20px;
    }

    /* Form element styling */
    form div {
        margin-bottom: 15px;
    }

    /* Label styling */
    form label {
        display: block;
        font-size: 20px;
        margin-bottom: 5px;
        color: #555;
    }

    /* Input and select styling */
    form input[type="text"],
    form input[type="datetime-local"],
    form select {
        width: 100%;
        padding: 10px;
        font-size: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    }

    /* Submit button styling within the form */
    form button {
        background-color: #28a745;
        color: #ffffff;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        font-size: 1rem;
        margin-top: 10px;
    }

    /* Submit button hover effect */
    form button:hover {
        background-color: #218838;
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

    /* Card list styling */
    .card-list {
        margin-top: 40px;
        text-align: center;
    }

    /* Card list heading styling */
    .card-list h2 {
        margin: 10px 0;
        font-size: 1.875rem;
        color: #d0874a;
    }

    /* Card list item styling */
    .card-list ul {
        list-style-type: none;
        padding: 0;
        margin: 0 auto;
        max-width: 800px;
    }

    .card-list li {
        padding: 15px;
        border-bottom: 2px solid #264653;
        background-color: whitesmoke;
        margin-bottom: 10px;
    }

    /* Card list item text styling */
    .card-list li p {
        margin: 5px 0;
        font-size: 1rem;
    }

    /* Delete button styling */
    .delete-button {
        background-color: #264653;
        color: #f4a261;
        border: none;
        cursor: pointer;
        padding: 10px 20px;
        border-radius: 5px;
        transition: background-color 0.3s ease, transform 0.3s ease;
        font-size: 1rem;
    }

    /* Delete button hover effect */
    .delete-button:hover {
        background-color: #1d3a3a;
        transform: scale(1.05);
    }

    /* Delete button focus effect */
    .delete-button:focus {
        border-color: #264653;
        outline: none;
    }


</style>


{#if error}
    <p>Error: {error}</p>
{:else if !doctor}
    <p>Loading...</p>
{:else}
    <div class="doctor-details">
        <h1>{doctor.pouzivatel.meno} {doctor.pouzivatel.priezvisko}</h1>
        <p><strong>Špecializácia:</strong> {doctor.specializacia}</p>
        <p><strong>Telefón:</strong> {doctor.pouzivatel.telCislo}</p>
        <p><strong>Ulica:</strong> {doctor.pouzivatel.ulica} {doctor.pouzivatel.popisneCislo}</p>
        <p><strong>Mesto:</strong> {doctor.pouzivatel.mesto}</p>
        <p><strong>Email:</strong> {doctor.pouzivatel.email}</p>
        {#if user.prihlaseny && user.role === 'PACIENT'}
            <button on:click={assignDoctor}>Založiť kartu</button>
        {/if}

        {#if user.prihlaseny && user.role === 'LEKAR'}
            {#if user.meno === doctor.pouzivatel.meno && user.priezvisko === doctor.pouzivatel.priezvisko}
                <button on:click={toggleForm}>Pridať vyšetrenie</button>
                <button on:click={() => goToVysetrenia(doctor.id_lekara)}>Zobraziť vyšetrenia</button>
                {#if showForm}
                    <form on:submit|preventDefault={saveVysetrenie}>
                        <div>
                            <label for="nazovVysetrenia">Názov vyšetrenia:</label>
                            <input id="nazovVysetrenia" type="text" bind:value={nazovVysetrenia} required>
                        </div>
                        <div>
                            <label for="typVysetrenia">Typ vyšetrenia:</label>
                            <select id="typVysetrenia" bind:value={typVysetrenia}>
                                <option value="PREVENTIVNA_PREHLIADKA">Preventívna prehliadka</option>
                                <option value="ODBORNE_VYSETRENIE">Odborné vyšetrenie</option>
                            </select>
                        </div>
                        <div>
                            <label for="datumVysetrenia">Dátum vyšetrenia:</label>
                            <input id="datumVysetrenia" type="datetime-local" bind:value={datumVysetrenia} required>
                        </div>
                        <button type="submit">Uložiť vyšetrenie</button>

                    </form>
                {/if}
                <div class="card-list">
                    <h2>Vaši pacienti</h2>
                    {#if Array.isArray(patients)}
                        <ul>
                            {#each patients as patient}
                                <li>
                                    <h3>{patient.meno} {patient.priezvisko}</h3>
                                    <p><strong>Email:</strong> {patient.email}</p>
                                    <p><strong>Telefón:</strong> {patient.tel_cislo}</p>
                                    <button class="delete-button" on:click={() => deletePatient(patient.id_pouzivatela)}>Odstrániť kartu pacienta</button>
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <p>Nemáte žiadnych pacientov.</p>
                    {/if}
                </div>
            {/if}
        {/if}
    </div>
{/if}


{#if announcement}
    <div class="announcement {announcement === 'Karta už bola uložená!' ? 'error' : 'success'}">{announcement}</div>
{/if}

{#if announcement}
    <div class="announcement {announcement === 'Vyšetrenie sa neuložilo, dátum je v minulosti!' ? 'error' : 'success'}">{announcement}</div>
{/if}

{#if announcement}
    <div class="announcement {announcement === 'Kartu sa nepodarilo uložiť. Už ste prihlásený k inému všeobecnému lekárovi.' ? 'error' : 'success'}">{announcement}</div>
{/if}

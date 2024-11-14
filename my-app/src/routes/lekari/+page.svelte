
<script>
    import { onMount } from 'svelte';
    import { getDoctors } from './load.js';
    import { goto } from '$app/navigation';

    let doctors = [];
    let error = null;

    let filteredDoctors = [];
    let selectedType = 'all'; // Default filter to show all doctors

    onMount(async () => {
        try {
            doctors = await getDoctors();
            filteredDoctors = doctors;
            console.log('Fetched doctors:', doctors);
        } catch (err) {
            error = err.message;
            console.error('Error fetching doctors:', err);
        }
    });

    function viewDetails(id) {
        console.log('Navigating to doctor with ID:', id);
        goto(`/lekari/${id}`);
    }

    function filterDoctors(type) {
        selectedType = type;
        if (type === 'all') {
            filteredDoctors = doctors;
        } else {
            filteredDoctors = doctors.filter(doctor => doctor.typLekara === type);
        }
    }
</script>

<style>

    /* Container for filter controls */
    .filter-controls {
        margin-bottom: 1rem;
        display: flex;
        justify-content: center;
        gap: 1rem; /* Space between filter buttons */
    }

    /* Individual filter buttons */
    .filter-controls button {
        margin-top: 20px;
        background-color: #264653; /* Dark teal background for filter buttons */
        border: 2px solid #264653; /* Border matching the background */
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.3s, border-color 0.3s, transform 0.3s; /* Add transition for transform */

    }

    /* Hover effect for filter buttons */
    .filter-controls button:hover {
        background-color: #1d3a3a; /* Darker shade of teal on hover */
        border-color: #1d3a3a; /* Matching border color on hover */
        transform: scale(1.1); /* Scale the button to 110% of its original size */

    }

    /* Active button style */
    .filter-controls button.active {
        background-color: #d0874a; /* Highlight color for the active filter */
        border-color: #d0874a; /* Matching border color for active filter */
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    li {
        background: whitesmoke;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.3s, box-shadow 0.3s;
        padding: 1.5rem;
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
    }

    li:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 12px #264653;
    }

    h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        color: #d0874a;
    }

    p {
        margin: 0.5rem 0;
        color: #555;
        font-size: 1rem;
    }

    .info {
        margin-top: 1rem;
    }

    .info strong {
        display: block;
        color: #333;
    }
</style>


{#if error}
    <p>Error: {error}</p>
{:else}

    <div class="filter-controls">
        <button
                class:active={selectedType === 'all'}
                on:click={() => filterDoctors('all')}>
            Všetci
        </button>
        <button
                class:active={selectedType === 'VSEOBECNY_LEKAR'}
                on:click={() => filterDoctors('VSEOBECNY_LEKAR')}>
            Všeobecní lekári
        </button>
        <button
                class:active={selectedType === 'ODBORNY_LEKAR'}
                on:click={() => filterDoctors('ODBORNY_LEKAR')}>
            Odborní lekári
        </button>
    </div>
    <ul>
        {#each filteredDoctors as doctor}
            <li on:click={() => viewDetails(doctor.id_lekara)}>
                <div>
                    <h2>{doctor.pouzivatel.meno} {doctor.pouzivatel.priezvisko}</h2>
                    <p><strong>Špecializácia:</strong> {doctor.specializacia}</p>
                    <p><strong>Mesto:</strong> {doctor.pouzivatel.mesto}</p>
                </div>
            </li>
        {/each}
    </ul>
{/if}






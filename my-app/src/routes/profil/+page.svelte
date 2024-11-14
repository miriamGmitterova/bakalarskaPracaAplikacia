
<script>
    import { onMount } from 'svelte';
    import { aktualnyPouzivatel } from '../login/store.js';
    import {goto} from "$app/navigation"; // Import the store

    let user = {};

    let error = null;
    let savedCards = [];
    let announcement = '';  // Use writable store for announcement

    let editMode = false;
    let updatedUser = {};

    onMount(() => {
        const unsubscribe = aktualnyPouzivatel.subscribe(value => {
            user = value;
            console.log("Logged-in user:", user);
            updatedUser = {
                user_name: user.user_name,
                telCislo: user.telCislo,
                ulica: user.ulica,
                popisneCislo: user.popisneCislo,
                mesto: user.mesto
            };
        });

        return () => unsubscribe();
    });

    // Fetch saved cards for the user based on their role
    async function fetchSavedCards() {
        if (user.role === 'PACIENT') {
            try {
                const response = await fetch(`http://localhost:8080/patients/${user.id_pouzivatela}/doctors`);
                if (response.ok) {
                    return await response.json();

                } else {
                    throw new Error('Failed to fetch saved cards.');
                }
            } catch (err) {
                error = err.message;
            }
        }
        return [];
    }

    async function deleteCard(userId, doctorId) {
        console.log("Deleting card with userId:", userId, "and doctorId:", doctorId);
        try {
            const response = await fetch(`http://localhost:8080/karta/${encodeURIComponent(userId)}/${encodeURIComponent(doctorId)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove the deleted card from the savedCards array
                savedCards = savedCards.filter(card => card.id_lekara !== doctorId);
                announcement = 'Karta bola úspešne odstránená!';
            } else {
                const errorResponse = await response.json();
                throw new Error(errorResponse.message || 'Failed to delete card.');
            }
            // Automatically clear the announcement after 3 seconds
            setTimeout(() => {
                announcement = '';
            }, 5000);  // Adjust the duration as needed
        } catch (err) {
            error = err.message;
        }
    }

    async function viewDoctorExaminations(doctorId) {
        goto(`/vysetrenie/${doctorId}`);
    }

    async function viewUserAppointments() {
        goto('/user-examinations');
    }


    onMount(async () => {
        savedCards = await fetchSavedCards();
        console.log(savedCards); // Check the structure of the savedCards array
    });

    async function updateUserProfile(event) {
        event.preventDefault();

        try {
            const response = await fetch(`http://localhost:8080/pouzivatel/${user.id_pouzivatela}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_name: updatedUser.user_name,
                    telCislo: updatedUser.telCislo,
                    ulica: updatedUser.ulica,
                    popisneCislo: updatedUser.popisneCislo,
                    mesto: updatedUser.mesto
                })
            });

            if (response.ok) {
                aktualnyPouzivatel.set({
                    ...user,
                    user_name: updatedUser.user_name,
                    telCislo: updatedUser.telCislo,
                    ulica: updatedUser.ulica,
                    popisneCislo: updatedUser.popisneCislo,
                    mesto: updatedUser.mesto
                });
                localStorage.setItem('aktualnyPouzivatel', JSON.stringify({
                    ...user,
                    user_name: updatedUser.user_name,
                    telCislo: updatedUser.telCislo,
                    ulica: updatedUser.ulica,
                    popisneCislo: updatedUser.popisneCislo,
                    mesto: updatedUser.mesto
                }));
                announcement = 'Profil bol úspešne upravený!';
                editMode = false;
            } else {
                const errorData = await response.json();
                console.error('Update failed:', errorData.message);
                announcement = error.message;
            }
        } catch (error) {
            console.error('Error during update:', error);
        }
    }

    function toggleEditMode() {
        editMode = !editMode;
        if (!editMode) {
            updatedUser = {
                user_name: user.user_name,
                telCislo: user.telCislo,
                ulica: user.ulica,
                popisneCislo: user.popisneCislo,
                mesto: user.mesto
            };
        }
    }

</script>



<style>
    .profile-container {
        max-width: 800px;
        margin: 100px auto;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 6px 12px #264653;
        background-color: whitesmoke;
    }

    .profile-container h1 {
        text-align: center;
        color: #d0874a;
        margin-bottom: 20px;
    }

    .profile-info {
        display: flex;
        flex-direction: column;
        text-align: center;
        gap: 15px;
    }

    .profile-info p {
        font-size: 18px;
        line-height: 1.5;
        margin: 0;
    }

    .profile-info strong {
        color: #264653;
    }

    .profile-actions {
        margin-top: 20px;
        text-align: center;
    }

    .profile-actions button,
    .edit-form-container button,
    .form-container {
        background-color: #264653;
        color: #f4a261;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.3s ease;
    }

    .profile-actions button:hover,
    .edit-form-container button:hover,
    .form-container:hover {
        background-color: #1d3a3a;
        transform: scale(1.05);
    }

    .profile-actions button:focus,
    .edit-form-container button:focus,
    .form-container:focus {
        border-color: #264653;
        outline: none;
    }

    .card-list {
        margin-top: 40px;
        text-align: center;
    }

    .card-list h2 {
        margin: 20px 0;
        font-size: 30px;
        color: #d0874a;
    }

    .card-list ul {
        list-style-type: none;
        padding: 0;
        text-align: center;
        margin: 0 auto;
        max-width: 800px;
    }

    .card-list li {
        padding: 15px;
        border-bottom: 2px solid #264653;
        background-color: whitesmoke;
    }

    .card-list li p {
        margin: 5px 0;
        font-size: 18px;
    }

    .announcement {
        margin-top: 20px;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        font-size: 18px;
        width: 80%;
        max-width: 600px;
        position: fixed;
        top: 120px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        text-align: center;
    }

    .announcement.success {
        border: 2px solid #4caf50;
        background-color: #dff0d8;
        color: #3c763d;
    }

    .announcement.error {
        border: 2px solid #f44336;
        background-color: #fdd;
        color: #a94442;
    }

    .edit-form-container {
        max-width: 600px;
        margin: 50px auto;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 6px 12px #264653;
        background-color: whitesmoke;
    }

    .edit-form-container label {
        display: block;
        margin: 10px 0 5px;
        font-weight: bold;
        color: #264653;
    }

    .edit-form-container input {
        width: 90%;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #f4f4f4;
    }

</style>


<div class="profile-container">
    <h1>Profil</h1>

    {#if user.prihlaseny}
        {#if editMode}
            <div class="edit-form-container">
                <form on:submit={updateUserProfile} class="profile-edit-form">
                    <div>
                        <label for="user_name">Username:</label>
                        <input type="text" id="user_name" bind:value={updatedUser.user_name} />
                    </div>
                    <div>
                        <label for="telCislo">Telefónne číslo:</label>
                        <input type="text" id="telCislo" bind:value={updatedUser.telCislo} />
                    </div>
                    <div>
                        <label for="mesto">Mesto:</label>
                        <input type="text" id="mesto" bind:value={updatedUser.mesto} />
                    </div>
                    <div>
                        <label for="ulica">Ulica:</label>
                        <input type="text" id="ulica" bind:value={updatedUser.ulica} />
                    </div>
                    <div>
                        <label for="popisneCislo">Popisne cislo:</label>
                        <input type="text" id="popisneCislo" bind:value={updatedUser.popisneCislo} />
                    </div>
                    <button type="submit">Uložiť</button>
                    <button type="button" on:click={toggleEditMode}>Zrušiť</button>
                </form>
            </div>
        {:else}
            <div class="profile-info">
                <p><strong>Username:</strong> {user.user_name}</p>
                <p><strong>Celé meno:</strong> {user.meno} {user.priezvisko}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Rola:</strong> {user.role}</p>

                <p><strong>Telefónne číslo:</strong> {user.telCislo}</p>
                <p><strong>Ulica:</strong> {user.ulica}</p>
                <p><strong>Popisne cislo:</strong> {user.popisneCislo}</p>
                <p><strong>Mesto:</strong> {user.mesto}</p>

                <button class="form-container" on:click={toggleEditMode}>Upraviť profil</button>
            </div>
        {/if}

        <div class="card-list">
            {#if user.role === 'PACIENT'}
                <div class="profile-actions">
                    <button on:click={viewUserAppointments}>Prihlásené vyšetrenia</button>
                </div>
                <h2>Vaši lekári</h2>

                {#if savedCards.length > 0}
                    <ul>
                        {#each savedCards as card}
                            <li>
                                <p><strong>Doktor:</strong> {card.pouzivatel.meno} {card.pouzivatel.priezvisko}</p>
                                <p><strong>Špecializácia:</strong> {card.specializacia}</p>
                                <button class="form-container" on:click={() => deleteCard(user.id_pouzivatela, card.id_lekara)}>Odstrániť kartu</button>
                                <button class="form-container" on:click={() => viewDoctorExaminations(card.id_lekara)}>Zobraziť vyšetrenia</button>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p>Zatiaľ nemáte žiadnych lekárov.</p>
                {/if}
            {/if}
        </div>
    {:else}
        <p>Nie ste prihlásený.</p>
    {/if}
</div>

{#if announcement}
    <div class="announcement {announcement.includes('úspešne') ? 'success' : 'error'}">
        {announcement}
    </div>
{/if}


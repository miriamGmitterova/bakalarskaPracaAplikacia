<script>
    import { goto } from '$app/navigation';

    import { onMount } from 'svelte';

    import { formData, aktualnyPouzivatel, notifications } from './store.js';


    let user_name = localStorage.getItem('savedUser_name') || '';
    let password = localStorage.getItem('savedPassword') || '';

    let errorMessage = '';
    let showRegistrationForm = false;


    onMount(() => {
        const storedUser = localStorage.getItem('aktualnyPouzivatel');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            aktualnyPouzivatel.set(user);
        }
    });



    async function handleLogin(event) {
        event.preventDefault(); // Prevent the default form submission behavior

        const prihlasovacieUdaje = {
            user_name: user_name, // Populate username field
            password: password // Populate password field

        };

        try {
            const response = await fetch('http://localhost:8080/pouzivatel/authorise', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(prihlasovacieUdaje)
            });

            if (response.ok) {

                const userData = await response.json();

                console.log('Fetched user:', userData);  // Check if 'id' is present

                if (!userData.id_pouzivatela) {
                    throw new Error('ID is missing from the response');
                }

                const user = {
                     id_pouzivatela: userData.id_pouzivatela,
                    user_name: user_name,
                    role: userData.role,
                    email: userData.email,
                    meno: userData.meno,
                    priezvisko: userData.priezvisko,
                    prihlaseny: true,
                    telCislo: userData.telCislo,
                    ulica: userData.ulica,
                    popisneCislo: userData.popisneCislo,
                    mesto: userData.mesto



                };
                aktualnyPouzivatel.set(user);
                localStorage.setItem('aktualnyPouzivatel', JSON.stringify(user));

                localStorage.setItem('savedUser_name', user_name);
                localStorage.setItem('savedPassword', password);

                // Fetch notifications
                const notificationsResponse = await fetch(`http://localhost:8080/notifications/user/${userData.id_pouzivatela}`);
                if (notificationsResponse.ok) {
                    const notificationsData = await notificationsResponse.json();
                    notifications.set(notificationsData);
                }


                console.log('Logged-in user:', user);
                goto('/profil'); // Redirect to the profile page

            } else {
                // Login failed, display error message
                const errorData = await response.json();
                errorMessage = "Zle pouzivatelske udaje";
                console.error('Login failed:', errorMessage);

                // Set error message and clear input fields-->
                user_name = '';
                password = '';

                // Debugging: Log the error message and current state
                console.log('Error message:', errorMessage);
                console.log('Username:', user_name);
                console.log('Password:', password);
            }
        } catch (error) {
            console.error('Error during login:', error);
            // Handle other potential errors, such as network issues
        }
    }

    // It should start with one or more non-whitespace characters (\S+).
    // Followed by the "@" symbol.
    //     Followed by one or more non-whitespace characters (\S+).
    // Followed by a dot (".").
    //     Ending with one or more non-whitespace characters (\S+).
    // Here are some examples of valid email addresses based on this regular expression:
    //
    //     example@email.com
    // user123@example.co.uk
    // john.doe@example-domain.com
    // And here are some examples of invalid email addresses:
    //
    //     example.com (missing "@" symbol)
    // user@example (missing top-level domain after the dot)
    // @example.com (missing local part before "@" symbol)

    function validateEmail(email) {
        const re = /\S+@\S+\.\S+/;
        return re.test(String(email).toLowerCase());
    }

    function validateUsername(username) {
        // Check if the username is at least 4 characters long
        return username.length >= 4;
    }


    function handleLogout() {
        aktualnyPouzivatel.set({
            id_pouzivatela: '',
            user_name: '',
            role: '',
            email: '',
            meno: '',
            priezvisko: '',
            telCislo: '',
            ulica: '',
            popisneCislo: '',
            mesto: '',
            prihlaseny: false
        });
        localStorage.removeItem('aktualnyPouzivatel');
        localStorage.removeItem('savedUser_name');
        localStorage.removeItem('savedPassword');
        user_name = '';
        password = '';
        goto('/login');

    }

    function toggleRegistrationForm() {
        showRegistrationForm = !showRegistrationForm;
    }


    async function handleRegistration(event) {
        event.preventDefault();

        const formElement = event.target;
        const formData = new FormData(formElement);


        const email = formData.get('email');
        const userName = formData.get('user_name');
        const role = formData.get('role').toUpperCase();


        if (!validateEmail(email)) {
            errorMessage = 'Invalid email format.';
            return;
        }

        if (!validateUsername(userName)) {
            errorMessage = 'Username must be at least 4 characters long.';
            return;
        }


        const registrationData = {
            meno: formData.get('meno'),
            priezvisko: formData.get('priezvisko'),
            email: formData.get('email'),
            user_name: formData.get('user_name'),
            heslo: formData.get('heslo'),
            telCislo: formData.get('telCislo'),
            ulica: formData.get('ulica'),
            popisneCislo: formData.get('popisneCislo'),
            mesto: formData.get('mesto'),
            role: role,

        };

        if (role === 'PACIENT') {
            registrationData.rodneCislo = formData.get('rodneCislo');
        } else if (role === 'LEKAR') {
            registrationData.specializacia = formData.get('specializacia');
            registrationData.typLekara = formData.get('typLekara');
        }



        try {
            const response = await fetch('http://localhost:8080/pouzivatel/uloz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Specify JSON content type
                },
                body: JSON.stringify(registrationData) // Convert form data to JSON string
            });
            if (response.ok) {

                user_name = formData.get('user_name'); // Update the value
                password = formData.get('heslo'); // Update the value

                await handleLogin(event); // Pass username and password to handleLogin function
                goto('/');
            } else {
                const errorData = await response.json();
                errorMessage = errorData.message || 'Something went wrong.';
                console.error('Registration failed:', errorMessage);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            errorMessage = 'Failed to register. Please try again later.';
        }

    }


    // Lifecycle hook - onMount
    onMount(() => {
        // Function body remains unchanged
    });
</script>

<style>
    .form-container {
        max-width: 600px;
        margin-top: 50px;
        margin-left: auto;
        margin-right: auto;
        /*margin: auto;*/
        padding: 50px;
        border-radius: 30px;
        /*box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);*/
        box-shadow: 0 6px 12px #264653;
        background-color: whitesmoke;
    }

    .form-container h1 {
        text-align: center;
        color: #333;
    }

    .form-container label {
        display: block;
        margin: 10px 0 5px;
        font-weight: bold;
    }

    .form-container input,
    .form-container select,
    .form-container button {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .form-container input:focus,
    .form-container select:focus,
    .form-container button:focus {
        border-color: #264653;
        outline: none;
    }

    .form-container button {
        background-color: #264653;
        color: #f4a261;
        border: none;
        cursor: pointer;

        padding: 10px 20px; /* Padding to make the button a bit larger */
        border-radius: 5px; /* Rounded corners */
        transition: background-color 0.3s ease, transform 0.3s ease; /* Smooth transitions */
    }


    .form-container button:hover {
        background-color: #264653;
        transform: scale(1.05); /* Slightly enlarges the button */
    }

    .form-container .error {
        color: red;
        margin-bottom: 15px;
    }

    .form-container .form-footer {
        text-align: center;
    }
</style>


<div class="form-container">
    <h1>LogIn</h1>
    <form on:submit={handleLogin}>
        <label for="user_name">Username:</label>
        <input type="text" id="user_name" bind:value={user_name} required>

        <label for="password">Heslo:</label>
        <input type="password" id="password" bind:value={password} required>

        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}

        <button type="submit">LogIn</button>
    </form>

    {#if $aktualnyPouzivatel.prihlaseny}
        <div class="form-footer">
            <button on:click={handleLogout}>LogOut</button>
        </div>
    {:else}
        <div class="form-footer">
            <button on:click={toggleRegistrationForm}>Register</button>
        </div>
    {/if}

    {#if showRegistrationForm}
        <h1>Register</h1>
        <form on:submit={handleRegistration} enctype="multipart/form-data">
            <label for="meno">Meno:</label>
            <input type="text" id="meno" name="meno" required>

            <label for="priezvisko">Priezvisko:</label>
            <input type="text" id="priezvisko" name="priezvisko" required>

            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>

            <label for="user_name">Username:</label>
            <input type="text" id="user_name" name="user_name" required>

            <label for="heslo">Heslo:</label>
            <input type="password" id="heslo" name="heslo" required>

            <label for="telCislo">Telefónne číslo:</label>
            <input type="text" id="telCislo" name="telCislo" required>

            <label for="ulica">Ulica:</label>
            <input type="text" id="ulica" name="ulica" required>

            <label for="popisne_cislo">Popisné číslo ulice:</label>
            <input type="text" id="popisneCislo" name="popisneCislo" required>

            <label for="psc">Mesto:</label>
            <input type="text" id="mesto" name="mesto" required>


            <label for="role">Role:</label>
            <select id="role" name="role" bind:value={formData.role} required>
                <option value="PACIENT">Pacient</option>
                <option value="LEKAR">Lekár</option>
            </select>

            {#if formData.role === 'PACIENT'}
                <label for="rodneCislo">Rodné číslo:</label>
                <input type="text" id="rodneCislo" name="rodneCislo">
            {/if}

            {#if formData.role === 'LEKAR'}
                <label for="specializacia">Špecializácia:</label>
                <input type="text" id="specializacia" name="specializacia">

                <label for="typLekara">Typ:</label>
                <select id="typLekara" name="typLekara" required>
                    <option value="VSEOBECNY_LEKAR">Všeobecný lekár</option>
                    <option value="ODBORNY_LEKAR">Špecialista</option>
                </select>
            {/if}


            <button type="submit">Register</button>
        </form>
    {/if}
</div>


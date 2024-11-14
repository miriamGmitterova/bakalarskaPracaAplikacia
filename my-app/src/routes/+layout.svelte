<script>

    import {onMount} from "svelte";
    import {aktualnyPouzivatel, notifications} from "./login/store.js";

    let user;
    let userNotifications = [];
    let isDropdownOpen = false; // For toggling dropdown visibility

    onMount(() => {
        const unsubscribeUser = aktualnyPouzivatel.subscribe(value => {
            user = value;
            if (user.prihlaseny) {
                fetch(`http://localhost:8080/notifications/user/${user.id_pouzivatela}`)
                    .then(response => response.json())
                    .then(data => {
                        notifications.set(data);
                        userNotifications = data;
                    }).catch(error => {
                    console.error("Error fetching notifications: ", error);
                    });
            }
        });

        return () => {
            unsubscribeUser();
        };
    });

    // Toggle dropdown visibility
    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }

    function markAsRead(id) {
        fetch(`http://localhost:8080/notifications/${id}/read`, {
            method: 'PUT'
        }).then(() => {
            // Update local state after marking as read
            userNotifications = userNotifications.map(notification =>
                notification.id_upozornenia === id
                    ? { ...notification, precitane: true }
                    : notification
            );
            updateNotificationCount();
        }).catch(error => {
            console.error("Error marking notification as read: ", error);
        });
    }

    function updateNotificationCount() {
        const unreadCount = userNotifications.filter(notification => !notification.precitane).length;
        notifications.set(userNotifications);  // Ensure the store is updated
        const notificationCountElement = document.querySelector('.notification-count');
        if (notificationCountElement) {
            notificationCountElement.textContent = unreadCount;
        }
    }

</script>


<header class="layout-header">
    <nav>
        <ul>
            <li><a href="/oNas">Hlavná stránka</a></li>
            <li><a href="/lekari">Lekári</a></li>
            {#if user?.prihlaseny}
                <li><a href="/login">LogIn</a></li>
                <li><a href="/profil">Profil</a></li>

                <li class="notification">
                    <a href="#" on:click={toggleDropdown}>
                        <i class="fas fa-bell"></i>
                        {#if userNotifications.filter(n => !n.precitane).length > 0}
                            <span class="notification-count">{userNotifications.filter(n => !n.precitane).length}</span>
                        {/if}
                    </a>
                    {#if isDropdownOpen}
                        <div class="dropdown">
                            {#if userNotifications.length > 0}
                                <ul>
                                    {#each userNotifications as notification}
                                        <li class:read={notification.precitane} class:unread={!notification.precitane}>
                                            {notification.sprava}
                                            {#if !notification.precitane}
                                            {/if}

                                            {#if !notification.precitane}
                                                <button on:click={() => markAsRead(notification.id_upozornenia)}>
                                                    Označiť ako prečítané
                                                </button>
                                            {/if}
                                        </li>
                                    {/each}
                                </ul>
                            {:else}
                                <p>Nemáte žiadne upozornenia.</p>
                            {/if}
                        </div>
                    {/if}
                </li>
            {:else}
                <li><a href="/login">LogIn</a></li>
            {/if}
        </ul>
    </nav>
</header>

<slot />

<footer class="layout-footer">Správa pacientov všeobecných lekárov a špecialistov</footer>


<style>

    html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    main {
        flex: 1;
    }

    .layout-header {
        background-color: #264653;
        color: #f4a261;
        font-size: 25px;
        text-align: center;
        padding: 17px 0;
        border-bottom: 10px solid #264653; /* Thicker border */
    }

    .layout-header nav ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: flex;
        justify-content: center;
        flex-wrap: wrap; /* Allows wrapping for responsiveness */
    }

    .layout-header nav ul li {
        margin: 0 100px; /* Consistent spacing between links */
    }

    .layout-header nav ul li a {
        font-size: 22px; /* Larger font size for links */
        text-decoration: none; /* Remove underline */
        color: inherit; /* Inherit parent color */
        transition: font-size 0.2s ease-in-out, color 0.2s ease-in-out; /* Add transition effect */
    }

    .layout-header nav ul li a:hover {
        font-size: 30px; /* Increase font size on hover */
        color: #d0874a; /* Change text color on hover */
    }



      .layout-footer {
          background-color: #264653;
          color: #f4a261;
          font-size: 20px;
          text-align: center;
          padding: 15px 0;
          border-top: 10px solid #264653; /* Thicker border */
          position: fixed;
          bottom: 0;
          width: 100%;
    }

    .notification {
        position: relative;
        cursor: pointer;
    }

    .notification-count {
        position: absolute;
        top: -5px;
        right: -10px;
        background-color: red;
        color: white;
        border-radius: 50%;
        padding: 2px 5px;
        font-size: 0.8rem;
    }

    .dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: #ffffff;
        border: 1px solid #ffffff;
        /*box-shadow: 0 4px 8px rgba(0,0,0,0.1);*/
        box-shadow: 0 6px 12px #264653;
        width: 600px; /* Increased width */
        max-height: 750px;
        overflow-y: auto;
        z-index: 1000;
        border-radius: 8px;
        transition: font-size 0.2s ease-in-out, color 0.2s ease-in-out; /* Add transition effect */
    }

    .dropdown ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    .dropdown ul li {
        padding: 15px;
        border-bottom: 1px solid #d0874a;
        display: flex;
        align-items: center; /* Align items to center */
        color: black;
        flex-direction: column;
        font-size: 20px; /* Adjust font size if needed */
        width: 400px;

    }

    .dropdown ul li:last-child {
        border-bottom: 3px solid #d0874a;
    }
    .dropdown ul li:first-child {
        border-top: 3px solid #d0874a;
    }

    .dropdown p {
        margin: 0;
        font-size: 1rem;
    }

    .notification-text {
        flex-grow: 1; /* Allow text to take up available space */
    }

    .dropdown button {
        background-color: #264653;
        color: #f6a765;
        border: none;
        margin-top: 10px;
        padding: 0.5em 1em;
        border-radius: 4px;
        cursor: pointer;
        /*transition: background-color 0.3s;*/
        transition: font-size 0.2s ease-in-out, color 0.2s ease-in-out; /* Add transition effect */
        align-self: flex-start;
    }

    .dropdown button:hover {
        background-color: #1d3a3a;
        color: #d0874a;
        transform: scale(1.05);
        transition: font-size 0.2s ease-in-out, color 0.2s ease-in-out; /* Add transition effect */
    }

    .unread-badge {
        color: #e11d1d;
        font-size: 0.9rem;
        margin-left: 200px;
    }

    .read {
        background-color: #ffffff;
    }

    .unread {
        background-color: #bde5b8;
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
        .dropdown {
            width: 90%;
            left: 50%;
            transform: translateX(-50%);
        }

        .dropdown ul li {
            font-size: 16px;
            padding: 10px;
        }

        .dropdown button {
            padding: 0.4em 0.8em;
        }
    }

    @media (max-width: 480px) {
        .dropdown ul li {
            font-size: 14px;
            padding: 8px;
        }

        .dropdown button {
            padding: 0.3em 0.6em;
        }
    }
</style>


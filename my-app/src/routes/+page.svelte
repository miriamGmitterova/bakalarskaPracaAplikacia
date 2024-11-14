
<script>
    import { goto } from '$app/navigation'; // Import the navigation function

    function redirectToLogin() {
        goto('/login') // Navigate to the login page
    }
</script>

<html lang="sk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vitajte v aplikácii HealthCare</title>
    <style>
        body {
            /*font-family: Arial, sans-serif;*/
            margin: 0;
            padding: 0;
            background-color: white;
        }
        .header {
            background-color: #264653;
            color: white;
            padding: 1rem 2rem;
            text-align: center;
        }
        .nav {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
        }
        .nav a {
            color: white;
            text-decoration: none;
            font-weight: bold;
        }
        .hero {
            font-family: Arial, sans-serif;
            background-color: #d0874a;
            color: white;
            text-align: center;
            padding: 4rem 2rem;
        }
        .hero h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .hero p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .cta-button {
            background-color: #264653;
            color: white;
            border: none;
            padding: 1rem 2rem; /* Increased padding */
            font-size: 1.2rem; /* Larger font size */
            cursor: pointer;
            border-radius: 6px;
            /*transition: background-color 0.3s;*/
            transition: background-color 0.3s, border-color 0.3s, transform 0.3s; /* Add transition for transform */
        }
        .cta-button:hover {
            background-color: #1d3a3a; /* Darker shade of teal on hover */
            border-color: #1d3a3a; /* Matching border color on hover */
            transform: scale(1.1); /* Scale the button to 110% of its original size */
        }
        .features {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            gap: 2rem;
            padding: 2rem;
            background-color: #ffffff;

            box-shadow: 0 6px 12px #d0874a;
        }
        .feature {
            background-color: #ffffff;
            border-radius: 8px;
            /*box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);*/
            padding: 1rem;
            text-align: center;
            /*transform: translateY(-5px);*/
            box-shadow: 0 6px 12px #264653;
        }
        .feature img {
            width: 50px;
            height: 50px;
            margin-bottom: 1rem;
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
    </style>
</head>
<body>

<section class="hero">
    <h1>Vitajte v aplikácii HealthCare</h1>
    <p>Vaše zdravie je našou prioritou. Rezervujte si stretnutia s najlepšími lekármi a efektívne spravujte svoje zdravie.</p>
    <button class="cta-button" on:click={redirectToLogin}>Začať</button>

</section>

<section class="features">
    <div class="feature">
        <h3>Nájdite lekárov</h3>
        <p>Vyhľadávajte lekárov podľa špecializácie a lokality.</p>
    </div>
    <div class="feature">
        <h3>Rezervujte stretnutia</h3>
        <p>Jednoducho plánujte stretnutia a dostávajte pripomienky.</p>
    </div>
    <div class="feature">
        <h3>Spravujte zdravotné záznamy</h3>
        <p>Sledujte svoje zdravotné záznamy a prezrite si ich kedykoľvek.</p>
    </div>
</section>



</body>
</html>

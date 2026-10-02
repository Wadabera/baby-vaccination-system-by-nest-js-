<?php
session_start();

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    // If not logged in, redirect to the login page
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Infant Vaccination</title>
    <link rel="stylesheet" href="styles.css">
    
    <style>
        /* Global styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Arial', sans-serif;
        }

        /* Body and background */
        body {
            background-image: url('family-6719424_1280.png');
            background-size: cover;
            background-position: center;
            color: #fff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            transition: all 0.5s ease;
        }

        /* Navbar styles */
        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 40px;
            width: 100%;
            height: 80px;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 10;
            background: linear-gradient(to right, #121212, #1c1c1c);
            margin-top: 0;
            transition: all 0.3s ease-in-out;
        }

        .navbar .logo {
            color: #00ff99;
            font-size: 1.5rem;
            font-weight: bold;
        }

        .nav-links {
            list-style: none;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .nav-links li {
            margin-left: 30px;
        }

        .nav-links a {
            text-decoration: none;
            color: #fff;
            font-size: 18px;
            position: relative;
            padding: 5px 10px;
            transition: all 0.3s ease;
        }

        /* Hover effects */
        .nav-links a:hover {
            color: #00ff99;
            box-shadow: 0 0 20px rgba(0, 255, 153, 0.6);
            transform: scale(1.1);
        }

        /* Neon glow and transition effects */
        .nav-links a::before {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 2px;
            background: #00ff99;
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }

        .nav-links a:hover::before {
            transform: scaleX(1);
        }

        /* Main section */
        .main-section {
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 150px 20px;
            animation: fadeIn 2s ease-in-out;
        }

        .content h1 {
            font-size: 4rem;
            margin-bottom: 20px;
            text-transform: uppercase;
            color: #00ff99;
            letter-spacing: 5px;
            text-shadow: 0 0 15px rgba(0, 255, 153, 0.7);
            animation: glowText 2s ease-in-out infinite alternate;
        }

        .content p {
            font-size: 1.5rem;
            color: #ddd;
            margin-top: 10px;
        }

        /* Fade-in Animation for image */
        .vaccination-image {
            opacity: 0;
            animation: fadeInImage 2s ease-in-out forwards;
            width: 100%;
            max-width: 600px;
            margin-top: 50px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 255, 153, 0.4);
        }

        @keyframes fadeInImage {
            0% {
                opacity: 0;
                transform: translateY(50px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Glow Text Animation */
        @keyframes glowText {
            0% {
                text-shadow: 0 0 10px #00ff99, 0 0 20px #00ff99, 0 0 30px #00ff99;
            }
            100% {
                text-shadow: 0 0 20px #00ff99, 0 0 40px #00ff99, 0 0 60px #00ff99;
            }
        }

        /* Fade-in Animation */
        @keyframes fadeIn {
            0% {
                opacity: 0;
                transform: translateY(50px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Disease Cards Styles */
        .disease-info {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-top: 80px;
            width: 90%;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }

        .disease-card {
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 15px;
            width: 250px;
            margin: 20px;
            padding: 30px;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
            box-shadow: 0px 0px 15px rgba(0, 255, 153, 0.2);
            color: #fff;
            font-size: 1.2rem;
        }

        /* Hover effects for cards */
        .disease-card:hover {
            transform: translateY(-10px);
            background-color: rgba(0, 255, 153, 0.2);
            box-shadow: 0px 10px 30px rgba(0, 255, 153, 0.4);
        }

        /* Disease Title */
        .disease-title {
            color: #00ff99;
            font-size: 1.5rem;
            margin-bottom: 15px;
            text-shadow: 0 0 10px rgba(0, 255, 153, 0.8);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .disease-card {
                width: 100%;
            }

            .content h1 {
                font-size: 3rem;
            }

            .content p {
                font-size: 1.2rem;
            }

            .navbar {
                padding: 15px 20px;
                height: 70px;
            }

            .nav-links li {
                margin-left: 20px;
            }

            .nav-links a {
                font-size: 16px;
            }

            .disease-info {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 480px) {
            .navbar {
                flex-direction: column;
                align-items: center;
                height: auto;
            }

            .nav-links {
                flex-direction: column;
                align-items: center;
                margin-top: 10px;
            }

            .nav-links li {
                margin: 10px 0;
            }

            .content h1 {
                font-size: 2.5rem;
            }

            .disease-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>

    <!-- Navigation Bar -->
    <header>
        <nav class="navbar">
            <div class="logo">
                <div class="logo-text">Infant Vaccination</div>
            </div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <?php if (!isset($_SESSION['user_id'])): ?>
                    <li><a href="./login.php">Login</a></li>
                    <li><a href="./index.php">News</a></li>
                <?php else: ?>
                    <li><a href="./logout.php">Logout</a></li>
                    <li><a href="./dashboard.php">Dashboard</a></li>
                <?php endif; ?>
                <li><a href="./about.php">About</a></li>
            </ul>
        </nav>
    </header>

    <!-- Main Content -->
    <section id="home" class="main-section">
        <div class="content">
            <h1>Welcome to Infant Vaccination</h1>
            <p>Ensuring the health of your little one with the best vaccination programs.</p>
        </div>
    </section>

    <!-- Common Diseases and Vaccinations Info -->
    <section id="about" class="disease-info">
        <div class="disease-card">
            <h3 class="disease-title">Measles</h3>
            <p>A highly contagious viral disease that causes rash and fever. <br> Vaccine: MMR (Measles, Mumps, and Rubella)</p>
        </div>
        <div class="disease-card">
            <h3 class="disease-title">Polio</h3>
            <p>A viral disease that affects the nervous system and can cause paralysis. <br> Vaccine: Polio vaccine (IPV or OPV)</p>
        </div>
        <div class="disease-card">
            <h3 class="disease-title">Tuberculosis (TB)</h3>
            <p>A bacterial infection that primarily affects the lungs. <br> Vaccine: BCG vaccine</p>
        </div>
        <div class="disease-card">
            <h3 class="disease-title">Diphtheria</h3>
            <p>A bacterial infection that causes breathing problems and heart failure. <br> Vaccine: DTP (Diphtheria, Tetanus, and Pertussis)</p>
        </div>
        <div class="disease-card">
            <h3 class="disease-title">Hepatitis B</h3>
            <p>A viral infection that affects the liver. <br> Vaccine: Hepatitis B vaccine</p>
        </div>
        <div class="disease-card">
            <h3 class="disease-title">Hepatitis A</h3>
            <p>A viral infection causing liver inflammation. <br> Vaccine: Hepatitis A vaccine</p>
        </div>
        <div class="disease-card">
            <h3 class="disease-title">Tetanus</h3>
            <p>A bacterial infection that causes painful muscle spasms. <br> Vaccine: Tetanus vaccine</p>
        </div>
        <div class="disease-card">
            <h3 class="disease-title">Whooping Cough</h3>
            <p>A highly contagious respiratory disease. <br> Vaccine: DTP (Diphtheria, Tetanus, Pertussis)</p>
        </div>
         <div class="disease-card">
            <h3 class="disease-title">Whooping Cough</h3>
            <p>A highly contagious respiratory disease. <br> Vaccine: DTP (Diphtheria, Tetanus, Pertussis)</p>
        </div>
    </section>
</body>
</html>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <title>Admin UI - About</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
  <style>
    /* Body and Background Gradient */
    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #1e3c72, #2a5298);
      margin: 0;
      padding: 0;
      color: #09122C;
      background-size: cover;
    }

    /* Navbar */
    nav {
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
      background: linear-gradient(135deg, #1e3c72, #2a5298);
    }

    .navbar-dark .navbar-nav .nav-link {
      color: white;
      transition: all 0.3s ease;
    }

    .navbar-dark .navbar-nav .nav-link:hover {
      color: #f39c12;
      text-shadow: 0 0 10px #f39c12;
      transform: scale(1.1);
    }

    /* Header */
    #main-header {
      background: rgba(0, 123, 255, 0.8);
      color: white;
      padding: 40px 0;
      text-shadow: 0px 0px 20px rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    /* About Section */
    #about {
      padding: 80px 0;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      box-shadow: 0px 6px 20px rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(15px);
      transition: all 0.3s ease-in-out;
    }

    #about:hover {
      box-shadow: 0px 6px 25px rgba(255, 255, 255, 0.5);
    }

    /* Image Effects */
    .img-fluid {
      border-radius: 15px;
      box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      margin:12px;
      
    }

    .img-fluid:hover {
      transform: scale(1.05);
      box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.5);
    }

    /* Button Styles */
    .btn-custom {
      background: linear-gradient(135deg, #ff7e5f, #feb47b);
      color: white;
      font-size: 1.2em;
      padding: 12px 30px;
      border-radius: 40px;
      border: none;
      transition: all 0.3s ease;
      box-shadow: 0px 0px 10px rgba(255, 126, 95, 0.6);
    }

    .btn-custom:hover {
      background: linear-gradient(135deg, #ff6a00, #ee0979);
      transform: translateY(-5px);
      box-shadow: 0px 0px 20px rgba(255, 106, 0, 0.8);
    }

    /* Footer */
    #main-footer {
   background: linear-gradient(135deg, #1e3c72, #2a5298);
      padding: 30px 0;
      color: white;
      margin-bottom:0px;
    }

  

    /* Neon Glow Effect */
    .neon-glow {
      text-shadow: 0 0 15px #00ff99, 0 0 30px #00ff99, 0 0 45px #00ff99, 0 0 60px #00ff99;
    }

    /* Hover Effect on Nav */
    .nav-link:hover {
      text-shadow: 0 0 25px #f39c12, 0 0 50px #f39c12, 0 0 75px #f39c12;
    }

    /* Additional section styles */
    .section-title {
      color: #00ff99;
      font-size: 2em;
      margin-bottom: 20px;
      text-shadow: 0 0 15px rgba(0, 255, 153, 0.7);
    }

    .section-text {
      font-size: 1.2em;
      margin-bottom: 40px;
      line-height: 1.6;
      color: #ddd;
    }
    p{
    font-family: timely, sans-serif;
    color:#1A1A1D!important;
    font-size: 1.2em;
    }
  </style>
</head>

<body>
  <!-- Navbar -->
  <nav class="navbar navbar-expand-sm navbar-dark">
    <div class="container">
      <a href="#" class="navbar-brand neon-glow">Infant Immunization</a>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ml-auto">
          <li class="nav-item">
            <a href="./newhome.php" class="nav-link btn-custom">HOME</a>
          </li>
          <li class="nav-item active">
            <a href="login.php" class="nav-link btn-custom">Login</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <!-- Image -->
    <img src="JIMMA.png" alt="About Image" class="img-fluid mt-4">
  </section>

  <!-- Main Header -->
  <header id="main-header" class="py-2 text-center">
    <h1 class="neon-glow">About</h1>
  </header>

  <!-- About Section -->
  <section id="about" class="container mt-5 text-center">
    <h2 class="section-title">About Jimma Referral Hospital</h2>
    <p class="section-text">Jimma Referral Hospital is one of the leading healthcare institutions in Ethiopia. Established with the aim of providing high-quality medical services, the hospital has gained recognition for its exceptional staff, advanced medical technologies, and patient care.</p>
    <p class="section-text">Located in Jimma, the hospital serves as a referral center for many healthcare providers across the region. It offers a wide range of services, including pediatric care, surgery, and specialized treatments, and is committed to improving the health and well-being of the community.</p>
    
    <h2 class="section-title">Infant Vaccination at Jimma Referral Hospital</h2>
    <p class="section-text">Infant vaccination is a key component of the healthcare services provided at Jimma Referral Hospital. Vaccination programs aim to protect children from a variety of preventable diseases, including measles, polio, tuberculosis, and whooping cough. The hospital provides routine immunizations according to national health guidelines and the World Health Organization (WHO) standards.</p>
    <p class="section-text">Through effective vaccination programs, Jimma Referral Hospital has played an important role in reducing the incidence of infectious diseases and ensuring that infants receive the best start to their health. The hospital emphasizes the importance of timely vaccination and works with parents to ensure that their children are fully protected against common childhood diseases.</p>
    <p class="section-text">The hospital’s pediatric care unit is well-equipped to handle infant vaccinations, and experienced healthcare professionals are always available to provide guidance and assistance. Immunization records are carefully maintained, and follow-up services are available to monitor the child’s health after vaccinations.</p>

    

  <!-- Footer -->
  <footer id="main-footer" class="text-center mt-5">
    <p>© 2024 All rights reserved</p>
  </footer>
</body>

</html>
